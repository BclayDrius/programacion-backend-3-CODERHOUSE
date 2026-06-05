const { petsService } = require('../services');

const getAllPets = async (req, res) => {
  try {
    const pets = await petsService.getAll();
    res.status(200).send({ status: 'success', payload: pets });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const getPet = async (req, res) => {
  try {
    const { pid } = req.params;
    const pet = await petsService.getById(pid);
    if (!pet) return res.status(404).send({ status: 'error', error: 'Mascota no encontrada' });
    res.status(200).send({ status: 'success', payload: pet });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const createPet = async (req, res) => {
  try {
    const { name, specie, birthDate } = req.body;
    if (!name || !specie) {
      return res.status(400).send({ status: 'error', error: 'Nombre y especie son requeridos' });
    }
    const pet = await petsService.create({ name, specie, birthDate, adopted: false });
    res.status(201).send({ status: 'success', payload: pet });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const updatePet = async (req, res) => {
  try {
    const { pid } = req.params;
    const updated = await petsService.update(pid, req.body);
    if (!updated) return res.status(404).send({ status: 'error', error: 'Mascota no encontrada' });
    res.status(200).send({ status: 'success', payload: updated });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const deletePet = async (req, res) => {
  try {
    const { pid } = req.params;
    const deleted = await petsService.delete(pid);
    if (!deleted) return res.status(404).send({ status: 'error', error: 'Mascota no encontrada' });
    res.status(200).send({ status: 'success', message: 'Mascota eliminada' });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

module.exports = { getAllPets, getPet, createPet, updatePet, deletePet };
