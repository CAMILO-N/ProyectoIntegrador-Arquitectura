-- EduConecta: esquema inicial de la capa de datos

CREATE TABLE IF NOT EXISTS estudiantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cursos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  docente_id INTEGER,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inscripciones (
  id SERIAL PRIMARY KEY,
  estudiante_id INTEGER REFERENCES estudiantes(id),
  curso_id INTEGER REFERENCES cursos(id),
  progreso INTEGER DEFAULT 0,
  completado BOOLEAN DEFAULT FALSE,
  inscrito_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificados (
  id SERIAL PRIMARY KEY,
  estudiante_id INTEGER REFERENCES estudiantes(id),
  curso_id INTEGER REFERENCES cursos(id),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  emitido_en TIMESTAMP DEFAULT NOW()
);

-- Datos de ejemplo para probar el flujo completo
INSERT INTO estudiantes (nombre, email) VALUES
  ('Estudiante Demo', 'demo@udla.edu.ec')
ON CONFLICT DO NOTHING;

INSERT INTO cursos (titulo, descripcion, docente_id) VALUES
  ('Diseno de Objetos de Aprendizaje', 'Curso introductorio de OA', 1)
ON CONFLICT DO NOTHING;
