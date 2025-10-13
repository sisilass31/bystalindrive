'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // Forcer l'insertion et afficher le résultat pour debug
    await queryInterface.bulkInsert('Users', [{
      prenom: 'Sihem',
      nom: 'Lassar',
      email: 'lassarsihem31@gmail.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true })
    .then(result => console.log('Inserted rows:', result))
    .catch(err => console.error('Erreur insertion admin:', err));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'lassarsihem31@gmail.com' }, {});
  }
};
