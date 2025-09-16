const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ----------------- MIDDLEWARE -----------------
app.use(cors({
  origin: "http://localhost:3000"
}));
app.use(express.json());

// ----------------- SERVIR LE FRONTEND -----------------
app.use(express.static(path.join(__dirname, '../frontend')));

// ----------------- ROUTES -----------------
const userRoutes = require('./routes/userRoutes');
const postsRoutes = require('./routes/postRoutes');

app.use('/api/users', userRoutes);
app.use('/api/posts', postsRoutes);

// 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/pages/error-404.html'));
});

module.exports = app; // export de l'instance express