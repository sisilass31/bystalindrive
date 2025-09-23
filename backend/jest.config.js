/** @type {import('jest').Config} */
module.exports = {
  // Définit l'environnement de test, ici "node" pour un environnement Node.js
  testEnvironment: "node",

  // Spécifie quels fichiers Jest doit considérer comme tests
  // Ici, tous les fichiers se terminant par .test.js dans le dossier tests ou ses sous-dossiers
  testMatch: ["**/tests/**/*.test.js"],

  // Les extensions de fichiers que Jest reconnaît pour les modules
  moduleFileExtensions: ["js", "json"],

  // Réinitialise automatiquement les mocks avant chaque test
  clearMocks: true,

  // Active la collecte de la couverture de code
  collectCoverage: true,

  // Définit les fichiers à inclure pour la collecte de couverture
  // Ici, tous les fichiers JS dans controllers et models
  collectCoverageFrom: ["controllers/**/*.js", "models/**/*.js"],

  // Répertoire où Jest stocke les rapports de couverture
  coverageDirectory: "coverage",

  // Temps maximum (en ms) qu'un test peut prendre avant d'échouer
  testTimeout: 10000, // 10 secondes
};