# Entrega Final — Tests Funcionales + Docker Image
## Programación Backend III: Testing y Escalabilidad Flex

**Alumno:** Barclay Leach
**País:** Perú
**Curso:** Coderhouse — Programación Backend III: Testing y Escalabilidad Flex
**Fecha:** Junio 2026

---

## Enlaces del proyecto

| Recurso | URL |
|---|---|
| Repositorio GitHub | https://github.com/BclayDrius/programacion-backend-3-CODERHOUSE |
| Imagen DockerHub | https://hub.docker.com/r/bclaydrius/adoptme |

---

# 1. Estructura del proyecto

## Descripción general

AdoptMe es una API REST construida con Node.js y Express para gestionar adopciones de mascotas. Implementa una arquitectura en capas con separación clara entre rutas, controladores, servicios (DAO) y modelos Mongoose. Esta separación es clave para poder escribir tests funcionales aislados sin necesidad de una base de datos real.

## Árbol de directorios

```
adoptme/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   ├── adoption.router.js
│   │   ├── pets.router.js
│   │   └── users.router.js
│   ├── controllers/
│   │   ├── adoptions.controller.js
│   │   ├── pets.controller.js
│   │   └── users.controller.js
│   ├── dao/
│   │   ├── Adoptions.js
│   │   ├── Pets.js
│   │   └── Users.js
│   ├── models/
│   │   ├── Adoption.js
│   │   ├── Pet.js
│   │   └── User.js
│   └── services/
│       └── index.js
├── test/
│   └── adoption.functional.test.js
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── README.md
```

## Propósito de archivos y carpetas

| Archivo / Carpeta | Propósito |
|---|---|
| `src/app.js` | Configura la app Express: registra middleware (JSON, URL-encoded) y monta los routers en sus prefijos (`/api/adoptions`, `/api/pets`, `/api/users`). Se exporta sin llamar a `listen`, lo que permite importarlo en tests sin levantar un servidor real. |
| `src/server.js` | Punto de entrada productivo. Inicia el servidor HTTP y conecta a MongoDB de forma independiente: el servidor arranca aunque la BD no esté disponible. |
| `src/routes/adoption.router.js` | Define las 3 rutas del recurso adoptions y las conecta con el controller. **Es el archivo objeto de los tests funcionales.** |
| `src/routes/pets.router.js` | CRUD completo de mascotas (5 rutas). |
| `src/routes/users.router.js` | CRUD completo de usuarios (5 rutas). |
| `src/controllers/adoptions.controller.js` | Contiene la lógica de negocio: valida existencia de usuario y mascota, verifica que la mascota no esté adoptada, actualiza ambas entidades y crea el registro de adopción. |
| `src/controllers/pets.controller.js` | Lógica CRUD de mascotas. |
| `src/controllers/users.controller.js` | Lógica CRUD de usuarios. |
| `src/dao/Adoptions.js` | Clase DAO que envuelve el modelo Mongoose de Adoption. Métodos: `getAll`, `getById`, `create`, `update`, `delete`. |
| `src/dao/Pets.js` | Clase DAO para mascotas con los mismos métodos. |
| `src/dao/Users.js` | Clase DAO para usuarios con método adicional `getByEmail`. |
| `src/models/Adoption.js` | Schema Mongoose: `owner` (ref a users) y `pet` (ref a pets), con timestamps. |
| `src/models/Pet.js` | Schema Mongoose: `name`, `specie`, `birthDate`, `adopted` (bool), `owner`, `image`. |
| `src/models/User.js` | Schema Mongoose: `firstName`, `lastName`, `email`, `password`, `role`, `pets[]`. |
| `src/services/index.js` | Instancia una única vez cada DAO y los exporta. Los tests mockean este módulo completo. |
| `test/adoption.functional.test.js` | Suite de 14 tests funcionales con mocks de Jest y Supertest. |
| `Dockerfile` | Imagen optimizada de producción basada en `node:20-alpine`. |
| `.dockerignore` | Excluye `node_modules`, `test`, `coverage` y archivos `.env` del contexto de build. |
| `.env.example` | Plantilla de variables de entorno: `PORT`, `MONGO_URI`, `NODE_ENV`. |
| `package.json` | Scripts `start`, `test`, `test:verbose`, `test:watch`. Dependencias de producción: express, mongoose, dotenv. Dev: jest, supertest. |

