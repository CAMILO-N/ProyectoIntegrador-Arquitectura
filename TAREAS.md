# Reparto de tareas pendientes — EduConecta (ISWZ2202)

> **Nota del equipo:** este archivo divide el trabajo pendiente del proyecto en 3 bloques equitativos, basados en la rubrica del curso. Cada integrante debe revisar cual bloque le toca (Integrante 1, 2 o 3) y trabajar especificamente en esas tareas, sin tocar las de los otros bloques. El codigo funcional del ecosistema (3 apps, Docker, cola, Lambda, API Gateway) ya esta construido — no hay que reescribirlo, solo documentarlo, verificarlo y diagramarlo.

## Ya esta hecho ✅

- Ecosistema de 3 apps (`app-estudiantes`, `app-docentes`, `app-certificados-lambda`) con funcionalidad basica
- Capa de datos en Docker (Postgres, ver `db/init.sql`)
- App serverless: `app-certificados-lambda/src/handler.js` (formato Lambda) + `consumer.js` (invocador local via cola)
- Gestor de colas: RabbitMQ, evento `curso.completado`
- API Gateway centralizado (`api-gateway/`), enruta las 3 apps
- Contrato OpenAPI completo con schemas: `api-gateway/openapi.yaml`
- Eleccion de arquitectura ya definida: microservicios + event-driven + API Gateway + serverless + database-per-service (falta redactarla como documento entregable — ver Integrante 3)

## Lo que falta, dividido en 3 bloques equitativos

Division basada en el peso de la rubrica (8 criterios, 10 pts totales). Cada bloque suma aprox. 3 puntos de peso.

---

### 🧩 Integrante 1 — Despliegue y publicacion de API
**Cubre criterio #5 (3 pts, el de mayor peso) y parte del #4**

- [x] Correr `docker compose up --build` desde cero y confirmar que los 6 contenedores levantan sin errores
- [x] Probar el flujo completo end-to-end (ver seccion "Flujo de prueba" en `README.md`): inscribir estudiante → actualizar progreso a 100 → confirmar que se genera el certificado
- [x] Documentar el resultado con capturas de pantalla o logs (evidencia de que "funciona y despliega") — ver [`docs/evidencia-despliegue.md`](docs/evidencia-despliegue.md)
- [x] Crear cuenta en [SwaggerHub](https://swaggerhub.com), importar `api-gateway/openapi.yaml`, publicar el API y guardar la URL publica — publicado en `https://app.swaggerhub.com/apis/udla-735/educonecta-api/1.0.0` (verificado publico en ventana de incognito)
- [x] Si algo falla al levantar el proyecto, corregir el bug (Dockerfile, variables de entorno, docker-compose.yml) — se encontraron y corrigieron 2 bugs, detallados en `docs/evidencia-despliegue.md`:
  1. Race condition en el arranque: `depends_on` no esperaba a que Postgres/RabbitMQ estuvieran realmente listos. Se agregaron healthchecks en `docker-compose.yml` y reintentos con backoff en `app-estudiantes/src/queue.js` y `app-certificados-lambda/src/consumer.js`.
  2. Ruta inconsistente en `app-certificados-lambda` que causaba 404 en `GET /api/certificados/{id}` a traves del gateway. Corregido en `app-certificados-lambda/src/index.js`.
- [x] Extra (no pedido originalmente, pero util para el C4 del Integrante 2): se agrego una interfaz web minima (`api-gateway/public/`) servida en `http://localhost:8080/` que consume las 3 APIs, para poder *ver* el flujo completo en el navegador en vez de solo con curl/Swagger.

**Pendiente de validar por el equipo:**
- [ ] Abrir `http://localhost:8080/` en un navegador y confirmar visualmente que las 3 pestañas (Estudiantes, Docentes, Certificados) funcionan correctamente (formularios, listas, flujo de certificado)
- [ ] Confirmar que la URL de SwaggerHub sigue siendo publica al momento de entregar (SwaggerHub esta en modo Trial — revisar que no expire antes de la entrega)
- [ ] Tomar capturas de pantalla de la interfaz web y del flujo funcionando, para reforzar la evidencia en `docs/evidencia-despliegue.md`

**Archivos relevantes:** `docker-compose.yml`, carpetas `app-*`, `api-gateway/openapi.yaml`, `api-gateway/public/`, `docs/evidencia-despliegue.md`, `README.md`

---

### 🧩 Integrante 2 — Diagramas de arquitectura
**Cubre criterios #1 (1 pt) y #3 (2 pts)**

- [ ] Modelar el sistema en C4 dentro de [Icepanel](https://icepanel.io): nivel de Contexto (usuarios + sistema) y nivel de Contenedores (las 3 apps + gateway + cola + base de datos)
- [ ] Diagrama de infraestructura y despliegue, basado en `docker-compose.yml` (mostrar contenedores, red `educonecta-net`, puertos expuestos, volumenes)
- [ ] Formalizar el diagrama de arquitectura general en una herramienta de entrega (draw.io, Lucidchart, o similar) mostrando: API Gateway, las 3 apps, la cola, y la capa de datos — usar como base los diagramas ya revisados en el chat del proyecto
- [ ] Exportar todos los diagramas en imagen o PDF para el entregable final

**Archivos relevantes:** `docker-compose.yml` (para infraestructura), estructura de carpetas del repo (para el C4 de contenedores)

---

### 🧩 Integrante 3 — Documentacion tecnica y diseno de procesos
**Cubre criterio #2 (2 pts), parte del #4, y criterios #6 y #7 (0.5 pts c/u)**

- [ ] Redactar la justificacion de la arquitectura elegida (microservicios + event-driven + API Gateway + serverless + database-per-service) — el "por que" de cada patron ya esta definido, solo falta pasarlo a documento formal
- [ ] Redactar el analisis tecnico de las 9 caracteristicas exigidas por el enunciado:
  - Cache
  - Balanceo de carga
  - Indexacion
  - Redundancia
  - Disponibilidad
  - Concurrencia
  - Latencia
  - Costo y proyeccion
  - Performance y escalabilidad
- [ ] Redactar (no implementar) el diseno del proceso de CI/CD: que pasos tendria un pipeline (build → test → build de imagenes Docker → deploy), puede incluir un diagrama simple del flujo
- [ ] Redactar (no implementar) el enfoque de monitoreo: que se monitorearia (los endpoints `/health` de cada servicio ya existen como base) y con que herramienta se haria en un entorno real (ej. Prometheus + Grafana, o CloudWatch si se llevara a AWS)

**Archivos relevantes:** todo el repo como referencia tecnica (no requiere modificar codigo, solo documentar sobre lo ya construido)

---

## Coordinacion

- Los 3 bloques son independientes entre si — se pueden trabajar en paralelo sin bloquearse
- Si alguien termina antes, puede ayudar a validar el trabajo de otro bloque (ej. Integrante 1 revisando que los diagramas de Integrante 2 coincidan con la infraestructura real)
- Todo el codigo fuente vive en este repo; los diagramas y documentos redactados pueden entregarse como archivos separados (PDF/imagenes) o agregarse a una carpeta `docs/` dentro del repo
