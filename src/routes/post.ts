import { Request, Router } from 'express';
import auth from '../middlewares/auth';
import Post, { IPost, Vote } from '../models/post';
import User from '../models/user';

const router = Router();

export interface PostParamRequest extends Request {
  post?: IPost;
}
router.param('post', (req: PostParamRequest, res, next, postId) => {
  Post.findById(postId)
    .populate({ path: 'author', select: ['firstName', 'lastName', 'image'] })
    .exec((err, post) => {
      if (err) return next(err);
      if (!post) return res.sendStatus(404);

      req.post = post;

      return next();
    });
});

router.get('/', auth, (req, res, next) => {
  User.findById(req.user).exec((err, user) => {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    Post.find({})
      .populate({ path: 'author', select: ['firstName', 'lastName', 'image'] })
      .exec(function (err, posts) {
        if (err) return next(err);
        res.json(posts.map((post) => post.toJSONfor(user)));
      });
  });
});

router.post('/', auth, async (req, res, next) => {
  const { description } = req.body;
  console.log(description);
  if (!description) {
    return res.status(422).json({ errors: { description: "can't be blank" } });
  }

  const newPost = new Post({
    author: req.user,
    description,
  });

  newPost
    .save()
    .then(() => res.status(201).send())
    .catch(next);
});

router.post('/:post/like', auth, (req: PostParamRequest, res, next) => {
  const postId = req.post?._id;
  User.findById(req.user).exec((err, user) => {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    user
      .likePost(postId)
      .then(({ user, score }) => {
        return req.post?.updateScore(score).then((post) => {
          res.json(post.toJSONfor(user));
        });
      })
      .catch(next);
  });
});

export default router;
