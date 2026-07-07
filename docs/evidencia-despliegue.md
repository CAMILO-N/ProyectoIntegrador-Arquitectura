# Evidencia de despliegue — Integrante 1

**Fecha de la prueba:** 2026-07-07
**Comando ejecutado:** `docker compose down -v && docker compose up --build -d` (build limpio, sin cache de contenedores/volumenes previos)

## 1. Bugs encontrados y corregidos

Al levantar el proyecto desde cero se encontraron y corrigieron 2 bugs que impedian que el flujo funcionara correctamente en un `docker compose up --build` limpio:

### Bug 1 — Condicion de carrera en el arranque (RabbitMQ/Postgres)

`docker-compose.yml` usaba `depends_on` sin healthchecks. Docker marca un contenedor como "up" apenas el proceso arranca, no cuando el servicio esta realmente listo para aceptar conexiones. Postgres tarda unos segundos en inicializar y RabbitMQ tarda ~10s en levantar el listener AMQP (puerto 5672) despues de que el proceso ya esta corriendo.

Resultado observado antes del fix:
```
educonecta-estudiantes  | app-estudiantes: error conectando a RabbitMQ: connect ECONNREFUSED 172.18.0.3:5672
educonecta-estudiantes  | app-estudiantes escuchando en puerto 3001 (sin cola)
educonecta-certificados | app-certificados: error iniciando el consumidor de cola: connect ECONNREFUSED 172.18.0.3:5672
```
Las apps quedaban permanentemente sin conexion a la cola (no habia reintentos), por lo que el certificado automatico nunca se generaba.

**Fix aplicado:**
- `docker-compose.yml`: se agregaron `healthcheck` a `postgres` (`pg_isready`) y `rabbitmq` (`rabbitmq-diagnostics ping`), y se cambio `depends_on` de la forma simple a `condition: service_healthy` en `app-estudiantes`, `app-docentes` y `app-certificados`.
- `app-estudiantes/src/queue.js` y `app-certificados-lambda/src/consumer.js`: se agrego logica de reintento con backoff (10 intentos, 3s de espera) en la conexion a RabbitMQ, ya que se confirmo que incluso el healthcheck de RabbitMQ puede reportar "healthy" unos segundos antes de que el listener AMQP acepte conexiones.

### Bug 2 — Ruta inconsistente en `app-certificados-lambda`

El API Gateway reescribe `/api/certificados/*` quitando el prefijo completo (`pathRewrite: { '^/api/certificados': '' }`), igual que hace con `/api/estudiantes` y `/api/docentes`. Sin embargo, `app-certificados-lambda/src/index.js` exponia la ruta como `/certificados/:estudianteId` en vez de `/:estudianteId`, rompiendo la consistencia con los otros dos servicios y devolviendo 404 en `GET /api/certificados/{id}`.

**Fix aplicado:** se cambio la ruta a `app.get('/:estudianteId', ...)` para que coincida con el patron usado por `app-estudiantes` y `app-docentes`.

## 2. Estado de los 6 contenedores (build limpio)

```
NAME                      IMAGE                                              STATUS                   PORTS
educonecta-certificados   proyectointegrador-arquitectura-app-certificados   Up 3 minutes             0.0.0.0:3003->3003/tcp
educonecta-db             postgres:16-alpine                                 Up 3 minutes (healthy)   0.0.0.0:5432->5432/tcp
educonecta-docentes       proyectointegrador-arquitectura-app-docentes       Up 3 minutes             0.0.0.0:3002->3002/tcp
educonecta-estudiantes    proyectointegrador-arquitectura-app-estudiantes    Up 3 minutes             0.0.0.0:3001->3001/tcp
educonecta-gateway        proyectointegrador-arquitectura-api-gateway        Up 3 minutes             0.0.0.0:8080->8080/tcp
educonecta-queue          rabbitmq:3.13-management-alpine                    Up 3 minutes (healthy)   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
```

