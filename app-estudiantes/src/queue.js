const amqp = require('amqplib');

const QUEUE_NAME = 'curso.completado';
let channel;

async function connectQueue() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log('app-estudiantes: conectado a RabbitMQ');
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
