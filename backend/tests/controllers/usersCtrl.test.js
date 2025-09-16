const usersCtrl = require("../../controllers/usersCtrl");

describe("Users Controller", () => {
  // Vérifie que le controller est bien défini
  it("devrait être défini", () => {
    expect(usersCtrl).toBeDefined();
  });

  // Vérifie que les méthodes principales du controller existent
  it("devrait avoir les méthodes CRUD", () => {
    expect(usersCtrl.register).toBeInstanceOf(Function); // méthode d'inscription
    expect(usersCtrl.login).toBeInstanceOf(Function);    // méthode de connexion
    expect(usersCtrl.getMe).toBeInstanceOf(Function);   // méthode pour récupérer l'utilisateur connecté
  });
});
