import { NextFunction, Request, Response, Router } from 'express';
import commentModel, { IComment } from '../comment/comment.model';
import CommentNotFoundException from '../exceptions/CommentNotFoundException';
import PostNotFoundException from '../exceptions/PostNotFoundException';
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

export interface CommentParamRequest extends RequestWithUser {
  comment: IComment;
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
    this.router.param('comment', this.getCommentParam);
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
      if (!post) return next(new PostNotFoundException(postId));

      // pass post as param
      request.post = post;

      // move to next middleware
      return next();
    });
  };

  private getCommentParam = (
    request: PostParamRequest & CommentParamRequest,
    response: Response,
    next: NextFunction,
    commentId: string
  ) => {
    if (!request.post.comments.find((id) => id.toString() === commentId)) {
      next(new CommentNotFoundException(commentId));
    }
    this.comment.findById(request.post.comments).exec((error, result) => {
      if (error) return next(error);
      if (!result) return next(new PostNotFoundException(commentId));

      request.comment = result;

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
    const { post, user } = request;
    const vote = request.body.dir;
    const userIndex = post.votes.findIndex(
      ({ userId }) => userId === user.id.valueOf()
    );
    const postIndex = user.votedPosts.findIndex(
      ({ postId }) => postId === post.id
    );

    if (userIndex !== -1) {
      post.votes[userIndex].voteStatus = vote;
    } else {
      post.votes.push({ userId: user.id.valueOf(), voteStatus: vote });
    }

    if (postIndex !== -1) {
      user.votedPosts[postIndex].voteStatus = vote;
    } else {
      user.votedPosts.push({ postId: post.id, voteStatus: vote });
    }

    post
      .save()
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