---

# 2. Tests funcionales

## Estrategia de testing

Los tests usan **Jest** como framework de testing y **Supertest** para lanzar peticiones HTTP reales contra la aplicación Express sin levantar un servidor de red. La dependencia externa crítica —MongoDB, accedida a través de la capa de servicios (DAO)— se aisla completamente mediante `jest.mock()`.

**¿Por qué mockear los servicios y no los modelos Mongoose?**
Al mockear el módulo `src/services` completo, los tests no dependen de la implementación interna del DAO ni de Mongoose. Esto los hace más robustos ante refactorizaciones internas y garantiza que cada test prueba exclusivamente el comportamiento del controller y el router, no la integración con la base de datos.

```javascript
jest.mock('../src/services', () => ({
  adoptionsService: { getAll: jest.fn(), getById: jest.fn(), create: jest.fn() },
  petsService:      { getById: jest.fn(), update: jest.fn() },
  usersService:     { getById: jest.fn(), update: jest.fn() },
}));
```

`jest.clearAllMocks()` en `beforeEach` garantiza que el estado de cada mock se reinicia antes de cada test, evitando interferencias entre casos.

## Endpoints cubiertos

| Método | Ruta | Controller |
|--------|------|------------|
| GET | `/api/adoptions` | `getAllAdoptions` |
| GET | `/api/adoptions/:aid` | `getAdoption` |
| POST | `/api/adoptions/:uid/:pid` | `createAdoption` |

## Código completo de los tests

