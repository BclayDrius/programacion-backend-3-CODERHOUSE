/**
 * adoption.functional.test.js
 * Autor: Barclay Leach
 * Coderhouse - Programación Backend III: Testing y Escalabilidad Flex
 * País: Perú 🇵🇪
 *
 * Tests funcionales para todos los endpoints del router adoption.router.js.
 * Se utilizan mocks de Jest para aislar el módulo de servicios (capa DAO),
 * evitando dependencias externas como MongoDB en tiempo de test.
 *
 * Endpoints cubiertos:
 *   GET  /api/adoptions
 *   GET  /api/adoptions/:aid
 *   POST /api/adoptions/:uid/:pid
 */

const request = require('supertest');
const app = require('../src/app');

// ─── MOCK: aislamos la capa de servicios completa ────────────────────────────
// Jest reemplaza ../src/services con objetos stub controlados.
// Esto elimina cualquier dependencia de MongoDB o red externa.
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

// IDs de ejemplo que se usarán en las pruebas
const FAKE_USER_ID = '664f1a2b3c4d5e6f7a8b9c0d';
const FAKE_PET_ID = '664f1a2b3c4d5e6f7a8b9c0e';
const FAKE_ADOPTION_ID = '664f1a2b3c4d5e6f7a8b9c0f';

// ─── Datos de ejemplo (fakes) ─────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  // Limpiamos el estado de todos los mocks antes de cada test
  jest.clearAllMocks();
});

// =============================================================================
// GET /api/adoptions
// =============================================================================
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
    expect(res.body.status).toBe('success');
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

// =============================================================================
// GET /api/adoptions/:aid
// =============================================================================
describe('GET /api/adoptions/:aid', () => {
  test('debe retornar 200 con la adopción cuando el ID existe', async () => {
    adoptionsService.getById.mockResolvedValue(fakeAdoption);

    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.payload._id).toBe(FAKE_ADOPTION_ID);
    expect(res.body.payload.owner).toBe(FAKE_USER_ID);
    expect(res.body.payload.pet).toBe(FAKE_PET_ID);
    expect(adoptionsService.getById).toHaveBeenCalledWith(FAKE_ADOPTION_ID);
  });

  test('debe retornar 404 cuando la adopción no existe', async () => {
    adoptionsService.getById.mockResolvedValue(null);

    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Adopción no encontrada');
  });

  test('debe retornar 500 si el servicio lanza un error inesperado', async () => {
    adoptionsService.getById.mockRejectedValue(new Error('Timeout de conexión'));

    const res = await request(app).get(`/api/adoptions/${FAKE_ADOPTION_ID}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Timeout de conexión');
  });
});

// =============================================================================
// POST /api/adoptions/:uid/:pid
// =============================================================================
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

    // Verificamos que se llamaron todos los servicios en el orden correcto
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
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Usuario no encontrado');

    // No se debe consultar la mascota si el usuario no existe
    expect(petsService.getById).not.toHaveBeenCalled();
    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 404 cuando la mascota no existe', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue(null);

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Mascota no encontrada');

    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 400 cuando la mascota ya fue adoptada previamente', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue({ ...fakePet, adopted: true, owner: 'otro_usuario' });

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('La mascota ya fue adoptada');

    // No debe actualizar nada ni crear adopción
    expect(petsService.update).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
    expect(adoptionsService.create).not.toHaveBeenCalled();
  });

  test('debe retornar 500 si el servicio de usuarios lanza un error inesperado', async () => {
    usersService.getById.mockRejectedValue(new Error('Error interno del servidor'));

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Error interno del servidor');
  });

  test('debe retornar 500 si el servicio de mascotas lanza un error inesperado', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockRejectedValue(new Error('Fallo al buscar mascota'));

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Fallo al buscar mascota');
  });

  test('debe retornar 500 si el servicio de adopciones falla al crear el registro', async () => {
    usersService.getById.mockResolvedValue({ ...fakeUser });
    petsService.getById.mockResolvedValue({ ...fakePet });
    petsService.update.mockResolvedValue({ ...fakePet, adopted: true });
    usersService.update.mockResolvedValue({ ...fakeUser, pets: [FAKE_PET_ID] });
    adoptionsService.create.mockRejectedValue(new Error('No se pudo guardar la adopción'));

    const res = await request(app).post(`/api/adoptions/${FAKE_USER_ID}/${FAKE_PET_ID}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
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
    // Verificamos que se enviaron ambas mascotas en el update del usuario
    expect(usersService.update).toHaveBeenCalledWith(FAKE_USER_ID, {
      pets: ['mascota_existente_id', FAKE_PET_ID],
    });
  });
});
