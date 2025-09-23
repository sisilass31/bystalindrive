// Import de Sequelize et du modèle User
const { sequelize, User } = require("../../../models");

// Avant tous les tests : réinitialisation de la base de données
beforeAll(async () => await sequelize.sync({ force: true }));

// Après tous les tests : fermeture de la connexion à la base de données
afterAll(async () => await sequelize.close());

// Bloc de tests pour le modèle User
describe("user model", () => {

  // Test principal : vérifier la création d'un utilisateur valide
  it("doit créer un utilisateur valide", async () => {

    // Création d'un utilisateur
    const user = await User.create({
      firstname: "Alice",
      lastname: "Dupont",
      email: "alice@test.com",
      password: "Password123", // mot de passe en clair pour le test
      role: "client",
      is_deleted: false
    });

    // Vérification que le prénom correspond
    expect(user.firstname).toBe("Alice");

    // Vérification que l'email correspond
    expect(user.email).toBe("alice@test.com");

    // Nettoyage : suppression de l'utilisateur créé
    await user.destroy();
  });
});