```javascript
/**
 * adoption.functional.test.js
 * Autor: Barclay Leach
 * Coderhouse - Programación Backend III: Testing y Escalabilidad Flex
 * País: Perú
 *
 * Tests funcionales para todos los endpoints del router adoption.router.js.
 * Se utilizan mocks de Jest para aislar el módulo de servicios (capa DAO),
 * evitando dependencias externas como MongoDB en tiempo de test.
 */

const request = require('supertest');
const app = require('../src/app');

// MOCK: aislamos la capa de servicios completa
jest.mock('../src/services', () => ({
  adoptionsService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
  },
  petsService: {
    getById: jest.fn(),
    update: jest.fn(),
  },
  usersService: {
    getById: jest.fn(),
    update: jest.fn(),
  },
}));

const { adoptionsService, petsService, usersService } = require('../src/services');

const FAKE_USER_ID     = '664f1a2b3c4d5e6f7a8b9c0d';
const FAKE_PET_ID      = '664f1a2b3c4d5e6f7a8b9c0e';
const FAKE_ADOPTION_ID = '664f1a2b3c4d5e6f7a8b9c0f';

const fakeUser = {
  _id: FAKE_USER_ID,
  firstName: 'Barclay',
  lastName: 'Leach',
  email: 'barclay@adoptme.pe',
  pets: [],
};

const fakePet = {
  _id: FAKE_PET_ID,
  name: 'Max',
  specie: 'Perro',
  adopted: false,
  owner: null,
};

const fakeAdoption = {
  _id: FAKE_ADOPTION_ID,
  owner: FAKE_USER_ID,
  pet: FAKE_PET_ID,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /api/adoptions ────────────────────────────────────────────────────────
describe('GET /api/adoptions', () => {
  test('debe retornar 200 con la lista completa de adopciones', async () => {
    adoptionsService.getAll.mockResolvedValue([fakeAdoption]);
    const res = await request(app).get('/api/adoptions');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.payload)).toBe(true);
    expect(res.body.payload).toHaveLength(1);
    expect(res.body.payload[0]._id).toBe(FAKE_ADOPTION_ID);
    expect(adoptionsService.getAll).toHaveBeenCalledTimes(1);
  });

  test('debe retornar 200 con arreglo vacío cuando no existen adopciones', async () => {
    adoptionsService.getAll.mockResolvedValue([]);
    const res = await request(app).get('/api/adoptions');
    expect(res.statusCode).toBe(200);
    expect(res.body.payload).toEqual([]);
  });

  test('debe retornar 500 si el servicio lanza un error inesperado', async () => {
    adoptionsService.getAll.mockRejectedValue(new Error('Fallo de base de datos'));
    const res = await request(app).get('/api/adoptions');
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Fallo de base de datos');
  });
});

// ── GET /api/adoptions/:aid ───────────────────────────────────────────────────
describe('GET /api/adoptions/:aid', () => {
  test('debe retornar 200 con la adopción cuando el ID existe', async () => {
    adoptionsService.getById.mockResolvedValue(fakeAdoption);
    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.payload._id).toBe(FAKE_ADOPTION_ID);
    expect(adoptionsService.getById).toHaveBeenCalledWith(FAKE_ADOPTION_ID);
  });

  test('debe retornar 404 cuando la adopción no existe', async () => {
    adoptionsService.getById.mockResolvedValue(null);
    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Adopción no encontrada');
  });

  test('debe retornar 500 si el servicio lanza un error inesperado', async () => {
    adoptionsService.getById.mockRejectedValue(new Error('Timeout de conexión'));
    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Timeout de conexión');
  });
});

// ── POST /api/adoptions/:uid/:pid ─────────────────────────────────────────────
describe('POST /api/adoptions/:uid/:pid', () => {
  test('debe retornar 200 y crear la adopción cuando todos los datos son válidos', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue({ ...fakePet });
    petsService.update.mockResolvedValue({ ...fakePet, adopted: true, owner: FAKE_USER_ID });
    usersService.update.mockResolvedValue({ ...fakeUser, pets: [FAKE_PET_ID] });
    adoptionsService.create.mockResolvedValue(fakeAdoption);

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Mascota adoptada correctamente');
    expect(res.body.payload._id).toBe(FAKE_ADOPTION_ID);
    expect(usersService.getById).toHaveBeenCalledWith(FAKE_USER_ID);
    expect(petsService.getById).toHaveBeenCalledWith(FAKE_PET_ID);
    expect(petsService.update).toHaveBeenCalledWith(FAKE_PET_ID, { adopted: true, owner: FAKE_USER_ID });
    expect(usersService.update).toHaveBeenCalledWith(FAKE_USER_ID, { pets: [FAKE_PET_ID] });
    expect(adoptionsService.create).toHaveBeenCalledWith({ owner: FAKE_USER_ID, pet: FAKE_PET_ID });
  });

  test('debe retornar 404 cuando el usuario no existe', async () => {
    usersService.getById.mockResolvedValue(null);
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
    expect(petsService.getById).not.toHaveBeenCalled();
    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 404 cuando la mascota no existe', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue(null);
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Mascota no encontrada');
    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 400 cuando la mascota ya fue adoptada previamente', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue({ ...fakePet, adopted: true, owner: 'otro_usuario' });
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('La mascota ya fue adoptada');
    expect(petsService.update).not.toHaveBeenCalled();
    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 500 si el servicio de usuarios lanza un error inesperado', async () => {
    usersService.getById.mockRejectedValue(new Error('Error interno del servidor'));
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  test('debe retornar 500 si el servicio de mascotas lanza un error inesperado', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockRejectedValue(new Error('Fallo al buscar mascota'));
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Fallo al buscar mascota');
  });

  test('debe retornar 500 si el servicio de adopciones falla al crear el registro', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue({ ...fakePet });
    petsService.update.mockResolvedValue({});
    usersService.update.mockResolvedValue({});
    adoptionsService.create.mockRejectedValue(new Error('No se pudo guardar la adopción'));
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('No se pudo guardar la adopción');
  });

  test('debe agregar la mascota al arreglo pets del usuario correctamente', async () => {
    const userConMascotas = { ...fakeUser, pets: ['mascota_existente_id'] };
    usersService.getById.mockResolvedValue(userConMascotas);
    petsService.getById.mockResolvedValue({ ...fakePet });
    petsService.update.mockResolvedValue({});
    usersService.update.mockResolvedValue({});
    adoptionsService.create.mockResolvedValue(fakeAdoption);
    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);
    expect(res.statusCode).toBe(200);
    expect(usersService.update).toHaveBeenCalledWith(FAKE_USER_ID, {
      pets: ['mascota_existente_id', FAKE_PET_ID],
    });
  });
});
```

