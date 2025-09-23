'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Définition de la classe Post qui hérite de Sequelize.Model
  class Post extends Model {
    // Déclaration des relations avec les autres modèles
    static associate(models) {
      // Chaque Post est lié à un admin (User) par la clé étrangère id_admin
      Post.belongsTo(models.User, { as: 'Admin', foreignKey: 'id_admin' });

      // Chaque Post est lié à un client (User) par la clé étrangère id_client
      Post.belongsTo(models.User, { as: 'Client', foreignKey: 'id_client' });
    }
  }

  // Initialisation du modèle Post avec ses attributs (colonnes en base)
  Post.init({
    // Référence vers l’admin qui a créé le rendez-vous
    id_admin: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // Référence vers le client concerné par le rendez-vous
    id_client: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // Date du rendez-vous (sans l’heure)
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    // Heure de début du rendez-vous
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    // Heure de fin du rendez-vous
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },

    // Soft delete : permet de désactiver le rendez-vous sans le supprimer définitivement
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    // Instance sequelize utilisée
    sequelize,

    // Nom du modèle dans Sequelize
    modelName: 'Post',

    // Nom de la table en base de données
    tableName: 'Posts',

    // Active automatiquement created_at et updated_at
    timestamps: true,

    // Utilise snake_case pour les colonnes (ex: appointment_date)
    underscored: true
  });

  // On retourne le modèle pour qu’il soit utilisable ailleurs
  return Post;
};