const User = require('../models/User');

class UsersDAO {
  async getAll() {
    return User.find();
  }

  async getById(id) {
    return User.findById(id);
  }

  async getByEmail(email) {
    return User.findOne({ email });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = UsersDAO;
