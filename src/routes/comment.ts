import { Request, Router } from 'express';
import Comment, { IComment } from '../models/Comment';
import auth from '../middlewares/auth';
import logger from '../utils/logger';

const router = Router();

interface CommentParamRequest extends Request {
  comment?: IComment;
}

router.param('comment', (req: CommentParamRequest, res, next, commentId) => {
  Comment.findById(commentId).exec((err, comment) => {
    if (err) return next(err);

    //if there is no comment with this id
    if (!comment) return res.sendStatus(404);

    req.comment = comment;
    return next();
  });
});

router.post('/:comment', auth, (req: CommentParamRequest, res, next) => {
  const parentComment = req.comment;
  const author = req.user;
  const { content } = req.body;

  if (!content)
    return res.status(422).json({ errors: { content: "can't be blank" } });

  const newComment = new Comment({
    parent: parentComment?.id,
    content,
    author,
  });

  return newComment
    .save()
    .then((comment) =>
      parentComment!
        .addReply(comment.id)
        .then(() => res.status(201).json(newComment))
    )
    .catch(next);
});

router.get('/:comment', auth, (req: CommentParamRequest, res, next) => {
  return res.json(req.comment);
});

router.delete('/:comment', auth, (req: CommentParamRequest, res, next) => {
  const owner = req.comment?.author.toString();
  if (owner !== req.user)
    return res
      .status(403)
      .json({ error: 'You have no permission to delete this comment' });
  req.comment?.remove({}, (error, result: IComment) => {
    if (error) return next(error);

    return Comment.findById(result.parent)
      .then((parent) => parent?.deleteReply(result.id))
      .catch(() => {
        logger.error('This comment has no parent');
      })
      .finally(() => res.sendStatus(204));
  });
});

export default router;
