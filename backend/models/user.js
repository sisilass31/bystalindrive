'use strict';

module.exports = (sequelize, DataTypes) => {
  // Définition du modèle User avec sequelize.define
  const User = sequelize.define('User', {
    firstname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'client'),
      allowNull: false,
      defaultValue: 'client'
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'Users',
    timestamps: true,
    underscored: true
  });

  // Déclaration des relations
  User.associate = (models) => {
    // Un admin peut créer plusieurs rendez-vous
    User.hasMany(models.Post, { as: 'RdvCrees', foreignKey: 'id_admin' });

    // Un client peut avoir plusieurs rendez-vous également
    User.hasMany(models.Post, { as: 'RdvClient', foreignKey: 'id_client' });
  };

  return User;
};