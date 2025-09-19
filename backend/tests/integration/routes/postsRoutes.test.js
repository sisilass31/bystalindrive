const request = require("supertest");
const app = require("../../../app");
const { sequelize, User } = require("../../../models");
const bcrypt = require("bcrypt");

let tokenAdmin, admin, user;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  admin = await User.create({ firstname: "Admin", lastname: "Test", email: "admin@test.com", password: await bcrypt.hash("Adminpass123A", 10), role: "admin", is_deleted: false });
  user = await User.create({ firstname: "User", lastname: "Test", email: "user@test.com", password: await bcrypt.hash("Userpass123A", 10), role: "client", is_deleted: false });

  const res = await request(app).post("/api/users/login").send({ email: "admin@test.com", password: "Adminpass123A" });
  tokenAdmin = res.body.token;
});

afterAll(async () => await sequelize.close());

describe("posts routes - integration", () => {
  it("POST /api/posts doit créer un RDV", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ id_client: user.id, appointment_date: "2025-09-15", start_time: "10:00:00", end_time: "11:00:00" });

    expect(res.statusCode).toBe(201);
    expect(res.body.id_admin).toBe(admin.id);
    expect(res.body.id_client).toBe(user.id);
  });
});