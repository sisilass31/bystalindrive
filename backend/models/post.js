'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      // Un Post appartient à un admin
      Post.belongsTo(models.User, { as: 'Admin', foreignKey: 'id_admin' });
      // Un Post appartient à un utilisateur
      Post.belongsTo(models.User, { as: 'User', foreignKey: 'id_user' });
    }
  }

  Post.init({
    id_admin: {    // clé étrangère vers admin
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_user: {     // clé étrangère vers utilisateur
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
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