// Import du controller des posts
const postsCtrl = require("../../../controllers/postsCtrl");

// Import des modèles Post et User
const { Post, User } = require("../../../models");

// On simule (mock) tous les modèles pour éviter d'interagir avec la vraie BDD
jest.mock("../../../models");

// Bloc de tests unitaires pour le controller "posts"
describe("posts controller - unit", () => {

  // Sous-bloc pour tester la fonction createPost
  describe("createPost doit créer un post", () => {

    // Test principal pour vérifier la création d'un post
    it("createPost ok", async () => {

      // Création d'une fausse requête (req) avec un utilisateur admin et les données du RDV
      const req = {
        user: { id: 1 }, // id de l'admin
        body: {
          id_client: 2,
          appointment_date: "2025-09-15",
          start_time: "10:00:00",
          end_time: "11:00:00"
        }
      };

      // Création d'une fausse réponse (res) avec des méthodes mockées
      const res = {
        status: jest.fn().mockReturnThis(), // permet de chaîner .json()
        json: jest.fn()
      };

      // Mock de User.findByPk pour simuler que le client existe
      User.findByPk.mockResolvedValue({ id: 2, firstname: "Jean", lastname: "Dupont" });

      // Mock de Post.findOne pour simuler qu'il n'y a pas de conflit de RDV
      Post.findOne.mockResolvedValue(null);

      // Mock de Post.create pour simuler la création réussie du post
      Post.create.mockResolvedValue({
        id: 10,
        ...req.body,
        id_admin: req.user.id
      });

      // Appel de la fonction createPost avec les requêtes et réponse mockées
      await postsCtrl.createPost(req, res);

      // Vérifie que Post.create a bien été appelé avec les bonnes données
      expect(Post.create).toHaveBeenCalledWith({
        id_admin: 1,
        id_client: 2,
        appointment_date: "2025-09-15",
        start_time: "10:00:00",
        end_time: "11:00:00"
      });

      // Vérifie que la réponse HTTP a été 201 (Créé)
      expect(res.status).toHaveBeenCalledWith(201);

      // Vérifie que la réponse JSON contient l'objet créé avec id 10
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
    });
  });
});