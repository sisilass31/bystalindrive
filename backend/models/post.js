'use strict';

module.exports = (sequelize, DataTypes) => {
  // Définition du modèle Post avec sequelize.define
  const Post = sequelize.define('Post', {
    id_admin: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_client: {
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
    tableName: 'Posts',
    timestamps: true,
    underscored: true
  });

  // Déclaration des relations
  Post.associate = (models) => {
    // Chaque Post appartient à un admin
    Post.belongsTo(models.User, { as: 'Admin', foreignKey: 'id_admin' });

    // Chaque Post appartient à un client
    Post.belongsTo(models.User, { as: 'Client', foreignKey: 'id_client' });
  };

  return Post;
};