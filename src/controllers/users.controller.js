const { usersService } = require('../services');

const getAllUsers = async (req, res) => {
  try {
    const users = await usersService.getAll();
    res.status(200).send({ status: 'success', payload: users });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await usersService.getById(uid);
    if (!user) return res.status(404).send({ status: 'error', error: 'Usuario no encontrado' });
    res.status(200).send({ status: 'success', payload: user });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).send({ status: 'error', error: 'Todos los campos son requeridos' });
    }
    const user = await usersService.create({ firstName, lastName, email, password, pets: [] });
    res.status(201).send({ status: 'success', payload: user });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const updated = await usersService.update(uid, req.body);
    if (!updated) return res.status(404).send({ status: 'error', error: 'Usuario no encontrado' });
    res.status(200).send({ status: 'success', payload: updated });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const deleted = await usersService.delete(uid);
    if (!deleted) return res.status(404).send({ status: 'error', error: 'Usuario no encontrado' });
    res.status(200).send({ status: 'success', message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

module.exports = { getAllUsers, getUser, createUser, updateUser, deleteUser };
