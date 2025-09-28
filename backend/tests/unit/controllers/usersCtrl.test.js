// Import du controller des utilisateurs
const usersCtrl = require("../../../controllers/usersCtrl");

// Import du modèle User
const { User } = require("../../../models");

// Import de bcrypt pour comparer les mots de passe
const bcrypt = require("bcrypt");

// Import de jsonwebtoken pour générer le token JWT
const jwt = require("jsonwebtoken");

// On simule (mock) tous les modules externes pour ne pas toucher à la vraie BDD ni générer de vrais JWT
jest.mock("../../../models");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

// Bloc de tests unitaires pour le controller "users"
describe("users controller - unit", () => {

  // Sous-bloc pour tester la fonction login
  describe("login doit renvoyer un token", () => {

    // Test principal pour vérifier le login
    it("login ok", async () => {

      // Création d'une fausse requête (req) avec les données du login
      const req = {
        body: {
          email: "jean@test.com",
          password: "Test12345678!" // mot de passe en clair
        }
      };

      // Création d'une fausse réponse (res) avec des méthodes mockées
      const res = {
        status: jest.fn().mockReturnThis(), // permet de chaîner .json()
        json: jest.fn()
      };

      // Mock de User.findOne pour simuler que l'utilisateur existe dans la BDD
      User.findOne.mockResolvedValue({
        id: 1,
        email: "jean@test.com",
        password: "hashed", // mot de passe hashé stocké en BDD
        role: "Admin",
        firstname: "Jean",
        lastname: "Dupont"
      });

      // Mock de bcrypt.compare pour simuler que le mot de passe fourni est correct
      bcrypt.compare.mockResolvedValue(true);

      // Mock de jwt.sign pour retourner un token factice
      jwt.sign.mockReturnValue("fake-jwt-token");

      // Appel de la fonction login avec les requêtes et réponse mockées
      await usersCtrl.login(req, res);

      // Vérifie que User.findOne a été appelé avec le bon email
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: "jean@test.com" } });

      // Vérifie que bcrypt.compare a été appelé avec le mot de passe fourni et le hash stocké
      expect(bcrypt.compare).toHaveBeenCalledWith("Test12345678!", "hashed");

      // Vérifie que jwt.sign a été appelé pour générer le token
      expect(jwt.sign).toHaveBeenCalled();

      // Vérifie que la réponse HTTP a été 200 (OK)
      expect(res.status).toHaveBeenCalledWith(200);

      // Vérifie que la réponse JSON contient le token et la redirection
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: "fake-jwt-token",
        redirect: "/pages/admin/dashboard.html" // <-- correction ici
      }));
    });
  });
});