const postsCtrl = require("../../controllers/postsCtrl");

describe("Posts Controller", () => {
  it("devrait être défini", () => {
    expect(postsCtrl).toBeDefined();
  });

  it("devrait avoir les méthodes CRUD", () => {
    expect(postsCtrl.createPost).toBeInstanceOf(Function);
    expect(postsCtrl.getAllPosts).toBeInstanceOf(Function);
    expect(postsCtrl.getOnePost).toBeInstanceOf(Function);
    expect(postsCtrl.deletePost).toBeInstanceOf(Function);
  });
});
