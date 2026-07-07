const pool = require('./db');
const crypto = require('crypto');

/**
 * Handler estilo AWS Lambda: recibe un "event" y devuelve un resultado.
 * Esta funcion no sabe nada de RabbitMQ ni de Express: es logica pura.
 * Localmente se invoca desde consumer.js al consumir un mensaje de la cola.
 * En AWS se desplegaria igual, con un event source mapping de SQS hacia esta Lambda.
 */
exports.handler = async (event) => {
  const { estudiante_id, curso_id } = event;

  const codigo = `CERT-${curso_id}-${estudiante_id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const { rows } = await pool.query(
    'INSERT INTO certificados (estudiante_id, curso_id, codigo) VALUES ($1, $2, $3) RETURNING *',
    [estudiante_id, curso_id, codigo]
  );

  console.log(`app-certificados: certificado generado ${codigo} para estudiante ${estudiante_id}`);
  // Aqui iria el envio real de la notificacion (SES, nodemailer, etc.)
  console.log(`app-certificados: notificacion enviada (simulada) a estudiante ${estudiante_id}`);

  return { statusCode: 200, body: rows[0] };
};
