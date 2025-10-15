const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser'); // pour CSRF
const csrf = require('csurf');
require('dotenv').config();

const app = express();

// ----------------- MIDDLEWARE -----------------

// URL frontend + backend
const FRONT_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://bystalindrive.netlify.app';

// Helmet : protection XSS, clickjacking, CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true, // conserve les directives par défaut
      directives: {
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "https://bystalindrive.onrender.com",
          "https://bystalindrive.netlify.app"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.boxicons.com",
          "https://unpkg.com",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.boxicons.com",
          "https://unpkg.com"
        ],
        imgSrc: ["'self'", "data:"]
      },
    },
  })
);

// CORS : autorise uniquement ton frontend
app.use(
  cors({
    origin: FRONT_URL,
    credentials: true, // pour cookies (CSRF, JWT)
  })
);

// Parse JSON + cookies
app.use(express.json());
app.use(cookieParser());

// CSRF protection middleware conditionnel
const csrfProtection =
  process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : csrf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // secure seulement en prod HTTPS
        sameSite: 'None' // obligatoire pour cross-domain sur mobile
      }
    });

// ----------------- SERVIR LE FRONTEND -----------------

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

app.use((req, res) => {
  res.status(404).sendFile(
    path.resolve(__dirname, '../frontend/pages/error-404.html')
  );
});

module.exports = app;