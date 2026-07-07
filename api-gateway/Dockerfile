FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src ./src
COPY public ./public
COPY openapi.yaml ./openapi.yaml
EXPOSE 8080
CMD ["node", "src/index.js"]
