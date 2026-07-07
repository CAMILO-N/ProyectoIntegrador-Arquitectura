const API = '/api';

// --- Tabs ---
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

async function llamarApi(metodo, ruta, body) {
  const res = await fetch(API + ruta, {
    method: metodo,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

// --- Estudiantes ---
async function cargarCursosEstudiante() {
  const ul = document.getElementById('lista-cursos-estudiante');
  ul.innerHTML = '<li>Cargando...</li>';
  try {
    const cursos = await llamarApi('GET', '/estudiantes/cursos');
    ul.innerHTML = cursos.length
      ? cursos.map((c) => `<li><strong>#${c.id}</strong> ${c.titulo} — ${c.descripcion || 'sin descripcion'}</li>`).join('')
      : '<li>No hay cursos registrados</li>';
  } catch (err) {
    ul.innerHTML = `<li class="err">Error: ${err.message}</li>`;
  }
}

document.getElementById('form-inscripcion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const estudiante_id = Number(document.getElementById('insc-estudiante-id').value);
  const curso_id = Number(document.getElementById('insc-curso-id').value);
  const salida = document.getElementById('resultado-inscripcion');
  salida.textContent = 'Enviando...';
  try {
    const data = await llamarApi('POST', '/estudiantes/inscripciones', { estudiante_id, curso_id });
    salida.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    salida.textContent = 'Error: ' + err.message;
  }
});

document.getElementById('form-progreso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('progreso-inscripcion-id').value;
  const progreso = Number(document.getElementById('progreso-valor').value);
  const salida = document.getElementById('resultado-progreso');
  salida.textContent = 'Enviando...';
  try {
    const data = await llamarApi('PATCH', `/estudiantes/inscripciones/${id}/progreso`, { progreso });
    salida.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    salida.textContent = 'Error: ' + err.message;
  }
});

// --- Docentes ---
document.getElementById('form-curso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('curso-titulo').value;
  const descripcion = document.getElementById('curso-descripcion').value;
  const docente_id = Number(document.getElementById('curso-docente-id').value);
  const salida = document.getElementById('resultado-curso');
  salida.textContent = 'Enviando...';
  try {
    const data = await llamarApi('POST', '/docentes/cursos', { titulo, descripcion, docente_id });
    salida.textContent = JSON.stringify(data, null, 2);
    cargarCursosDocente();
  } catch (err) {
    salida.textContent = 'Error: ' + err.message;
  }
});

async function cargarCursosDocente() {
  const ul = document.getElementById('lista-cursos-docente');
  ul.innerHTML = '<li>Cargando...</li>';
  try {
    const cursos = await llamarApi('GET', '/docentes/cursos');
    ul.innerHTML = cursos.length
      ? cursos.map((c) => `<li><strong>#${c.id}</strong> ${c.titulo} — docente ${c.docente_id}</li>`).join('')
      : '<li>No hay cursos registrados</li>';
  } catch (err) {
    ul.innerHTML = `<li class="err">Error: ${err.message}</li>`;
  }
}

document.getElementById('form-estudiantes-curso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('ver-curso-id').value;
  const ul = document.getElementById('lista-estudiantes-curso');
  ul.innerHTML = '<li>Cargando...</li>';
  try {
    const estudiantes = await llamarApi('GET', `/docentes/cursos/${id}/estudiantes`);
    ul.innerHTML = estudiantes.length
      ? estudiantes.map((e) => `<li>${e.nombre} (${e.email}) — progreso ${e.progreso}% ${e.completado ? '✅' : ''}</li>`).join('')
      : '<li>Nadie inscrito todavia</li>';
  } catch (err) {
    ul.innerHTML = `<li class="err">Error: ${err.message}</li>`;
  }
});

// --- Certificados ---
document.getElementById('form-certificados').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cert-estudiante-id').value;
  const ul = document.getElementById('lista-certificados');
  ul.innerHTML = '<li>Cargando...</li>';
  try {
    const certificados = await llamarApi('GET', `/certificados/${id}`);
    ul.innerHTML = certificados.length
      ? certificados.map((c) => `<li><strong>${c.codigo}</strong> — curso ${c.curso_id} — emitido ${new Date(c.emitido_en).toLocaleString()}</li>`).join('')
      : '<li>Sin certificados emitidos aun</li>';
  } catch (err) {
    ul.innerHTML = `<li class="err">Error: ${err.message}</li>`;
  }
});

// --- Estado inicial ---
(async function init() {
  const estado = document.getElementById('estado-api');
  try {
    const res = await fetch('/health');
    const data = await res.json();
    estado.textContent = `API conectada (${data.servicio}: ${data.status})`;
    estado.classList.add('ok');
  } catch {
    estado.textContent = 'No se pudo conectar con la API';
    estado.classList.add('err');
  }
  cargarCursosEstudiante();
  cargarCursosDocente();
})();
