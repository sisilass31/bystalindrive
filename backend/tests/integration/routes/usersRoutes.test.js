const request = require("supertest");
const app = require("../../../app");
const { sequelize } = require("../../../models");

beforeAll(async () => await sequelize.sync({ force: true }));
afterAll(async () => await sequelize.close());

describe("users routes - integration", () => {
  it("POST /api/users/register doit créer un utilisateur", async () => {
    const res = await request(app).post("/api/users/register").send({
      firstname: "Jean",
      lastname: "Dupont",
      email: "jean@example.com",
      password: "Test12345678!"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});