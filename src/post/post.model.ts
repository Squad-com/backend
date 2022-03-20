import { Document, model, Schema } from 'mongoose';
import { IUser } from '../user/user.model';
import autopopulate from '../utils/autopopulate';

export enum VoteEnum {
  UP = 1,
  DOWN = -1,
}

export interface IPost extends Document {
  author: Schema.Types.ObjectId;
  description: string;
  images: String[];
  score: number;
  votes: { userId: Schema.Types.ObjectId; voteStatus: VoteEnum }[];
  comments: [Schema.Types.ObjectId];
  toNetworkJSON: (user: IUser) => any;
  votePost: (user: IUser, vote: VoteEnum) => Promise<any>;
  getVoteState: (user: IUser) => VoteEnum | null;
}

const UserVote = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  voteStatus: {
    type: String,
    enum: [VoteEnum.DOWN, VoteEnum.UP],
  },
});

// SCHEMA
const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    score: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    votes: [UserVote],
    images: [String],
  },
  { timestamps: true }
);

const commonPopulation = [
  {
    path: 'author',
    select: ['firstName', 'lastName', 'image'],
  },
];

// pre defines
PostSchema.pre('findOne', autopopulate(commonPopulation))
  .pre('find', autopopulate(commonPopulation))
  .pre('save', autopopulate(commonPopulation));

PostSchema.methods.toNetworkJSON = function (user: IUser) {
  const networkPost = {
    id: this._id,
    author: this.author,
    description: this.description,
    images: this.images,
    score: this.votes.reduce(
      (acc, cur) => acc.valueOf() + +cur.voteStatus.valueOf(),
      0
    ),
    voteState: +(
      this.votes.find(({ userId }) => userId.valueOf() === user.id)
        ?.voteStatus || 0
    ),
    comments: this.comments.length,
  };

  return networkPost;
};

PostSchema.methods.votePost = function (user: IUser, vote: VoteEnum) {
  const userIndex = this.votes.findIndex(
    ({ userId }) => userId === user.id.valueOf()
  );
  const postIndex = user.votedPosts.findIndex(
    ({ postId }) => postId === this.id
  );

  if (userIndex !== -1) {
    this.votes[userIndex].voteStatus = vote;
  } else {
    this.votes.push({ userId: user.id.valueOf(), voteStatus: vote });
  }

  if (postIndex !== -1) {
    user.votedPosts[postIndex].voteStatus = vote;
  } else {
    user.votedPosts.push({ postId: this.id, voteStatus: vote });
  }

  return this.save();
};

export default model('Post', PostSchema);