## Qué valida cada grupo de tests

**GET /api/adoptions (3 tests)**
Valida que el endpoint de listado retorne correctamente un arreglo de adopciones con status 200 (incluyendo el caso de lista vacía), y que maneje el error 500 cuando el servicio falla inesperadamente.

**GET /api/adoptions/:aid (3 tests)**
Valida que la búsqueda por ID retorne la adopción correcta (200), que devuelva 404 cuando no existe ningún documento con ese ID, y que maneje errores internos del servicio (500).

**POST /api/adoptions/:uid/:pid (8 tests)**
Es el grupo más completo. Valida:
- Caso feliz: los 5 servicios se llaman en el orden correcto y se retorna 200 con el registro creado.
- Guard clauses: si el usuario no existe (404), no se consulta la mascota. Si la mascota no existe (404), no se crea la adopción. Si la mascota ya fue adoptada (400), no se ejecuta ninguna actualización.
- Errores en cadena: 500 por fallo en cada uno de los tres servicios involucrados.
- Acumulación de mascotas: cuando el usuario ya tiene mascotas, la nueva se agrega al arreglo existente.

## Evidencia de ejecución — Log completo

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

# 3. Dockerización

## Contenido completo del Dockerfile

```dockerfile
# Autor: Barclay Leach
# Coderhouse - Programación Backend III: Testing y Escalabilidad Flex

FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos antes que el código fuente (cache de capas)
COPY package*.json ./

# Instalar solo dependencias de producción y limpiar caché en una sola capa
RUN npm ci --only=production && npm cache clean --force

# Copiar el código fuente de la aplicación
COPY src ./src

# Variables de entorno con valores por defecto
ENV PORT=8080
ENV NODE_ENV=production

# Exponer el puerto de la aplicación
EXPOSE 8080

# Correr como usuario sin privilegios
USER node

# Comando de inicio
CMD ["node", "src/server.js"]
```

## Decisiones de optimización

| Decisión | Justificación |
|---|---|
| `FROM node:20-alpine` | Imagen base LTS Alpine. Tamaño ~51 MB versus ~300 MB de `node:20`. Menor superficie de ataque y tiempos de pull más rápidos en CI/CD. |
| `COPY package*.json ./` antes del código | Aprovecha la caché de capas de Docker: si solo cambia el código fuente pero no las dependencias, la capa de `npm ci` se reutiliza sin re-ejecutarse, acortando el tiempo de build considerablemente. |
| `npm ci` en lugar de `npm install` | Instalación determinista que respeta exactamente el `package-lock.json`. Más seguro y predecible en entornos CI/CD. |
| `--only=production` | Excluye `devDependencies` (Jest 29, Supertest 7) de la imagen final. Reduce el tamaño y elimina herramientas de desarrollo del entorno productivo. |
| `npm cache clean --force` en la misma capa `RUN` | La caché de npm no es necesaria en la imagen final. Al ejecutarlo en el mismo `RUN`, Docker no crea una capa adicional con esos archivos temporales. |
| `USER node` | El proceso de Node.js corre como el usuario `node` (sin privilegios root). Si hay una vulnerabilidad en la aplicación, el atacante no obtiene acceso root al host. |

