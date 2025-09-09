const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();


// ----------------- MIDDLEWARE -----------------
app.use(cors({
  origin: "http://localhost:3000" // adapte si ton frontend est ailleurs
}));
app.use(express.json());

// ----------------- SERVIR LE FRONTEND -----------------
app.use(express.static(path.join(__dirname, '../frontend')));

// ----------------- ROUTES -----------------
const userRoutes = require('./routes/userRoutes');
const postsRoutes = require('./routes/postRoutes');

app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/pages/error-404.html'));
});


// ----------------- CONNEXION BDD -----------------
const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connecté à MySQL ✅');

    if (process.env.NODE_ENV === 'development') {
      // En dev, réinitialisation possible pour tests
      await sequelize.sync({ force: true, logging: console.log });
      console.log('BDD réinitialisée en dev');
    } else {
      // En prod, synchronisation sans toucher aux tables
      await sequelize.sync({ logging: false });
    }

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (err) {
    console.error('Erreur lors de la connexion ou synchronisation :', err);
  }
})();