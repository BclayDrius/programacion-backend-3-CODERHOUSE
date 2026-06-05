const AdoptionsDAO = require('../dao/Adoptions');
const PetsDAO = require('../dao/Pets');
const UsersDAO = require('../dao/Users');

// Instancias únicas (patrón singleton por módulo en Node.js)
const adoptionsService = new AdoptionsDAO();
const petsService = new PetsDAO();
const usersService = new UsersDAO();

module.exports = { adoptionsService, petsService, usersService };
