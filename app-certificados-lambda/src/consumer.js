const amqp = require('amqplib');
const { handler } = require('./handler');

const QUEUE_NAME = 'curso.completado';

async function conectarConReintentos(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await amqp.connect(process.env.RABBITMQ_URL);
    } catch (err) {
      console.error(`app-certificados: intento ${attempt}/${retries} de conexion a RabbitMQ fallo: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function iniciarConsumidor() {
  const conn = await conectarConReintentos();
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log('app-certificados: escuchando la cola', QUEUE_NAME);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      await handler(event);
      channel.ack(msg);
    } catch (err) {
      console.error('app-certificados: error procesando evento:', err.message);
      // Se descarta el mensaje con error. En produccion conviene enviarlo a una dead-letter queue.
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { iniciarConsumidor };
