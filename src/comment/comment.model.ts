import { Document, model, Schema } from 'mongoose';
import autopopulate from '../utils/autopopulate';

export interface IComment extends Document {
  author: Schema.Types.ObjectId;
  // post: Schema.Types.ObjectId;
  content: string;
  comments: Schema.Types.ObjectId[];
}

const CommentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: Schema.Types.String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

const commonPopulation = [
  {
    path: 'author',
    select: ['firstName', 'lastName', 'image'],
  },
  { path: 'comments' },
];

// pre defines
CommentSchema.pre('findOne', autopopulate(commonPopulation))
  .pre('find', autopopulate(commonPopulation))
  .pre('save', autopopulate(commonPopulation));

export default model('Comment', CommentSchema);