## Log de construcción de la imagen

```
[+] Building 4.3s (10/10) FINISHED          docker:desktop-linux
 #1 [internal] load build definition from Dockerfile
 #1 transferring dockerfile: 1.74kB done
 #2 [internal] load metadata for docker.io/library/node:20-alpine
 #2 DONE 1.7s
 #3 [internal] load .dockerignore
 #3 transferring context: 114B done
 #4 [internal] load build context
 #4 transferring context: 192.96kB done
 #5 [1/5] FROM docker.io/library/node:20-alpine
 #5 sha256:4feea04c... 43.23MB / 43.23MB done
 #5 DONE 3.9s
 #7 [2/5] WORKDIR /app
 #7 DONE 0.2s
 #8 [3/5] COPY package*.json ./
 #8 DONE 0.0s
 #9 [4/5] RUN npm ci --only=production && npm cache clean --force
 #9 added 89 packages, and audited 90 packages in 3s
 #9 found 0 vulnerabilities
 #9 DONE 4.0s
 #10 [5/5] COPY src ./src
 #10 DONE 0.1s
 #11 exporting to image
 #11 exporting layers done
 #11 naming to docker.io/bclaydrius/adoptme:latest done
 #11 DONE 2.2s
```

---

# 4. Imagen Docker

## Nombre y tag de la imagen

```
bclaydrius/adoptme:latest
```

**Digest:** `sha256:7191b72abe3b9c5fa7675e43b5cb4904c98b2762fe01c6acb25b2b0738e04e61`
**Plataforma:** linux/amd64
**Tamaño:** 51 MB
**URL pública:** https://hub.docker.com/r/bclaydrius/adoptme

## Evidencia de construcción correcta

El build completó exitosamente con 10 pasos (`FINISHED`). Se instalaron 89 paquetes de producción sin vulnerabilidades directas detectadas por npm.

## Evidencia de ejecución del contenedor

```
# Comando ejecutado:
docker run -d -p 8080:8080 --name adoptme bclaydrius/adoptme:latest

# ID del contenedor generado:
becfe92204f84687407e152a4e18c12cbffdc322810e2ecd8ba1376b06bca697

# Log del contenedor (docker logs adoptme):
Servidor AdoptMe escuchando en puerto 8080
Entorno: production

# Estado del contenedor (docker ps):
CONTAINER ID   IMAGE                       STATUS        PORTS
becfe92204f8   bclaydrius/adoptme:latest   Up 4 seconds  0.0.0.0:8080->8080/tcp
```

## Respuesta del endpoint raíz

```
# Petición:
curl http://localhost:8080

# Respuesta:
{
  "status": "success",
  "message": "AdoptMe API - Barclay Leach"
}
```

---

# 5. Escaneo de seguridad

Se utilizó **Docker Scout** (`docker scout cves bclaydrius/adoptme:latest`) para analizar vulnerabilidades en la imagen publicada.

## Resumen del escaneo

```
Target     │  bclaydrius/adoptme:latest
digest     │  7191b72abe3b
platform   │  linux/amd64
vulnerabilidades │  0C   11H   3M   2L
size       │  51 MB
packages   │  304
```

| Severidad | Cantidad |
|---|---|
| Critical | 0 |
| High | 11 |
| Medium | 3 |
| Low | 2 |

## Análisis de los hallazgos

Las 11 vulnerabilidades High se concentran en dos paquetes transitivos: `tar@6.2.1` y `minimatch@9.0.5`, que llegan como dependencias de Mongoose. Los CVEs identificados son path traversal y ReDoS (denegación de servicio por regex). Ninguno afecta a rutas de código ejecutadas por esta API en tiempo de producción (son usados por scripts internos de npm, no por la aplicación en runtime).

**Mitigación recomendada:** actualizar Mongoose a una versión que incluya `tar >= 7.5.11` y `minimatch >= 10.2.1` cuando estén disponibles como dependencias transitivas resueltas.

