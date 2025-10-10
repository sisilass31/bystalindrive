const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser'); // pour CSRF
const csrf = require('csurf');
require('dotenv').config();

const app = express();

// ----------------- MIDDLEWARE -----------------

// Helmet : protège contre XSS, sniffing, clickjacking, etc.
app.use(helmet());

// CORS : autorise uniquement ton frontend
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true // pour cookies (CSRF, JWT)
}));

// Parse JSON + cookies
app.use(express.json());
app.use(cookieParser());

// CSRF protection middleware conditionnel
const csrfProtection = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : require('csurf')({ cookie: true });

// ----------------- SERVIR LE FRONTEND -----------------

// Sert tout le dossier frontend (HTML, CSS, JS, images, etc.)
app.use(express.static(path.resolve(__dirname, '../frontend')));

// ----------------- ROUTES API -----------------

// Route pour fournir le token CSRF au frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const userRoutes = require('./routes/userRoutes');
const postsRoutes = require('./routes/postRoutes');

app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);

// ----------------- GESTION DES 404 -----------------

// Si aucune route n’est trouvée (API ou fichier)
app.use((req, res) => {
  res.status(404).sendFile(path.resolve(__dirname, '../frontend/pages/error-404.html'));
});

module.exports = app;