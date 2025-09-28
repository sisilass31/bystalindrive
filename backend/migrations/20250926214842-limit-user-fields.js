'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'firstname', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'lastname', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'firstname', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'lastname', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }
};