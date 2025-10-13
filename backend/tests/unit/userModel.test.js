const { sequelize, User } = require('../../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('User model', () => {
  test('should create a user with valid data', async () => {
    const user = await User.create({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      role: 'client'
    });

    expect(user.id).toBeDefined();
    expect(user.firstname).toBe('John');
    expect(user.lastname).toBe('Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe('client');
    expect(user.is_deleted).toBe(false);
  });

  test('should not allow invalid email', async () => {
    await expect(User.create({
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'notanemail',
      password: 'hashedpassword',
    })).rejects.toThrow();
  });

  test('should use default role "client" if not specified', async () => {
    const user = await User.create({
      firstname: 'Alice',
      lastname: 'Smith',
      email: 'alice@example.com',
      password: 'hashedpassword',
    });
    expect(user.role).toBe('client');
  });
});