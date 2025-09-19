const { sequelize, User } = require("../../../models");

beforeAll(async () => await sequelize.sync({ force: true }));
afterAll(async () => await sequelize.close());

describe("user model", () => {
  it("doit créer un utilisateur valide", async () => {
    const user = await User.create({
      firstname: "Alice",
      lastname: "Dupont",
      email: "alice@test.com",
      password: "Password123",
      role: "client",
      is_deleted: false
    });

    expect(user.firstname).toBe("Alice");
    expect(user.email).toBe("alice@test.com");
    await user.destroy();
  });
});