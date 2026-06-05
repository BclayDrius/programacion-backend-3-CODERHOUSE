const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'pets', required: true },
}, { timestamps: true });

module.exports = mongoose.model('adoptions', adoptionSchema);
