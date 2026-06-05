# AdoptMe API

**Alumno:** Barclay Leach  
**País:** Perú  
**Curso:** Coderhouse — Programación Backend III: Testing y Escalabilidad Flex  
**Entrega:** Tests Funcionales + Docker Image  
**Fecha:** Junio 2026

---

## Enlaces

| Recurso | URL |
|---|---|
| Repositorio GitHub | https://github.com/BclayDrius/programacion-backend-3-CODERHOUSE |
| Imagen DockerHub | https://hub.docker.com/r/bclaydrius/adoptme |

---

## Descripción

API REST para gestión de adopciones de mascotas construida con Node.js y Express. Permite registrar usuarios, mascotas y el proceso completo de adopción con validaciones de negocio. La capa de persistencia usa MongoDB a través de Mongoose.

El foco de esta entrega es la suite de **tests funcionales exhaustivos** para el router `adoption.router.js`, con mocks de Jest para aislar completamente las dependencias externas, y la **dockerización** de la aplicación con una imagen optimizada publicada en DockerHub.

---

## Estructura del proyecto

```
adoptme/
├── src/
│   ├── app.js                          # Configuración Express: middleware y rutas
│   ├── server.js                       # Inicio del servidor y conexión a MongoDB
│   ├── routes/
│   │   ├── adoption.router.js          # ← Router principal (objeto de los tests)
│   │   ├── pets.router.js              # CRUD de mascotas
│   │   └── users.router.js             # CRUD de usuarios
│   ├── controllers/
│   │   ├── adoptions.controller.js     # Lógica de negocio de adopciones
│   │   ├── pets.controller.js          # Lógica de negocio de mascotas
│   │   └── users.controller.js         # Lógica de negocio de usuarios
│   ├── dao/
│   │   ├── Adoptions.js                # Acceso a datos — Mongoose (Adoptions)
│   │   ├── Pets.js                     # Acceso a datos — Mongoose (Pets)
│   │   └── Users.js                    # Acceso a datos — Mongoose (Users)
│   ├── models/
│   │   ├── Adoption.js                 # Schema Mongoose: owner + pet
│   │   ├── Pet.js                      # Schema Mongoose: name, specie, adopted, owner
│   │   └── User.js                     # Schema Mongoose: firstName, lastName, email, pets[]
│   └── services/
│       └── index.js                    # Instancias singleton de los DAO
├── test/
│   └── adoption.functional.test.js     # 14 tests funcionales con mocks de Jest
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

---

## Endpoints

### adoption.router.js — Router bajo prueba

| Método | Ruta | Descripción | Controller |
|--------|------|-------------|------------|
| GET | `/api/adoptions` | Lista todas las adopciones | `getAllAdoptions` |
| GET | `/api/adoptions/:aid` | Obtiene una adopción por ID | `getAdoption` |
| POST | `/api/adoptions/:uid/:pid` | Registra la adopción de una mascota | `createAdoption` |

### Otros routers

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/pets` | Listar y crear mascotas |
| GET/PUT/DELETE | `/api/pets/:pid` | Obtener, actualizar y eliminar mascota |
| GET/POST | `/api/users` | Listar y crear usuarios |
| GET/PUT/DELETE | `/api/users/:uid` | Obtener, actualizar y eliminar usuario |

---

## Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/BclayDrius/programacion-backend-3-CODERHOUSE.git
cd programacion-backend-3-CODERHOUSE

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

### Estrategia de testing

Los tests usan **Jest** como framework y **Supertest** para realizar peticiones HTTP reales contra la aplicación Express. La dependencia externa (MongoDB a través de los DAOs) se aisla completamente usando `jest.mock()` sobre el módulo `src/services`.

Esto permite:
- Ejecutar los tests sin necesidad de una instancia de MongoDB activa.
- Controlar exactamente qué retorna cada servicio en cada escenario.
- Probar casos de éxito, error de validación (4xx) y error de servidor (5xx) de forma predecible.

```javascript
jest.mock('../src/services', () => ({
  adoptionsService: { getAll: jest.fn(), getById: jest.fn(), create: jest.fn() },
  petsService:      { getById: jest.fn(), update: jest.fn() },
  usersService:     { getById: jest.fn(), update: jest.fn() },
}));
```

### Ejecutar los tests

```bash
# Con reporte de cobertura
npm test

# Modo verbose (detallado)
npm run test:verbose

# Modo watch (re-corre al guardar)
npm run test:watch
```

### Casos de prueba — 14 tests en total

#### GET /api/adoptions (3 tests)

| # | Caso | Código esperado |
|---|------|-----------------|
| 1 | Retorna la lista completa de adopciones | 200 |
| 2 | Retorna arreglo vacío cuando no hay adopciones | 200 |
| 3 | Retorna error cuando el servicio falla | 500 |

#### GET /api/adoptions/:aid (3 tests)

| # | Caso | Código esperado |
|---|------|-----------------|
| 4 | Retorna la adopción cuando el ID existe | 200 |
| 5 | Retorna error cuando la adopción no existe | 404 |
| 6 | Retorna error cuando el servicio falla | 500 |

#### POST /api/adoptions/:uid/:pid (8 tests)

| # | Caso | Código esperado |
|---|------|-----------------|
| 7 | Crea la adopción exitosamente con datos válidos | 200 |
| 8 | Verifica que los servicios se llaman en el orden correcto | 200 |
| 9 | Error cuando el usuario no existe | 404 |
| 10 | Error cuando la mascota no existe | 404 |
| 11 | Error cuando la mascota ya fue adoptada | 400 |
| 12 | Error interno en el servicio de usuarios | 500 |
| 13 | Error interno en el servicio de mascotas | 500 |
| 14 | Error interno al crear el registro de adopción | 500 |

