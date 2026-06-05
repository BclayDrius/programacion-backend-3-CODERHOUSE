const Adoption = require('../models/Adoption');

class AdoptionsDAO {
  async getAll() {
    return Adoption.find();
  }

  async getById(id) {
    return Adoption.findById(id);
  }

  async create(data) {
    return Adoption.create(data);
  }

  async update(id, data) {
    return Adoption.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return Adoption.findByIdAndDelete(id);
  }
}

module.exports = AdoptionsDAO;
