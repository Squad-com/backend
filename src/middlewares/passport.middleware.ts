import { Router } from 'express';
import passport from 'passport';
import { Strategy } from 'passport-local';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import userModel from '../user/user.model';

const passportMiddleware = Router();

passportMiddleware.use(passport.initialize());

passportMiddleware.use(passport.session());

passport.use(
  new Strategy((username, passport, callback) => {
    userModel
      .findOne({ username: username })
      .then((user) => {
        const isValid = user.validPassword(passport);
        if (isValid) return callback(null, user);
        return callback(new WrongCredentialsException());
      })
      .catch(callback);
  })
);

export default passportMiddleware;
