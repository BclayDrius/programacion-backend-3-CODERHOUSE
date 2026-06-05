const { Router } = require('express');
const {
  getAllAdoptions,
  getAdoption,
  createAdoption,
} = require('../controllers/adoptions.controller');

const router = Router();

router.get('/', getAllAdoptions);
router.get('/:aid', getAdoption);
router.post('/:uid/:pid', createAdoption);

module.exports = router;
