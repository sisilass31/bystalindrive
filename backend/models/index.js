'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');

// Nom du fichier courant (index.js)
const basename = path.basename(__filename);

// Détection de l’environnement (défaut = development)
const env = process.env.NODE_ENV || 'development';

// Récupération de la config (config.json) selon l’environnement
const config = require(path.join(__dirname, '/../config/config.js'))[env];

// Objet qui contiendra tous les modèles
const db = {};

let sequelize;

// Si on est en environnement de test, on utilise SQLite en mémoire
if (env === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',   // Type de base : SQLite
    storage: ':memory:', // Stockage uniquement en mémoire
    logging: false       // Pas de logs SQL
  });

// Si on a une variable d’environnement pour la DB (ex: en prod)
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);

// Sinon, on se connecte avec les infos du fichier config.json
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Chargement automatique de tous les modèles du dossier "models"
fs
  .readdirSync(__dirname) // on lit les fichiers du dossier courant
  .filter(file => (
    file.indexOf('.') !== 0 &&      // on ignore les fichiers cachés
    file !== basename &&            // on ignore index.js (ce fichier)
    file.slice(-3) === '.js' &&     // on ne prend que les .js
    file.indexOf('.test.js') === -1 // on ignore les fichiers de tests
  ))
  .forEach(file => {
    // On importe la fonction qui définit le modèle
    const modelFactory = require(path.join(__dirname, file));

    // Vérifie que le fichier exporte bien une fonction (sécurité)
    if (typeof modelFactory !== 'function') {
      console.warn(`⚠️ Le fichier ${file} n'exporte pas une fonction et sera ignoré.`);
      return;
    }

    // On exécute la fonction pour créer le modèle avec sequelize et DataTypes
    const model = modelFactory(sequelize, DataTypes);

    // On stocke le modèle dans l’objet db
    db[model.name] = model;
  });

// On applique les associations si elles existent (User.hasMany(Post), etc.)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// On ajoute sequelize et Sequelize dans l’objet db pour les exporter aussi
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// On exporte db qui contient tous les modèles + sequelize
module.exports = db;