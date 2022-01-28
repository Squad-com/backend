import auth from '../middlewares/auth';
import { Router } from 'express';
import User from '../models/User';

const router = Router();

router.get('/', auth, async (req, res, next) => {
  const userId = req.user;
  const user = await User.findById(userId);
  if (!user) return res.status(404).send('There is no user with this id');
  res.json(user.toAuthJSON());
});

export default router;