### Log de ejecución de los tests

```
> adoptme@1.0.0 test:verbose
> jest --forceExit --verbose --coverage

PASS test/adoption.functional.test.js
  GET /api/adoptions
    ✓ debe retornar 200 con la lista completa de adopciones (35 ms)
    ✓ debe retornar 200 con arreglo vacío cuando no existen adopciones (5 ms)
    ✓ debe retornar 500 si el servicio lanza un error inesperado (4 ms)
  GET /api/adoptions/:aid
    ✓ debe retornar 200 con la adopción cuando el ID existe (5 ms)
    ✓ debe retornar 404 cuando la adopción no existe (5 ms)
    ✓ debe retornar 500 si el servicio lanza un error inesperado (4 ms)
  POST /api/adoptions/:uid/:pid
    ✓ debe retornar 200 y crear la adopción cuando todos los datos son válidos (6 ms)
    ✓ debe retornar 404 cuando el usuario no existe (4 ms)
    ✓ debe retornar 404 cuando la mascota no existe (5 ms)
    ✓ debe retornar 400 cuando la mascota ya fue adoptada previamente (5 ms)
    ✓ debe retornar 500 si el servicio de usuarios lanza un error inesperado (3 ms)
    ✓ debe retornar 500 si el servicio de mascotas lanza un error inesperado (4 ms)
    ✓ debe retornar 500 si el servicio de adopciones falla al crear el registro (3 ms)
    ✓ debe agregar la mascota al arreglo pets del usuario correctamente (3 ms)

--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   100   |    90    |   100   |   100   |
 controllers              |   100   |    90    |   100   |   100   |
  adoptions.controller.js |   100   |    90    |   100   |   100   |
 routes                   |   100   |   100    |   100   |   100   |
  adoption.router.js      |   100   |   100    |   100   |   100   |
--------------------------|---------|----------|---------|---------|

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        1.366 s
```

---

## Dockerización

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY src ./src

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

USER node

CMD ["node", "src/server.js"]
```

### Decisiones de optimización

| Decisión | Justificación |
|---|---|
| `node:20-alpine` | Imagen LTS Alpine (~50 MB vs ~300 MB de la imagen completa). Menor superficie de ataque y menor tiempo de descarga. |
| `COPY package*.json` primero | Aprovecha la caché de capas de Docker: si el código fuente cambia pero no las dependencias, la capa de `npm ci` se reutiliza sin re-ejecutarse. |
| `npm ci` en lugar de `npm install` | Instalación determinista que respeta exactamente el `package-lock.json`. Más rápido y predecible en entornos CI/CD. |
| `--only=production` | Excluye `devDependencies` (Jest, Supertest). Reduce el tamaño de la imagen y elimina herramientas de desarrollo del entorno productivo. |
| `npm cache clean --force` en la misma capa | Elimina la caché de npm en el mismo `RUN` para que no quede en ninguna capa de la imagen final, reduciendo su tamaño. |
| `USER node` | El proceso corre como usuario sin privilegios. Si hay una vulnerabilidad en la aplicación, el atacante no obtiene acceso root al sistema host. |

### Log de construcción de la imagen

```
[+] Building 4.3s (10/10) FINISHED          docker:desktop-linux
 #1 [internal] load build definition from Dockerfile
 #2 [internal] load metadata for docker.io/library/node:20-alpine
 #4 [internal] load build context
 #5 [1/5] FROM docker.io/library/node:20-alpine
 #7 [2/5] WORKDIR /app
 #8 [3/5] COPY package*.json ./
 #9 [4/5] RUN npm ci --only=production && npm cache clean --force
 #9 added 89 packages, and audited 90 packages in 3s
 #9 found 0 vulnerabilities
 #10 [5/5] COPY src ./src
 #11 exporting to image
 #11 naming to docker.io/bclaydrius/adoptme:latest done
 #11 DONE 2.2s
```

### Construcción y ejecución

```bash
# Construir la imagen
docker build -t bclaydrius/adoptme:latest .

# Ejecutar el contenedor
docker run -d \
  -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/adoptme \
  -e PORT=8080 \
  --name adoptme \
  bclaydrius/adoptme:latest

# Ver logs del contenedor
docker logs adoptme

# Verificar que la API responde
curl http://localhost:8080
```

### Log de ejecución del contenedor

```
Servidor AdoptMe escuchando en puerto 8080
Entorno: production
```

### Respuesta del endpoint raíz

```json
{
  "status": "success",
  "message": "AdoptMe API - Barclay Leach"
}
```

---

## Imagen en DockerHub

**Nombre y tag:** `bclaydrius/adoptme:latest`  
**URL pública:** https://hub.docker.com/r/bclaydrius/adoptme

```bash
# Descargar y ejecutar la imagen directamente desde DockerHub
docker pull bclaydrius/adoptme:latest

docker run -d \
  -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/adoptme \
  --name adoptme \
  bclaydrius/adoptme:latest
```

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor HTTP | `8080` |
| `MONGO_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/adoptme` |
| `NODE_ENV` | Entorno de ejecución | `development` |

---

## Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `express` | ^4.19.2 | Framework HTTP |
| `mongoose` | ^8.4.1 | ODM para MongoDB |
| `dotenv` | ^16.4.5 | Carga de variables de entorno |
| `jest` | ^29.7.0 | Framework de testing (dev) |
| `supertest` | ^7.0.0 | Testing de endpoints HTTP (dev) |
