const { sequelize, Post, User } = require("../../models");

// Avant tous les tests, synchroniser la base (vide les tables)
beforeAll(async () => {
    await sequelize.sync({ force: true });
});

// Après tous les tests, fermer la connexion à la base
afterAll(async () => {
    await sequelize.close();
});

describe("Post Model", () => {
    it("devrait créer un rendez-vous valide", async () => {
        // Création d'un admin pour le RDV
        const admin = await User.create({
            firstname: "Admin",
            lastname: "Test",
            email: "admin@test.com",
            password: "Adminpass123!",
            role: "admin"
        });

        // Création d'un utilisateur pour le RDV
        const user = await User.create({
            firstname: "User",
            lastname: "Test",
            email: "user@test.com",
            password: "Userpass123!",
            role: "user"
        });

        // Création d'un rendez-vous lié à l'admin et l'utilisateur
        const post = await Post.create({
            id_admin: admin.id,
            id_user: user.id,
            date: new Date("2025-09-15"),
            start_time: "10:00:00",
            end_time: "11:00:00"
        });

        // Vérification que les champs du RDV sont corrects
        expect(post.id_admin).toBe(admin.id);
        expect(post.id_user).toBe(user.id);
        expect(new Date(post.date).toISOString()).toBe("2025-09-15T00:00:00.000Z");
        expect(post.start_time).toBe("10:00:00");
        expect(post.end_time).toBe("11:00:00");

        // Nettoyage : suppression du RDV, admin et user
        await post.destroy();
        await admin.destroy();
        await user.destroy();
    });
});
