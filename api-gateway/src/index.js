const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 8080;

const ESTUDIANTES_URL = process.env.ESTUDIANTES_URL || 'http://app-estudiantes:3001';
const DOCENTES_URL = process.env.DOCENTES_URL || 'http://app-docentes:3002';
const CERTIFICADOS_URL = process.env.CERTIFICADOS_URL || 'http://app-certificados:3003';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'api-gateway' });
});

// Interfaz web de demostracion
app.use(express.static(path.join(__dirname, '..', 'public')));

// Documentacion Swagger centralizada
const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
const swaggerDocument = YAML.load(openapiPath);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Enrutamiento centralizado hacia cada microservicio
app.use('/api/estudiantes', createProxyMiddleware({
  target: ESTUDIANTES_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/estudiantes': '' }
}));

app.use('/api/docentes', createProxyMiddleware({
  target: DOCENTES_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/docentes': '' }
}));

app.use('/api/certificados', createProxyMiddleware({
  target: CERTIFICADOS_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/certificados': '' }
}));

app.listen(PORT, () => console.log(`api-gateway escuchando en puerto ${PORT}`));
