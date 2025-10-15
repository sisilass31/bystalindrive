// importe les fonctions à tester depuis le controller usersCtrl
const { register, login, setPassword } = require('../../controllers/usersCtrl');
// importe le modèle User pour pouvoir le mocker
const { User } = require('../../models');
// importe la fonction sendMail pour mocker l'envoi d'email
const sendMail = require('../../utils/sendMail');
// bcrypt pour comparer/hasher les mots de passe
const bcrypt = require('bcrypt');
// jwt pour créer des tokens temporaires dans les tests
const jwt = require('jsonwebtoken');

// mock le modèle User pour isoler mes tests unitaires
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),   // simule la recherche d'un utilisateur
    findByPk: jest.fn(),   // simule la recherche par ID
    create: jest.fn()      // simule la création d'un utilisateur
  }
}));

// mock sendMail pour ne pas envoyer de vrais emails pendant les tests
jest.mock('../../utils/sendMail', () => jest.fn(async () => true));

describe('Users Controller - Unit tests', () => {

  // réinitialise les mocks après chaque test pour éviter les interférences
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('register: should create a new user and send email', async () => {
    // Aucun utilisateur n'existe déjà dans la base (mock)
    User.findOne.mockResolvedValue(null);

    // mock de la création d’un nouvel utilisateur
    const mockUser = { id: 1, firstname: 'Test', lastname: 'User', email: 'test@mail.com', role: 'client' };
    User.create.mockResolvedValue(mockUser);

    // simulation req et res comme dans express
    const req = {
      body: { firstname: 'Test', lastname: 'User', email: 'test@mail.com', role: 'client' }
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // appel la fonction register
    await register(req, res);

    // vérif que les mocks sont appelés correctement
    expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@mail.com' } });
    expect(User.create).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@mail.com' }));
  });

  test('login: should return token when password correct', async () => {
    // hash le mot de passe pour simuler un utilisateur existant
    const hashed = await bcrypt.hash('Password123!', 10);

    // mock d'un utilisateur avec mot de passe hashé
    const mockUser = {
      id: 1,
      firstname: 'Test',
      lastname: 'User',
      email: 'test@mail.com',
      password: hashed,
      role: 'client'
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = {
      body: { email: 'test@mail.com', password: 'Password123!' }
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    // appel login
    await login(req, res);

    // vérif que le token est renvoyé correctement
    expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@mail.com' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String), redirect: expect.any(String) }));
  });

  test('setPassword: should hash password and save', async () => {
    // création d'un token temporaire pour simuler la route set-password
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
    const req = { body: { token, password: 'Password123!' } };

    // Je mock un utilisateur existant sans mot de passe défini
    const saveMock = jest.fn();
    User.findByPk.mockResolvedValue({ id: 1, password: null, save: saveMock });

    const res = { status: jest.fn(() => res), json: jest.fn() };

    // appel setPassword
    await setPassword(req, res);

    // vérif que le password est bien hashé et sauvegardé
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

});