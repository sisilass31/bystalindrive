const { sequelize, User } = require("../../models");

// Avant tous les tests, synchroniser la base (vide les tables)
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Après tous les tests, fermer la connexion à la base
afterAll(async () => {
  await sequelize.close();
});

describe("User Model", () => {
  it("devrait créer un utilisateur valide", async () => {
    // Création d'un utilisateur test
    const user = await User.create({
      firstname: "Alice",
      lastname: "Dupont",
      email: "alice@test.com",
      password: "Password123"
    });

    // Vérification que les champs sont bien enregistrés
    expect(user.firstname).toBe("Alice");
    expect(user.email).toBe("alice@test.com");

    await user.destroy(); // nettoyage après le test
  });
});