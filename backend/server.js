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
    if (process.env.NODE_ENV === 'development') {
      // Crée les tables manquantes, ne supprime jamais les données
      await sequelize.sync({ alter: true, logging: false });
      console.log('BDD synchronisée en dev');
    } else {
      // En production, synchronise sans logs et sans altérer la BDD
      await sequelize.sync({ logging: false });
    }

    // Définition du port du serveur (par défaut 3000 si non défini dans .env)
    const port = process.env.PORT || 3000;

    // Démarre le serveur Express
    // app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    app.listen(port, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Server running on http://localhost:${port}`);
      } else {
        console.log(`Server running. Frontend disponible sur https://bystalindrive.netlify.app/`);
      }
    });

  } catch (err) {
    // Gestion des erreurs de connexion ou de synchronisation
    console.error('Erreur lors de la connexion ou synchronisation :', err);
  }
})();