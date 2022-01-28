import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config';
import User from '../../models/User';

const getTestUser = () =>
  new User({
    firstName: 'test',
    lastName: 'lastName',
    username: 'test',
    email: 'test@test.com',
  });
describe('user.generateJWT', () => {
  it('should generate a valid jwt token', () => {
    const user = getTestUser();
    const token = user.generateJWT();
    const decoded = jwt.verify(token, config.secret as string, {
      algorithms: ['HS256'],
    });

    // token must contain user id
    expect(decoded).toMatchObject({ id: user.id });
  });
});

describe('user.setPassword', () => {
  it('should encode password correctly', () => {
    const password = 'TestPassword';
    const user = getTestUser();
    user.setPassword(password);
    const hash = crypto
      .pbkdf2Sync(password, user.salt, 10000, 512, 'sha512')
      .toString('hex');

    expect(user.hash).toEqual(hash);
  });

  it('should create different hash for different passwords', () => {
    const password1 = 'TestPassword';
    const password2 = 'DifferentPassword';
    const user = getTestUser();

    // create first password
    user.setPassword(password1);
    const hash1 = user.hash;

    //create second password
    user.setPassword(password2);
    const hash2 = user.hash;

    expect(hash1).not.toBe(hash2);
  });
});

describe('user.validPassword', () => {
  const password = 'TestPassword';
  const user = getTestUser();
  user.setPassword(password);

  it('should validate correct password', () => {
    const result = user.validPassword(password);
    expect(result).toBe(true);
  });

  it('should not validate false password', () => {
    const result = user.validPassword('password');
    expect(result).toBe(false);
  });
});
