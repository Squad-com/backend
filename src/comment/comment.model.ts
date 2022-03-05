import { Document, model, Schema } from 'mongoose';

export interface IComment extends Document {
  author: Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parent: Schema.Types.ObjectId;
  replies: Schema.Types.ObjectId[];
  addReply: (comment: Schema.Types.ObjectId) => Promise<any>;
  deleteReply: (comment: Schema.Types.ObjectId) => Promise<any>;
}

const CommentSchema = new Schema<IComment>({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: Schema.Types.String, required: true },
  createdAt: { type: Schema.Types.Date, default: new Date() },
  updatedAt: { type: Schema.Types.Date, default: new Date() },
  parent: { type: Schema.Types.ObjectId, ref: 'Comment' },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
});

CommentSchema.methods.addReply = function (comment) {
  this.replies.push(comment);
  return this.save();
};

CommentSchema.methods.deleteReply = function (comment) {
  const index = this.replies.indexOf(comment);

  if (index >= 0) {
    this.replies.splice(index, 1);
  }

  return this.save();
};

export default model('Comment', CommentSchema);
