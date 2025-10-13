// On charge les variables d'environnement depuis le fichier .env
require('dotenv').config({ path: './config/.env' });

// On importe le module mysql2 pour se connecter à MySQL
const mysql = require('mysql2');

// Création d'une connexion MySQL avec les infos du .env
const db = mysql.createConnection({
  host: process.env.DB_HOST,      // hôte de la base
  port: process.env.DB_PORT,      // port MySQL
  user: process.env.DB_USER,      // utilisateur MySQL
  password: process.env.DB_PASSWORD,  // mot de passe MySQL
  database: process.env.DB_NAME,  // nom de la base de données
});

// On tente de se connecter à la base
db.connect((err) => {
  // Si erreur, on arrête et on affiche l'erreur
  if (err) throw err;

  // Sinon, connexion réussie
  console.log('Connecté à MySQL ✅');
});

// On exporte l'objet db pour l'utiliser dans d'autres fichiers
module.exports = db;