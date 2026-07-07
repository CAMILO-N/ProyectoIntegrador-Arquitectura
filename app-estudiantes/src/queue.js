const amqp = require('amqplib');

const QUEUE_NAME = 'curso.completado';
let channel;

async function connectQueue(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log('app-estudiantes: conectado a RabbitMQ');
      return;
    } catch (err) {
      console.error(`app-estudiantes: intento ${attempt}/${retries} de conexion a RabbitMQ fallo: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function publicarCursoCompletado(payload) {
  if (!channel) {
    console.error('app-estudiantes: canal de RabbitMQ no disponible, evento no publicado');
    return;
  }
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
    persistent: true
  });
  console.log('app-estudiantes: evento publicado en', QUEUE_NAME, payload);
}

module.exports = { connectQueue, publicarCursoCompletado };
