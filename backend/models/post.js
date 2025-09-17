'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      // Un Post appartient à un admin
      Post.belongsTo(models.User, { as: 'Admin', foreignKey: 'id_admin' });
      // Un Post appartient à un utilisateur
      Post.belongsTo(models.User, { as: 'Client', foreignKey: 'id_client' });
    }
  }

  Post.init({
    id_admin: {    // clé étrangère vers admin
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_client: {     // clé étrangère vers utilisateur
      type: DataTypes.INTEGER,
      allowNull: false
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'Posts',
    timestamps: true,
    underscored: true
  });

  return Post;
};