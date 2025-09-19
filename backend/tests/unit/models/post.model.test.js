const { sequelize, Post, User } = require("../../../models");

beforeAll(async () => await sequelize.sync({ force: true }));
afterAll(async () => await sequelize.close());

describe("post model", () => {
  it("doit créer un post valide", async () => {
    const admin = await User.create({ firstname: "Admin", lastname: "Test", email: "admin@test.com", password: "Admin12345!", role: "admin", is_deleted: false });
    const user = await User.create({ firstname: "User", lastname: "Test", email: "user@test.com", password: "User12345!", role: "client", is_deleted: false });

    const post = await Post.create({
      id_admin: admin.id,
      id_client: user.id,
      appointment_date: new Date("2025-09-15"),
      start_time: "10:00:00",
      end_time: "11:00:00"
    });

    expect(post.id_admin).toBe(admin.id);
    expect(post.id_client).toBe(user.id);
    expect(new Date(post.appointment_date).toISOString()).toBe("2025-09-15T00:00:00.000Z");

    await post.destroy();
    await admin.destroy();
    await user.destroy();
  });
});