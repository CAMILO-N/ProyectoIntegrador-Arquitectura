const express = require('express');
const pool = require('./db');
const { connectQueue, publicarCursoCompletado } = require('./queue');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'app-estudiantes' });
});

// Listar cursos disponibles
app.get('/cursos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cursos ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inscribir a un estudiante en un curso
app.post('/inscripciones', async (req, res) => {
  const { estudiante_id, curso_id } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO inscripciones (estudiante_id, curso_id) VALUES ($1, $2) RETURNING *',
      [estudiante_id, curso_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar el progreso de una inscripcion. Si llega a 100, dispara el evento a la cola.
app.patch('/inscripciones/:id/progreso', async (req, res) => {
  const { id } = req.params;
  const { progreso } = req.body;

  try {
    const completado = progreso >= 100;

    const { rows } = await pool.query(
      'UPDATE inscripciones SET progreso = $1, completado = $2 WHERE id = $3 RETURNING *',
      [progreso, completado, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inscripcion no encontrada' });
    }

    const inscripcion = rows[0];

    if (completado) {
      publicarCursoCompletado({
        estudiante_id: inscripcion.estudiante_id,
        curso_id: inscripcion.curso_id,
        inscripcion_id: inscripcion.id,
        fecha: new Date().toISOString()
      });
    }

    res.json(inscripcion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectQueue()
  .then(() => {
    app.listen(PORT, () => console.log(`app-estudiantes escuchando en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('app-estudiantes: error conectando a RabbitMQ:', err.message);
    app.listen(PORT, () => console.log(`app-estudiantes escuchando en puerto ${PORT} (sin cola)`));
  });
