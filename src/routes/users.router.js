const { Router } = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users.controller');

const router = Router();

router.get('/', getAllUsers);
router.get('/:uid', getUser);
router.post('/', createUser);
router.put('/:uid', updateUser);
router.delete('/:uid', deleteUser);

module.exports = router;
