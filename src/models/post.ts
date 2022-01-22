import { Document, model, Schema } from 'mongoose';

export interface IPost extends Document {
  owner: Schema.Types.ObjectId;
  description: string;
  images: string[];
  likes: Schema.Types.ObjectId[];
  dislikes: Schema.Types.ObjectId[];
}
const PostSchema = new Schema<IPost>({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  images: [String],
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

export default model('Post', PostSchema);
