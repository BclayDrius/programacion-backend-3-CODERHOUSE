const { adoptionsService, petsService, usersService } = require('../services');

/**
 * GET /api/adoptions
 * Retorna todas las adopciones registradas.
 */
const getAllAdoptions = async (req, res) => {
  try {
    const adoptions = await adoptionsService.getAll();
    res.status(200).send({ status: 'success', payload: adoptions });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

/**
 * GET /api/adoptions/:aid
 * Retorna una adopción por su ID.
 */
const getAdoption = async (req, res) => {
  try {
    const { aid } = req.params;
    const adoption = await adoptionsService.getById(aid);
    if (!adoption) {
      return res.status(404).send({ status: 'error', error: 'Adopción no encontrada' });
    }
    res.status(200).send({ status: 'success', payload: adoption });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

/**
 * POST /api/adoptions/:uid/:pid
 * Registra la adopción de una mascota por parte de un usuario.
 * Valida que el usuario exista, que la mascota exista y que no esté ya adoptada.
 */
const createAdoption = async (req, res) => {
  try {
    const { uid, pid } = req.params;

    const user = await usersService.getById(uid);
    if (!user) {
      return res.status(404).send({ status: 'error', error: 'Usuario no encontrado' });
    }

    const pet = await petsService.getById(pid);
    if (!pet) {
      return res.status(404).send({ status: 'error', error: 'Mascota no encontrada' });
    }

    if (pet.adopted) {
      return res.status(400).send({ status: 'error', error: 'La mascota ya fue adoptada' });
    }

    // Marcar mascota como adoptada y asignar dueño
    await petsService.update(pid, { adopted: true, owner: uid });

    // Agregar mascota al arreglo del usuario
    user.pets = user.pets || [];
    user.pets.push(pid);
    await usersService.update(uid, { pets: user.pets });

    // Crear registro de adopción
    const adoption = await adoptionsService.create({ owner: uid, pet: pid });

    res.status(200).send({
      status: 'success',
      message: 'Mascota adoptada correctamente',
      payload: adoption,
    });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

module.exports = { getAllAdoptions, getAdoption, createAdoption };
