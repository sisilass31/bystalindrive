const request = require("supertest");
const app = require("../../app");
const bcrypt = require("bcrypt");
const { sequelize, User, Post } = require("../../models");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Posts Routes", () => {
  let tokenAdmin;
  let admin;
  let user;

  beforeAll(async () => {
    // Création admin et user avec mot de passe conforme à la regex (12+ caractères, maj + min + chiffre)
    admin = await User.create({
      firstname: "Admin",
      lastname: "Test",
      email: "admin@test.com",
      password: await bcrypt.hash("Adminpass123A", 10), // mot de passe valide
      role: "admin"
    });

    user = await User.create({
      firstname: "User",
      lastname: "Test",
      email: "user@test.com",
      password: await bcrypt.hash("Userpass123A", 10), // mot de passe valide
      role: "user"
    });

    // Login admin pour récupérer le token JWT
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "admin@test.com", password: "Adminpass123A" });

    tokenAdmin = res.body.token;
  });


  it("devrait refuser l'accès à /api/posts sans token", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.statusCode).toBe(401);
  });

  it("devrait permettre à un admin de créer un RDV", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        id_client: user.id,
        appointment_date: "2025-09-15",       // format DATEONLY
        start_time: "10:00:00",   // format TIME
        end_time: "11:00:00"      // format TIME
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id_admin).toBe(admin.id); // récupéré depuis le token
    expect(res.body.id_client).toBe(user.id);

    // Nettoyage
    await Post.destroy({ where: {} });
  });

});