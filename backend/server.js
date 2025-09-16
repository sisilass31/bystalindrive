const app = require('./app');
const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connecté à MySQL ✅');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: true, logging: console.log });
      console.log('BDD réinitialisée en dev');
    } else {
      await sequelize.sync({ logging: false });
    }

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (err) {
    console.error('Erreur lors de la connexion ou synchronisation :', err);
  }
})();