const request = require("supertest");
const app = require("../../app");

describe("users routes - integration", () => {
  it("POST /api/users/register-test doit créer un utilisateur", async () => {
    const res = await request(app)
      .post("/api/users/register-test")
      .send({
        firstname: "Jean",
        lastname: "Dupont",
        email: "jean@example.com",
        password: null
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
  });
});