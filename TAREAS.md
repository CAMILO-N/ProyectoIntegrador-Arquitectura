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

- [ ] Correr `docker compose up --build` desde cero y confirmar que los 6 contenedores levantan sin errores
- [ ] Probar el flujo completo end-to-end (ver seccion "Flujo de prueba" en `README.md`): inscribir estudiante → actualizar progreso a 100 → confirmar que se genera el certificado
- [ ] Documentar el resultado con capturas de pantalla o logs (evidencia de que "funciona y despliega")
- [ ] Crear cuenta en [SwaggerHub](https://swaggerhub.com), importar `api-gateway/openapi.yaml`, publicar el API y guardar la URL publica
- [ ] Si algo falla al levantar el proyecto, corregir el bug (Dockerfile, variables de entorno, docker-compose.yml)

**Archivos relevantes:** `docker-compose.yml`, carpetas `app-*`, `api-gateway/openapi.yaml`, `README.md`

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
