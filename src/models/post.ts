import { Document, model, Schema } from 'mongoose';
import { IUser } from './user';

export enum Vote {
  UP = 'UP',
  DOWN = 'DOWN',
}
export interface IPost extends Document {
  author: Schema.Types.ObjectId;
  description: string;
  images: string[];
  score: number;
  toJSONfor: (user: IUser) => any;
  updateScore: (score: number) => Promise<IPost>;
}
const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  score: { type: Number, default: 0 },
  images: [String],
});

PostSchema.methods.toJSONfor = function (user: IUser) {
  const networkPost = {
    id: this._id,
    author: this.author,
    description: this.description,
    images: this.images,
    score: this.score,
    voteState: user.likedPosts.includes(this._id)
      ? Vote.UP
      : user.dislikedPosts.includes(this._id)
      ? Vote.DOWN
      : null,
  };

  return networkPost;
};

PostSchema.methods.updateScore = function (score) {
  this.score += score;
  return this.save();
};

export default model('Post', PostSchema);
