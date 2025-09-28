'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // On définit le modèle User qui hérite de Sequelize.Model
  class User extends Model {
    // Ici on déclare les associations avec d'autres modèles
    static associate(models) {
      // Un user (admin) peut créer plusieurs posts/rendez-vous
      User.hasMany(models.Post, { as: 'RdvCrees', foreignKey: 'id_admin' });
    }
  }

  // On initialise le modèle avec ses colonnes/attributs
  User.init({
    // Prénom de l’utilisateur
    firstname: {
      type: DataTypes.STRING(50), // 50 caractères max
      allowNull: false
    },

    // Nom de famille de l’utilisateur
    lastname: {
      type: DataTypes.STRING(50), // 50 caractères max
      allowNull: false
    },

    // Email unique et obligatoire avec validation de format
    email: {
      type: DataTypes.STRING(100), // 100 caractères max
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },

    // Mot de passe hashé
    password: {
      type: DataTypes.STRING(255), // 255 pour stocker le hash complet
      allowNull: true
    },


    // Rôle limité à admin ou client, par défaut client
    role: {
      type: DataTypes.ENUM('admin', 'client'),
      allowNull: false,
      defaultValue: 'client'
    },

    // Champ pour un "soft delete" (désactivation sans suppression physique)
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    // Instance sequelize utilisée
    sequelize,

    // Nom du modèle dans Sequelize
    modelName: 'User',

    // Nom explicite de la table en base
    tableName: 'Users',

    // Ajoute created_at et updated_at automatiquement
    timestamps: true,

    // Transforme les noms en snake_case (ex: created_at au lieu de createdAt)
    underscored: true
  });

  return User;
};