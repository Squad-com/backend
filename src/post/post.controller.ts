import { NextFunction, Response, Router } from 'express';
import commentModel from '../comment/comment.model';
import Controller from '../interfaces/controller.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middlewares/auth.middleware';
import validationMiddleware from '../middlewares/validation.middleware';
import userModel from '../user/user.model';
import upload from '../utils/upload';
import uploadImage from '../utils/uploadImage';
import { CreatePostDto, VotePostDTO } from './post.dto';
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
      validationMiddleware(CreatePostDto),
      this.createPost
    );

    // Vote endpoints
    this.router.post(
      '/:post/vote',
      authMiddleware,
      validationMiddleware(VotePostDTO),
      this.votePost
    );

    // Comment endpoints
    this.router.post('/:post/comments', authMiddleware, this.addComment);
    this.router.get('/:post/comments', authMiddleware, this.getPostComments);
  }

  private getPostParam = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction,
    postId: string
  ) => {
    this.post.findById(postId).exec((err, post) => {
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
      .sort({ createdAt: -1 })
      .exec(function (err, posts) {
        if (err) return next(err);

        // return all posts
        return response.json(
          posts.map((post) => post.toNetworkJSON(request.user))
        );
      });
  };

  private createPost = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ) => {
    const image = request.file ? await uploadImage(request.file.buffer) : null;
    return new this.post({
      author: request.user.id,
      images: [image].filter(Boolean),
      description: request.body.description,
    })
      .save()
      .then((result) => response.json(result))
      .catch(next);
  };

  private votePost = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    request.post
      .votePost(request.user, request.body.dir)
      .then(() => response.sendStatus(200))
      .catch(next);
  };

  private addComment = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    new this.comment({ content: request.body.comment, author: request.user.id })
      .save()
      .then(async (result) => {
        request.post.comments.unshift(result.id);
        await request.post.save();
        response.json(result);
      })
      .catch(next);
  };

  private getPostComments = (
    request: PostParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    this.comment
      .find({ _id: { $in: request.post.comments } })
      .then((data) => response.json(data))
      .catch(next);
  };
}

export default PostController;
