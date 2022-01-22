import { Router } from 'express';
import passport from 'passport';
import User, { IUser } from '../models/user';

const router = Router();

router.post('/login', (req, res, next) => {
  console.log(req.body);
  if (!req.body.username)
    return res.status(422).json({ errors: { username: "can't be blank" } });
  if (!req.body.password)
    return res.status(422).json({ errors: { password: "can't be blank" } });
  passport.authenticate(
    'local',
    { session: true },
    (err, user: IUser, info) => {
      if (err) return next(err);
      if (user) {
        const token = user.generateJWT();
        return res.json({ token });
      } else {
        return res.status(422).json(info);
      }
    }
  )(req, res, next);
});

router.post('/register', async (req, res, next) => {
  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
  });
  newUser.setPassword(req.body.password);

  newUser
    .save()
    .then(() => {
      return res.json(newUser.toAuthJSON());
    })
    .catch(next);
});

export default router;
