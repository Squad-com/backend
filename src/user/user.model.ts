import crypto, { BinaryLike } from 'crypto';
import jwt from 'jsonwebtoken';
import { Document, model, Schema, Types } from 'mongoose';
import config from '../config';
import { VoteEnum } from '../post/post.model';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  image: string;
  hash: BinaryLike;
  salt: BinaryLike;
  votedPosts: { postId: string; voteStatus: number }[];
  validPassword: (password: BinaryLike) => boolean;
  setPassword: (password: BinaryLike) => void;
  generateJWT: () => string;
  toAuthJSON: () => any;
}

const VotedPostSchema = new Schema({
  postId: { type: Types.ObjectId, ref: 'Post' },
  voteStatus: {
    type: String,
    enum: [VoteEnum.DOWN, VoteEnum.UP],
  },
});

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'cannot be blank'],
    match: [/^[a-zA-Z/ /]+$/, 'is invalid'],
  },
  lastName: {
    type: String,
    required: [true, 'cannot be blank'],
    match: [/^[a-zA-Z]+$/, 'is invalid'],
  },
  username: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, 'cannot be blank'],
    match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true,
  },
  votedPosts: [VotedPostSchema],
  image: String,
  hash: String,
  salt: String,
});

UserSchema.methods.validPassword = function (password: BinaryLike) {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
    .toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function (password: BinaryLike) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
    .toString('hex');
};

UserSchema.methods.generateJWT = function () {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      id: this._id,
      exp: exp.getTime() / 1000,
    },
    config!.secret!,
    { algorithm: 'HS256' }
  );
};

UserSchema.methods.toAuthJSON = function () {
  return {
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    email: this.email,
    bio: this.bio,
    image: this.image,
  };
};

UserSchema.methods.toNetworkJSON = function () {
  return {
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    image: this.image,
  };
};

export default model('User', UserSchema);
