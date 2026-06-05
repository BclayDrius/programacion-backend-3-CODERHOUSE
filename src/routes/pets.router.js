const { Router } = require('express');
const {
  getAllPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} = require('../controllers/pets.controller');

const router = Router();

router.get('/', getAllPets);
router.get('/:pid', getPet);
router.post('/', createPet);
router.put('/:pid', updatePet);
router.delete('/:pid', deletePet);

module.exports = router;
