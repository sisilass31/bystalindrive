const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../../models');
const app = require('../../app');

let adminToken;
let userToken;
let userId;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Création admin
    const hashedAdminPass = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({
        firstname: 'Admin',
        lastname: 'Test',
        email: 'admin@example.com',
        password: hashedAdminPass,
        role: 'admin'
    });

    adminToken = jwt.sign(
        { id: admin.id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Création user sans mot de passe
    const user = await User.create({
        firstname: 'Test',
        lastname: 'User',
        email: 'testuser@example.com',
        password: null,
        role: 'client'
    });
    userId = user.id;
});

afterAll(async () => {
    await sequelize.close();
});

describe('Users API Integration Tests', () => {

    test('admin can create a new user', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                firstname: 'New',
                lastname: 'User',
                email: 'newuser@example.com',
                role: 'client'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
    });

    test('user can set password', async () => {
        const tempToken = jwt.sign({ id: userId, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .post('/api/users/set-password')
            .send({ token: tempToken, password: 'NewUserPass123!' });

        expect(res.statusCode).toBe(200);

        userToken = jwt.sign({ id: userId, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    test('user can login', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'testuser@example.com',
                password: 'NewUserPass123!'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        userToken = res.body.token;
    });

    test('user can get own info', async () => {
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('testuser@example.com');
        expect(res.body.firstname).toBe('Test');
    });

    test('user can update own password', async () => {
        const res = await request(app)
            .put(`/api/users/${userId}/password`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                oldPassword: 'NewUserPass123!',
                newPassword: 'UpdatedPass123!'
            });

        expect(res.statusCode).toBe(200);

        const updatedUser = await User.findByPk(userId);
        expect(updatedUser.password).toBeDefined();

        const match = await bcrypt.compare('UpdatedPass123!', updatedUser.password);
        expect(match).toBe(true);
    });

    test('admin can list all users', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    test('admin can get single user info', async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('testuser@example.com');
    });

});