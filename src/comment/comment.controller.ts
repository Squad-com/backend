import { NextFunction, Response, Router } from 'express';
import Controller from '../interfaces/controller.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middlewares/auth.middleware';
import userModel from '../user/user.model';
import logger from '../utils/logger';
import commentModel, { IComment } from './comment.model';

interface CommentParamRequest extends RequestWithUser {
  comment?: IComment;
}

class CommentController implements Controller {
  public path = '/users';
  public router = Router();
  private user = userModel;
  private comment = commentModel;
  private logger = logger.child({ meta: 'comment' });

  constructor() {
    this.initializeParams();
    this.initializeRoutes();
  }

  private initializeParams() {
    this.router.param('comment', this.getCommentParam);
  }

  private initializeRoutes() {
    this.router.post('/:comment', authMiddleware, this.createComment);
    this.router.get('/:comment', authMiddleware, this.getComment);
    this.router.delete('/:comment', authMiddleware, this.deleteComment);
  }

  private getCommentParam = (
    request: CommentParamRequest,
    response: Response,
    next: NextFunction,
    commentId: string
  ) => {
    this.comment.findById(commentId).exec((err, comment) => {
      if (err) return next(err);

      //if there is no comment with this id
      if (!comment) return response.sendStatus(404);

      request.comment = comment;
      return next();
    });
  };

  private createComment = (
    request: CommentParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    const parentComment = request.comment;
    const author = request.user.id;
    const { content } = request.body;

    if (!content)
      return response
        .status(422)
        .json({ errors: { content: "can't be blank" } });

    const newComment = new this.comment({
      parent: parentComment.id,
      content,
      author,
    });

    return newComment
      .save()
      .then((comment: IComment) =>
        parentComment!
          .addReply(comment.id)
          .then(() => response.status(201).json(newComment))
      )
      .catch(next);
  };

  private getComment = (
    request: CommentParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    request.comment
      ?.populate({ path: 'author', select: ['firstName', 'lastName', 'image'] })
      .then((result) => {
        return response.json(result);
      })
      .catch(next);
  };

  private deleteComment = (
    request: CommentParamRequest,
    response: Response,
    next: NextFunction
  ) => {
    const owner = request.comment?.author.toString();
    if (owner !== request.user.id)
      return response
        .status(403)
        .json({ error: 'You have no permission to delete this comment' });
    request.comment?.remove({}, (error, result: IComment) => {
      if (error) return next(error);

      return this.comment
        .findById(result.parent)
        .then((parent) => parent?.deleteReply(result.id))
        .catch(() => {
          this.logger.error('This comment has no parent');
        })
        .finally(() => response.sendStatus(204));
    });
  };
}

export default CommentController;
