// Import de Sequelize et des modèles Post et User
const { sequelize, Post, User } = require("../../../models");

// Avant tous les tests : réinitialisation de la base de données
beforeAll(async () => await sequelize.sync({ force: true }));

// Après tous les tests : fermeture de la connexion à la base de données
afterAll(async () => await sequelize.close());

// Bloc de tests pour le modèle Post
describe("post model", () => {

  // Test principal : vérifier la création d'un post valide
  it("doit créer un post valide", async () => {

    // Création d'un utilisateur admin
    const admin = await User.create({
      firstname: "Admin",
      lastname: "Test",
      email: "admin@test.com",
      password: "Admin12345!", // mot de passe en clair pour le test
      role: "admin",
      is_deleted: false
    });

    // Création d'un utilisateur client
    const user = await User.create({
      firstname: "User",
      lastname: "Test",
      email: "user@test.com",
      password: "User12345!",
      role: "client",
      is_deleted: false
    });

    // Création d'un post / rendez-vous
    const post = await Post.create({
      id_admin: admin.id,
      id_client: user.id,
      appointment_date: new Date("2025-09-15"),
      start_time: "10:00:00",
      end_time: "11:00:00"
    });

    // Vérification que le post référence correctement l'admin
    expect(post.id_admin).toBe(admin.id);

    // Vérification que le post référence correctement le client
    expect(post.id_client).toBe(user.id);

    // Vérification que la date du rendez-vous est correcte
    expect(new Date(post.appointment_date).toISOString()).toBe("2025-09-15T00:00:00.000Z");

    // Nettoyage : suppression du post et des utilisateurs créés
    await post.destroy();
    await admin.destroy();
    await user.destroy();
  });
});