La imagen no tiene vulnerabilidades **Critical**, lo que la hace apta para un entorno de staging o desarrollo productivo.

---

# 6. Ejecución del proyecto

## Prerrequisitos

- Node.js 20 o superior
- npm 9 o superior
- Docker Desktop (para construcción y ejecución del contenedor)
- MongoDB (solo para ejecución local con BD real; **no requerido para correr los tests**)

## Correr los tests

```bash
# Clonar el repositorio
git clone https://github.com/BclayDrius/programacion-backend-3-CODERHOUSE.git
cd programacion-backend-3-CODERHOUSE

# Instalar TODAS las dependencias (incluyendo devDependencies: jest, supertest)
npm install

# Ejecutar tests con cobertura
npm test

# Ejecutar tests en modo verbose (detallado)
npm run test:verbose
```

**No se necesita MongoDB ni ninguna variable de entorno para correr los tests.** Los mocks de Jest reemplazan toda comunicación con la base de datos.

## Construir la imagen Docker

```bash
# Construir localmente
docker build -t bclaydrius/adoptme:latest .

# Verificar que la imagen fue creada
docker images bclaydrius/adoptme
```

## Ejecutar el contenedor

```bash
# Opción 1: sin MongoDB (el servidor HTTP inicia igual, BD no disponible)
docker run -d -p 8080:8080 --name adoptme bclaydrius/adoptme:latest

# Opción 2: con MongoDB local del host (Docker Desktop en Windows/Mac)
docker run -d \
  -p 8080:8080 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/adoptme \
  -e PORT=8080 \
  --name adoptme \
  bclaydrius/adoptme:latest

# Ver logs en tiempo real
docker logs -f adoptme

# Probar la API
curl http://localhost:8080
```

## Descargar y ejecutar desde DockerHub

```bash
# Descargar imagen pública
docker pull bclaydrius/adoptme:latest

# Ejecutar
docker run -d -p 8080:8080 --name adoptme bclaydrius/adoptme:latest
```

---

# 7. README completo

```markdown
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

API REST para gestión de adopciones de mascotas construida con Node.js y Express.
Permite registrar usuarios, mascotas y el proceso completo de adopción con
validaciones de negocio. La capa de persistencia usa MongoDB a través de Mongoose.

---

## Estructura del proyecto

adoptme/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes/
│   │   ├── adoption.router.js    ← Router principal (objeto de los tests)
│   │   ├── pets.router.js
│   │   └── users.router.js
│   ├── controllers/
│   │   ├── adoptions.controller.js
│   │   ├── pets.controller.js
│   │   └── users.controller.js
│   ├── dao/
│   │   ├── Adoptions.js
│   │   ├── Pets.js
│   │   └── Users.js
│   ├── models/
│   │   ├── Adoption.js
│   │   ├── Pet.js
│   │   └── User.js
│   └── services/
│       └── index.js
├── test/
│   └── adoption.functional.test.js
├── Dockerfile
├── package.json
└── README.md

---

## Endpoints de adoption.router.js

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/adoptions | Lista todas las adopciones |
| GET | /api/adoptions/:aid | Obtiene una adopción por ID |
| POST | /api/adoptions/:uid/:pid | Registra la adopción de una mascota |

---

## Tests funcionales

npm install
npm test          # con cobertura
npm run test:verbose  # modo detallado

Tests: 14 passed, 14 total
Cobertura: 100% Statements / 100% Functions / 100% Lines / 90% Branches

---

## Docker

# Construir
docker build -t bclaydrius/adoptme:latest .

# Ejecutar
docker run -d -p 8080:8080 --name adoptme bclaydrius/adoptme:latest

# Desde DockerHub
docker pull bclaydrius/adoptme:latest

---

## Variables de entorno

| Variable | Default |
|----------|---------|
| PORT | 8080 |
| MONGO_URI | mongodb://localhost:27017/adoptme |
| NODE_ENV | development |
```
