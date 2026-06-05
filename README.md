# AdoptMe API 🐾

**Autor:** Barclay Leach  
**País:** Perú 🇵🇪  
**Curso:** Coderhouse — Programación Backend III: Testing y Escalabilidad Flex  
**Entrega:** Tests funcionales + Docker image

---

## Descripción

API REST para gestión de adopciones de mascotas. Permite registrar usuarios, mascotas y el proceso completo de adopción, con validaciones de negocio y persistencia en MongoDB.

---

## Estructura del proyecto

```
adoptme/
├── src/
│   ├── app.js                        # Configuración de Express y rutas
│   ├── server.js                     # Conexión a MongoDB e inicio del servidor
│   ├── routes/
│   │   ├── adoption.router.js        # ← Router principal (objeto de testing)
│   │   ├── pets.router.js
│   │   └── users.router.js
│   ├── controllers/
│   │   ├── adoptions.controller.js   # Lógica de negocio de adopciones
│   │   ├── pets.controller.js
│   │   └── users.controller.js
│   ├── dao/
│   │   ├── Adoptions.js              # Acceso a datos - Mongoose
│   │   ├── Pets.js
│   │   └── Users.js
│   ├── models/
│   │   ├── Adoption.js               # Schema Mongoose
│   │   ├── Pet.js
│   │   └── User.js
│   └── services/
│       └── index.js                  # Instancias de los DAO (singleton)
├── test/
│   └── adoption.functional.test.js  # Tests funcionales con mocks
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

---

## Endpoints de adoption.router.js

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/adoptions` | Obtiene todas las adopciones |
| GET | `/api/adoptions/:aid` | Obtiene una adopción por ID |
| POST | `/api/adoptions/:uid/:pid` | Crea una adopción (usuario adopta mascota) |

---

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/adoptme.git
cd adoptme

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu URI de MongoDB

# 4. Iniciar el servidor
npm start
```

---

## Tests funcionales

Los tests usan **Jest** + **Supertest** con **mocks de Jest** para aislar completamente la capa de base de datos. No se necesita MongoDB para ejecutar los tests.

```bash
# Ejecutar tests con reporte de cobertura
npm test

# Modo verbose
npm run test:verbose
```

### Cobertura alcanzada

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
adoptions.controller.js   |   100   |    90    |   100   |   100   |
adoption.router.js        |   100   |   100    |   100   |   100   |
--------------------------|---------|----------|---------|---------|
Tests: 14 passed, 14 total
```

### Casos de prueba implementados

**GET /api/adoptions (3 tests)**
- ✅ Retorna 200 con lista de adopciones
- ✅ Retorna 200 con lista vacía
- ✅ Retorna 500 ante error del servicio

**GET /api/adoptions/:aid (3 tests)**
- ✅ Retorna 200 con adopción encontrada
- ✅ Retorna 404 cuando no existe
- ✅ Retorna 500 ante error del servicio

**POST /api/adoptions/:uid/:pid (8 tests)**
- ✅ Retorna 200 y crea adopción exitosamente
- ✅ Verifica que se llaman todos los servicios en orden
- ✅ Retorna 404 cuando el usuario no existe
- ✅ Retorna 404 cuando la mascota no existe
- ✅ Retorna 400 cuando la mascota ya fue adoptada
- ✅ Retorna 500 si falla el servicio de usuarios
- ✅ Retorna 500 si falla el servicio de mascotas
- ✅ Retorna 500 si falla la creación del registro
- ✅ Agrega correctamente la mascota al array del usuario

---

## Docker

### Construcción de la imagen

```bash
docker build -t bclaydrius/adoptme:latest .
```

### Ejecución del contenedor

```bash
docker run -d \
  -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/adoptme \
  -e PORT=8080 \
  --name adoptme \
  bclaydrius/adoptme:latest
```

### Verificar que funciona

```bash
# Ver logs del contenedor
docker logs adoptme

# Probar el endpoint raíz
curl http://localhost:8080
```

### Imagen en DockerHub

```
docker pull bclaydrius/adoptme:latest
```

🔗 **DockerHub:** https://hub.docker.com/r/bclaydrius/adoptme

---

## Dockerfile — Decisiones de optimización

```dockerfile
FROM node:20-alpine        # LTS Alpine: ~50MB vs ~300MB de la imagen completa
WORKDIR /app
COPY package*.json ./      # Se copia primero para aprovechar la caché de capas:
                           # si el código cambia pero no las deps, npm ci no re-corre
RUN npm ci --only=production && npm cache clean --force
                           # npm ci: instalación determinista (respeta package-lock.json)
                           # --only=production: excluye devDependencies (jest, supertest)
                           # cache clean en la misma capa para no inflar la imagen
COPY src ./src
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
USER node                  # Proceso no privilegiado (buena práctica de seguridad)
CMD ["node", "src/server.js"]
```

---

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `8080` |
| `MONGO_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/adoptme` |
| `NODE_ENV` | Entorno de ejecución | `development` |
