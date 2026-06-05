const Pet = require('../models/Pet');

class PetsDAO {
  async getAll() {
    return Pet.find();
  }

  async getById(id) {
    return Pet.findById(id);
  }

  async create(data) {
    return Pet.create(data);
  }

  async update(id, data) {
    return Pet.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return Pet.findByIdAndDelete(id);
  }
}

module.exports = PetsDAO;
