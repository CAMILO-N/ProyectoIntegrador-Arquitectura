# EduConecta — ecosistema de ejemplo (ISWZ2202)

Ecosistema de 3 aplicaciones mas un servicio estilo serverless, para el proyecto de Diseno y Arquitectura de Software.

## Servicios

| Servicio | Puerto | Descripcion |
|---|---|---|
| api-gateway | 8080 | Punto unico de entrada REST. Swagger en `/docs` |
| app-estudiantes | 3001 | Cursos, inscripciones, progreso. Publica el evento a la cola |
| app-docentes | 3002 | Gestion de cursos y consulta de estudiantes inscritos |
| app-certificados | 3003 | Servicio estilo Lambda: consume la cola y genera certificados |
| postgres | 5432 | Base de datos (capa de datos dockerizada) |
| rabbitmq | 5672 / 15672 | Gestor de colas (panel de administracion en :15672) |

## Como levantar el proyecto

```bash
docker compose up --build
```

Luego:
- Swagger: http://localhost:8080/docs
- RabbitMQ management: http://localhost:15672 (usuario: `educonecta`, clave: `educonecta_pass`)

## Flujo de prueba end-to-end (caso del certificado automatico)

1. `GET http://localhost:8080/api/estudiantes/cursos` — ver cursos disponibles (ya viene un curso y un estudiante de ejemplo, ambos con id 1)
2. `POST http://localhost:8080/api/estudiantes/inscripciones`
   ```json
   { "estudiante_id": 1, "curso_id": 1 }
   ```
3. `PATCH http://localhost:8080/api/estudiantes/inscripciones/1/progreso`
   ```json
   { "progreso": 100 }
   ```
   Esto publica el evento `curso.completado` en RabbitMQ.
4. app-certificados consume el evento y genera el certificado automaticamente (revisa los logs del contenedor `educonecta-certificados`).
5. `GET http://localhost:8080/api/certificados/1` — confirmar que el certificado se genero.

## Notas de arquitectura

- `app-certificados-lambda/src/handler.js` contiene la logica pura en formato compatible con AWS Lambda (`exports.handler`). Localmente se invoca desde `consumer.js`, que escucha RabbitMQ. En un despliegue real en AWS se reemplazaria por un event source mapping de SQS hacia esta misma funcion, sin tocar el handler.
- Cada capa de datos corre en su propio contenedor Docker, independiente de la logica de cada app.
- El API Gateway centraliza el acceso REST y ya sirve la documentacion Swagger desde `openapi.yaml` — listo para seguir ampliandolo a medida que agregues endpoints.

## Proximos pasos sugeridos

- Ampliar `openapi.yaml` con mas detalle (schemas de respuesta, ejemplos)
- Agregar autenticacion en el gateway (JWT)
- Diagramas C4 en Icepanel a partir de esta misma estructura de servicios
