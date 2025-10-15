// bcryptjs pour tester le hash et la comparaison des mots de passe
const bcrypt = require('bcryptjs');
// jwt pour tester la génération et vérification des tokens
const jwt = require('jsonwebtoken');
// Yup pour tester la validation des champs (ex: email)
const Yup = require('yup');

describe('Unit tests - User utils', () => {

  test('Hash and compare password with bcrypt', async () => {
    // mot de passe à tester
    const password = 'Test123!';
    // hash du mot de passe
    const hash = await bcrypt.hash(password, 10);
    // comparaison du mot de passe en clair avec le hash
    const match = await bcrypt.compare(password, hash);
    // vérifie que le hash correspond au mot de passe
    expect(match).toBe(true);
  });

  test('Generate and verify JWT token', () => {
    // création d’un token avec payload simple
    const token = jwt.sign({ id: 1 }, 'secret', { expiresIn: '1h' });
    // décodage du token pour vérifier le payload
    const decoded = jwt.verify(token, 'secret');
    // vérifie que le payload correspond au token
    expect(decoded.id).toBe(1);
  });

  test('Validate email with Yup', async () => {
    // schema Yup pour validation email
    const schema = Yup.object({ email: Yup.string().email().required() });
    // email valide passe la validation
    await expect(schema.validate({ email: 'user@test.com' })).resolves.toBeTruthy();
    // email invalide renvoie une erreur
    await expect(schema.validate({ email: 'invalid' })).rejects.toThrow();
  });

});