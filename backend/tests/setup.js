// tests/setup.js
const { sequelize } = require('../models');

beforeAll(async () => {
  // Recrée toutes les tables en mémoire avant les tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Ferme la connexion après les tests
  await sequelize.close();
});