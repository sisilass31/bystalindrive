const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser'); // ✅ pour CSRF
const csrf = require('csurf');
require('dotenv').config();

const app = express();

// ----------------- MIDDLEWARE -----------------
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true // ✅ pour cookies CSRF
}));
app.use(express.json());
app.use(cookieParser());

// CSRF protection middleware global
const csrfProtection = csrf({ cookie: true });

// ----------------- SERVIR LE FRONTEND AVEC CACHE -----------------
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: '30d',
  etag: true
}));

// CSRF token route
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ----------------- ROUTES -----------------
const userRoutes = require('./routes/userRoutes'); // inject CSRF
const postsRoutes = require('./routes/postRoutes');

app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);

// 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/pages/error-404.html'));
});

module.exports = app;