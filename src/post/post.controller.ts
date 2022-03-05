import { NextFunction, Response, Router } from 'express';
import commentModel from '../comment/comment.model';
import Controller from '../interfaces/controller.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middlewares/auth.middleware';
import userModel from '../user/user.model';
import upload from '../utils/upload';
import uploadImage from '../utils/uploadImage';
import postModel, { IPost } from './post.model';

export interface PostParamRequest extends RequestWithUser {
  post: IPost;
}

class PostController implements Controller {
  public path = '/posts';
  public router = Router();
  private user = userModel;
  private comment = commentModel;
  private post = postModel;

  constructor() {
    this.initializeParams();
    this.initializeRoutes();
  }

  private initializeParams() {
    this.router.param('post', this.getPostParam);
  }

  private initializeRoutes() {
    this.router.get(`/`, authMiddleware, this.getAllPosts);
    this.router.post(
      `/`,
      authMiddleware,
      upload.single('image'),
      this.createPost
    );
    this.router.patch('/:post/like', authMiddleware, this.likePost);
    this.router.patch('/:post/dislike', authMiddleware, this.dislikePost);
  }

  private getPostParam = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction,
    postId: string
  ) => {
    // find post and populate author
    this.post
      .findById(postId)
      .populate({
        path: 'author',
        select: ['firstName', 'lastName', 'image'],
      })
      .exec((err, post) => {
        if (err) return next(err);
        // if no post then return NOT FOUND response
        if (!post) return response.sendStatus(404);

        // pass post as param
        request.post = post;

        // move to next middleware
        return next();
      });
  };

  private getAllPosts = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ) => {
    // get all posts
    this.post
      .find()
      .populate({
        path: 'author',
        select: ['firstName', 'lastName', 'image'],
      })
      .populate({ path: 'rootComment', select: 'replies' })
      .sort({ createdAt: -1 })
      .exec(function (err, posts) {
        if (err) return next(err);

        // return all posts
        response.json(posts.map((post) => post.toJSONfor(request.user)));
      });
  };

  private createPost = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ) => {
    const { description } = request.body;

    // if no description then return error
    if (!description) {
      return response
        .status(422)
        .json({ errors: { description: "can't be blank" } });
    }

    const rootComment = new this.comment({
      author: request.user.id,
      content: ' ',
    });

    return rootComment
      .save()
      .then((comment) =>
        Promise.resolve(
          request.file ? uploadImage(request.file.buffer) : null
        ).then((image) => {
          const newPost = new this.post({
            author: request.user.id,
            images: [image].filter(Boolean),
            rootComment: comment.id,
            description,
          });
          return newPost
            .save()
            .then((result) => response.status(201).json(result));
        })
      )
      .catch(next);
  };

  private likePost = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    request.user
      .likePost(request.post.id)
      .then(({ user, score }) => {
        return request.post?.updateScore(score).then((post) => {
          response.json(post.toJSONfor(user));
        });
      })
      .catch(next);
  };

  private dislikePost = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    request.user
      .dislikePost(request.post.id)
      .then(({ user, score }) => {
        return request.post?.updateScore(score).then((post) => {
          response.json(post.toJSONfor(user));
        });
      })
      .catch(next);
  };
}

export default PostController;
