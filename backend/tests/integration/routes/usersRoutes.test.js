// Import de supertest pour effectuer des requêtes HTTP sur l'app Express
const request = require("supertest");

// Import de l'application Express
const app = require("../../../app");

// Import de l'instance Sequelize pour gérer la base de données
const { sequelize } = require("../../../models");

// Avant tous les tests : réinitialisation de la base de données
beforeAll(async () => await sequelize.sync({ force: true }));

// Après tous les tests : fermeture de la connexion à la base de données
afterAll(async () => await sequelize.close());

// Bloc de tests pour les routes "users"
describe("users routes - integration", () => {
  // Test de la route POST /api/users/register
  it("POST /api/users/register doit créer un utilisateur", async () => {
    
    // Envoi d'une requête POST avec les informations du nouvel utilisateur
    const res = await request(app)
      .post("/api/users/register")
      .send({
        firstname: "Jean",
        lastname: "Dupont",
        email: "jean@example.com",
        password: "Test12345678!" // mot de passe en clair, sera hashé dans le controller
      });

    // Vérifie que le code HTTP est 201 (Créé)
    expect(res.statusCode).toBe(201);

    // Vérifie que la réponse contient bien un identifiant pour le nouvel utilisateur
    expect(res.body).toHaveProperty("id");
  });
});