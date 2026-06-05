const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specie: { type: String, required: true },
  birthDate: { type: Date },
  adopted: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
  image: { type: String, default: '' },
});

module.exports = mongoose.model('pets', petSchema);
