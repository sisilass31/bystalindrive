'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Relation : un user/admin peut créer plusieurs rendez-vous
      User.hasMany(models.Post, { as: 'RdvCrees', foreignKey: 'id_admin' });
    }
  }

  User.init({
    firstname: {
      type: DataTypes.STRING,
      allowNull: false
    },

    lastname: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // UNIQUE sur email
      validate: { isEmail: true }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    },
    is_deleted: {               
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    underscored: true
  });

  return User;
};