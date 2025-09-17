'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Ajouter temporairement 'client' à l'ENUM
    await queryInterface.sequelize.query(
      "ALTER TABLE Users MODIFY role ENUM('admin','user','client') NOT NULL DEFAULT 'user';"
    );

    // 2️⃣ Mettre à jour les anciennes valeurs
    await queryInterface.sequelize.query(
      "UPDATE Users SET role='client' WHERE role='user';"
    );

    // 3️⃣ Modifier l'ENUM final (supprime 'user')
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'client'),
      allowNull: false,
      defaultValue: 'client'
    });

    // 4️⃣ Renommer la colonne 'date' dans Posts
    await queryInterface.renameColumn('Posts', 'date', 'appointment_date');
  },

  async down(queryInterface, Sequelize) {
    // rollback : renommer la colonne
    await queryInterface.renameColumn('Posts', 'appointment_date', 'date');

    // rollback : remettre l'ENUM initial
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};