const usersCtrl = require("../../../controllers/usersCtrl");
const { User } = require("../../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.mock("../../../models");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("users controller - unit", () => {
  describe("login doit renvoyer un token", () => {
    it("login ok", async () => {
      const req = {
        body: {
          email: "jean@test.com",
          password: "Test12345678!"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock User.findOne pour simuler utilisateur existant
      User.findOne.mockResolvedValue({
        id: 1,
        email: "jean@test.com",
        password: "hashed",
        role: "Admin",
        firstname: "Jean",
        lastname: "Dupont"
      });

      // Mock bcrypt.compare pour simuler mot de passe correct
      bcrypt.compare.mockResolvedValue(true);

      // Mock jwt.sign pour retourner un token factice
      jwt.sign.mockReturnValue("fake-jwt-token");

      await usersCtrl.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: "jean@test.com" } });
      expect(bcrypt.compare).toHaveBeenCalledWith("Test12345678!", "hashed");
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: "fake-jwt-token",
        redirect: "/pages/admin/users-dashboard.html"
      }));
    });
  });
});
