const amqp = require('amqplib');
const { handler } = require('./handler');

const QUEUE_NAME = 'curso.completado';

async function iniciarConsumidor() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
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
