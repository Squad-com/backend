import passport from 'passport';
import { Strategy } from 'passport-local';
import { Router } from 'express';
import user from '../models/User';

const router = Router();

router.use(passport.initialize());

router.use(passport.session());

passport.use(
  new Strategy((username, passport, done) => {
    user
      .findOne({ username: username })
      .then((user) => {
        done(null, user);
      })
      .catch(done);
  })
);

export default router;