Logs relevantes de arranque (reintentos funcionando correctamente):
```
educonecta-gateway       | api-gateway escuchando en puerto 8080
educonecta-docentes      | app-docentes escuchando en puerto 3002
educonecta-estudiantes   | app-estudiantes: intento 1/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-estudiantes   | app-estudiantes: intento 2/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-estudiantes   | app-estudiantes: intento 3/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-estudiantes   | app-estudiantes: conectado a RabbitMQ
educonecta-estudiantes   | app-estudiantes escuchando en puerto 3001
educonecta-certificados  | app-certificados escuchando en puerto 3003
educonecta-certificados  | app-certificados: intento 1/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-certificados  | app-certificados: intento 2/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-certificados  | app-certificados: intento 3/10 de conexion a RabbitMQ fallo: connect ECONNREFUSED 172.18.0.2:5672
educonecta-certificados  | app-certificados: escuchando la cola curso.completado
```

## 3. Flujo de prueba end-to-end (caso del certificado automatico)

Ejecutado inmediatamente despues de un `docker compose down -v && docker compose up --build -d` limpio.

**1. Listar cursos disponibles**
```
GET http://localhost:8080/api/estudiantes/cursos
→ [{"id":1,"titulo":"Diseno de Objetos de Aprendizaje","descripcion":"Curso introductorio de OA","docente_id":1,"creado_en":"2026-07-07T18:54:54.264Z"}]
```

**2. Inscribir estudiante en el curso**
```
POST http://localhost:8080/api/estudiantes/inscripciones
Body: {"estudiante_id":1,"curso_id":1}
→ {"id":1,"estudiante_id":1,"curso_id":1,"progreso":0,"completado":false,"inscrito_en":"2026-07-07T18:58:10.175Z"}
```

**3. Actualizar progreso a 100 (dispara el evento `curso.completado`)**
```
PATCH http://localhost:8080/api/estudiantes/inscripciones/1/progreso
Body: {"progreso":100}
→ {"id":1,"estudiante_id":1,"curso_id":1,"progreso":100,"completado":true,"inscrito_en":"2026-07-07T18:58:10.175Z"}
```

**4. app-certificados consume el evento y genera el certificado (logs del contenedor)**
```
educonecta-estudiantes   | app-estudiantes: evento publicado en curso.completado {...}
educonecta-certificados  | app-certificados: certificado generado CERT-1-1-FC8EF27D para estudiante 1
educonecta-certificados  | app-certificados: notificacion enviada (simulada) a estudiante 1
```

**5. Confirmar que el certificado se genero**
```
GET http://localhost:8080/api/certificados/1
→ [{"id":1,"estudiante_id":1,"curso_id":1,"codigo":"CERT-1-1-FC8EF27D","emitido_en":"2026-07-07T18:58:10.272Z"}]
```

✅ **Resultado: flujo end-to-end exitoso.**

## 4. Verificaciones adicionales

**Endpoints de docentes:**
```
GET http://localhost:8080/api/docentes/cursos
→ [{"id":1,"titulo":"Diseno de Objetos de Aprendizaje", ...}]

GET http://localhost:8080/api/docentes/cursos/1/estudiantes
→ [{"id":1,"nombre":"Estudiante Demo","email":"demo@udla.edu.ec","progreso":100,"completado":true}]
```

**Health checks de los 4 servicios HTTP:**
```
gateway:      {"status":"ok","servicio":"api-gateway"}
estudiantes:  {"status":"ok","servicio":"app-estudiantes"}
docentes:     {"status":"ok","servicio":"app-docentes"}
certificados: {"status":"ok","servicio":"app-certificados"}
```

**Documentacion Swagger servida por el gateway:**
```
GET http://localhost:8080/docs → HTTP 200, <title>Swagger UI</title>
```

## 5. Publicacion en SwaggerHub

El contrato `api-gateway/openapi.yaml` fue importado y publicado en SwaggerHub (organizacion UDLA) con visibilidad **Public**.

**URL publica:**
```
https://app.swaggerhub.com/apis/udla-735/educonecta-api/1.0.0
```

Verificado en una ventana de navegacion privada (sin sesion iniciada): la documentacion completa (Swagger UI con los 3 grupos de endpoints — Estudiantes, Docentes, Certificados) carga correctamente en modo lectura, confirmando que es accesible publicamente sin necesidad de login.

## 6. Conclusion

El ecosistema completo (6 contenedores: postgres, rabbitmq, api-gateway, app-estudiantes, app-docentes, app-certificados) levanta sin errores desde cero con `docker compose up --build`, y el flujo de negocio principal (inscripcion → progreso → certificado automatico via cola de eventos) funciona de punta a punta a traves del API Gateway.
