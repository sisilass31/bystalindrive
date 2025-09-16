const request = require("supertest");
const app = require("../../app");
const { sequelize, User } = require("../../models");

beforeAll(async () => {
  await sequelize.sync({ force: true }); // reset DB test
});

afterAll(async () => {
  await sequelize.close();
});

describe("Users Routes - Register", () => {
  it("devrait créer un utilisateur (201)", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        firstname: "Jean",
        lastname: "Dupont",
        email: "jean.dupont@example.com",
        password: "Azerty1234!A" // mot de passe valide
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("firstname", "Jean");
    expect(res.body).toHaveProperty("lastname", "Dupont");
    expect(res.body).toHaveProperty("email", "jean.dupont@example.com");
    expect(res.body).not.toHaveProperty("password"); // ne pas renvoyer le mdp hashé
  });

  it("ne devrait pas créer d’utilisateur avec email invalide (400)", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        firstname: "Paul",
        lastname: "Martin",
        email: "email_invalide",
        password: "Azerty1234!A"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Email invalide.");
  });

  it("ne devrait pas créer d’utilisateur si email déjà existant (400)", async () => {
    // on réutilise l’email de Jean
    const res = await request(app)
      .post("/api/users/register")
      .send({
        firstname: "Jean",
        lastname: "Dupont",
        email: "jean.dupont@example.com",
        password: "Azerty1234!A"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Cet email existe déjà.");
  });

  it("devrait générer un mot de passe si non fourni (201)", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        firstname: "Alice",
        lastname: "Durand",
        email: "alice.durand@example.com"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("email", "alice.durand@example.com");
  });
});