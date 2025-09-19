const postsCtrl = require("../../../controllers/postsCtrl");
const { Post, User } = require("../../../models");

jest.mock("../../../models");

describe("posts controller - unit", () => {
  describe("createPost doit créer un post", () => {
    it("createPost ok", async () => {
      const req = {
        user: { id: 1 },
        body: {
          id_client: 2,
          appointment_date: "2025-09-15",
          start_time: "10:00:00",
          end_time: "11:00:00"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findByPk pour valider que le client existe
      User.findByPk.mockResolvedValue({ id: 2, firstname: "Jean", lastname: "Dupont" });

      // Mock Post.findOne pour simuler absence de conflit
      Post.findOne.mockResolvedValue(null);

      // Mock Post.create pour vérifier qu'il est appelé
      Post.create.mockResolvedValue({
        id: 10,
        ...req.body,
        id_admin: req.user.id
      });

      await postsCtrl.createPost(req, res);

      expect(Post.create).toHaveBeenCalledWith({
        id_admin: 1,
        id_client: 2,
        appointment_date: "2025-09-15",
        start_time: "10:00:00",
        end_time: "11:00:00"
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
    });
  });
});