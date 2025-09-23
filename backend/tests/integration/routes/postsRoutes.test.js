// Import de supertest pour tester les routes HTTP
const request = require("supertest");

// Import de l'application Express
const app = require("../../../app");

// Import de Sequelize et du modèle User
const { sequelize, User } = require("../../../models");

// Import de bcrypt pour le hash des mots de passe
const bcrypt = require("bcrypt");

// Variables globales pour stocker le token et les utilisateurs
let tokenAdmin, admin, user;

// Avant tous les tests : préparation de la BDD et création des utilisateurs
beforeAll(async () => {
  // Réinitialise la base de données en supprimant et recréant toutes les tables
  await sequelize.sync({ force: true });

  // Création d'un utilisateur admin avec mot de passe hashé
  admin = await User.create({
    firstname: "Admin",
    lastname: "Test",
    email: "admin@test.com",
    password: await bcrypt.hash("Adminpass123A", 10), // hash du mot de passe
    role: "admin",
    is_deleted: false
  });

  // Création d'un utilisateur client avec mot de passe hashé
  user = await User.create({
    firstname: "User",
    lastname: "Test",
    email: "user@test.com",
    password: await bcrypt.hash("Userpass123A", 10),
    role: "client",
    is_deleted: false
  });

  // Connexion de l'admin pour récupérer un token JWT
  const res = await request(app)
    .post("/api/users/login")
    .send({ email: "admin@test.com", password: "Adminpass123A" });

  // Stockage du token pour l'utiliser dans les tests
  tokenAdmin = res.body.token;
});

// Après tous les tests : fermeture de la connexion à la base de données
afterAll(async () => await sequelize.close());

// Bloc de tests pour les routes "posts"
describe("posts routes - integration", () => {

  // Test de création d'un RDV via POST /api/posts
  it("POST /api/posts doit créer un RDV", async () => {
    const res = await request(app)
      .post("/api/posts")
      // Ajout du token admin dans l'en-tête Authorization
      .set("Authorization", `Bearer ${tokenAdmin}`)
      // Envoi des données du rendez-vous
      .send({
        id_client: user.id,
        appointment_date: "2025-09-15",
        start_time: "10:00:00",
        end_time: "11:00:00"
      });

    // Vérifie que le code HTTP est 201 (créé)
    expect(res.statusCode).toBe(201);

    // Vérifie que le RDV a bien été créé par l'admin
    expect(res.body.id_admin).toBe(admin.id);

    // Vérifie que le RDV concerne le bon client
    expect(res.body.id_client).toBe(user.id);
  });
});