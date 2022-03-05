import { Router } from 'express';
import passport from 'passport';
import { Strategy } from 'passport-local';
import userModel from '../user/user.model';

const passportMiddleware = Router();

passportMiddleware.use(passport.initialize());

passportMiddleware.use(passport.session());

passport.use(
  new Strategy((username, passport, done) => {
    userModel
      .findOne({ username: username })
      .then((user) => {
        done(null, user);
      })
      .catch(done);
  })
);

export default passportMiddleware;
