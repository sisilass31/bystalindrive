// Import de l'application Express
const app = require('./app');

// Import de l'instance Sequelize (connexion à la base de données)
const { sequelize } = require('./models');

// Fonction asynchrone auto-exécutée pour gérer la connexion à la BDD et démarrer le serveur
(async () => {
  try {
    // Vérifie si la connexion à la base de données fonctionne
    await sequelize.authenticate();
    console.log('Connecté à MySQL ✅');

    // Si on est en environnement de développement
    if (process.env.NODE_ENV === 'development') {
      // Synchronise tous les modèles avec la base de données
      // 'force: true' supprime et recrée toutes les tables à chaque lancement
      // 'logging: console.log' affiche les requêtes SQL dans la console
      await sequelize.sync({ force: true, logging: console.log });
      console.log('BDD réinitialisée en dev');
    } else {
      // En production, on synchronise sans forcer et sans afficher les logs SQL
      await sequelize.sync({ logging: false });
    }

    // Définition du port du serveur (par défaut 3000 si non défini dans .env)
    const port = process.env.PORT || 3000;

    // Démarre le serveur Express
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (err) {
    // Gestion des erreurs de connexion ou de synchronisation
    console.error('Erreur lors de la connexion ou synchronisation :', err);
  }
})();