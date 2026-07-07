const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'app-docentes' });
});

// Crear un curso
app.post('/cursos', async (req, res) => {
  const { titulo, descripcion, docente_id } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO cursos (titulo, descripcion, docente_id) VALUES ($1, $2, $3) RETURNING *',
      [titulo, descripcion, docente_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los cursos
app.get('/cursos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cursos ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un curso existente
app.put('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE cursos SET titulo = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [titulo, descripcion, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ver los estudiantes inscritos en un curso y su progreso
app.get('/cursos/:id/estudiantes', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.nombre, e.email, i.progreso, i.completado
       FROM inscripciones i
       JOIN estudiantes e ON e.id = i.estudiante_id
       WHERE i.curso_id = $1`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`app-docentes escuchando en puerto ${PORT}`));
