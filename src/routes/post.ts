import { Router } from 'express';
import auth from '../middlewares/auth';
import Post from '../models/post';

const router = Router();

router.get('/', auth, (req, res, next) => {
  Post.find({}, function (err, posts) {
    if (err) return next(err);
    res.json(posts);
  });
});

router.post('/', auth, async (req, res, next) => {
  const { description } = req.body;
  console.log(description);
  if (!description) {
    return res.status(422).json({ errors: { description: "can't be blank" } });
  }

  const newPost = new Post({
    owner: req.user,
    description,
  });

  newPost
    .save()
    .then(() => res.status(201).send())
    .catch(next);
});

export default router;
