const express = require('express');
const pool = require('./db');
const { iniciarConsumidor } = require('./consumer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'app-certificados' });
});

// Consultar los certificados emitidos a un estudiante
app.get('/certificados/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM certificados WHERE estudiante_id = $1 ORDER BY emitido_en DESC',
      [estudianteId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

iniciarConsumidor().catch((err) => {
  console.error('app-certificados: error iniciando el consumidor de cola:', err.message);
});

app.listen(PORT, () => console.log(`app-certificados escuchando en puerto ${PORT}`));
