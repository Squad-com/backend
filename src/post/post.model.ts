import { Document, model, Schema } from 'mongoose';
import { IUser } from '../user/user.model';

export enum Vote {
  UP = 'UP',
  DOWN = 'DOWN',
}
export interface IPost extends Document {
  author: Schema.Types.ObjectId;
  description: string;
  images: String[];
  score: number;
  createdAt: Date;
  rootComment: Schema.Types.ObjectId;
  toJSONfor: (user: IUser) => any;
  updateScore: (score: number) => Promise<IPost>;
}

// SCHEMA
const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  score: { type: Number, default: 0 },
  createdAt: { type: Schema.Types.Date, default: new Date() },
  rootComment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
  images: [String],
});

PostSchema.methods.toJSONfor = function (user: IUser) {
  const networkPost = {
    id: this._id,
    author: this.author,
    description: this.description,
    images: this.images,
    score: this.score,
    rootComment: this.rootComment,
    voteState: user.likedPosts.includes(this._id)
      ? Vote.UP
      : user.dislikedPosts.includes(this._id)
      ? Vote.DOWN
      : null,
  };

  return networkPost;
};

PostSchema.methods.updateScore = function (score: number) {
  this.score += score;
  return this.save();
};

export default model('Post', PostSchema);
