import { Request, Router } from 'express';
import cloudinary from 'cloudinary';
import auth from '../middlewares/auth';
import upload from '../utils/upload';
import Post, { IPost } from '../models/Post';
import User from '../models/User';
import logger from '../utils/logger';
import uploadImage from '../utils/uploadImage';
import Comment from '../models/Comment';

const router = Router();

export interface PostParamRequest extends Request {
  post?: IPost;
}
router.param('post', (req: PostParamRequest, res, next, postId) => {
  // find post and populate author
  Post.findById(postId)
    .populate({ path: 'author', select: ['firstName', 'lastName', 'image'] })
    .exec((err, post) => {
      if (err) return next(err);
      // if no post then return NOT FOUND response
      if (!post) return res.sendStatus(404);

      // pass post as param
      req.post = post;

      // move to next middleware
      return next();
    });
});

router.get('/', auth, (req, res, next) => {
  User.findById(req.user).exec((err, user) => {
    if (err) return next(err);

    // if no user then return UNAUTHORIZED response
    // TODO(suley): later remove this check to let not authorized user can see posts
    if (!user) return res.sendStatus(401);

    // get all posts
    Post.find({})
      .populate({ path: 'author', select: ['firstName', 'lastName', 'image'] })
      .exec(function (err, posts) {
        if (err) return next(err);

        // return all posts
        res.json(posts.map((post) => post.toJSONfor(user)));
      });
  });
});

router.post('/', auth, upload.single('image'), async (req, res, next) => {
  const { description } = req.body;

  // if no description then return error
  if (!description) {
    return res.status(422).json({ errors: { description: "can't be blank" } });
  }

  // const rootComment = new Comment();

  let imagePath;
  if (req.file) {
    imagePath = await uploadImage(req.file.buffer).catch((error) => {
      logger.error(error);
      return null;
    });
  }

  const newPost = new Post({
    author: req.user,
    images: [imagePath].filter(Boolean),
    description,
  });

  newPost
    .save()
    .then((result) => res.status(201).json(result))
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

router.post('/:post/dislike', auth, (req: PostParamRequest, res, next) => {
  const postId = req.post?._id;

  User.findById(req.user).exec((err, user) => {
    if (err) return next(err);
    if (!user) return res.sendStatus(401);
    user
      .dislikePost(postId)
      .then(({ user, score }) => {
        return req.post?.updateScore(score).then((post) => {
          res.json(post.toJSONfor(user));
        });
      })
      .catch(next);
  });
});

export default router;
