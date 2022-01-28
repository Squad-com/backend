import { Schema, Document, model } from 'mongoose';
import crypto, { BinaryLike } from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  image: string;
  likedPosts: Schema.Types.ObjectId[];
  dislikedPosts: Schema.Types.ObjectId[];
  hash: BinaryLike;
  salt: BinaryLike;
  validPassword: (password: BinaryLike) => boolean;
  setPassword: (password: BinaryLike) => void;
  generateJWT: () => string;
  toAuthJSON: () => any;
  likePost: (postId: Schema.Types.ObjectId) => Promise<{
    user: IUser;
    score: number;
  }>;
  dislikePost: (postId: Schema.Types.ObjectId) => Promise<{
    user: IUser;
    score: number;
  }>;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'cannot be blank'],
    match: [/^[a-zA-Z]+$/, 'is invalid'],
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
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  dislikedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
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

UserSchema.methods.likePost = function (postId) {
  const dislikeIndex = this.dislikedPosts.indexOf(postId);
  const likeIndex = this.likedPosts.indexOf(postId);

  // this is the number that how much post score will change
  let score = 0;

  // if post is disliked then remove dislike
  if (dislikeIndex !== -1) {
    this.dislikedPosts.splice(dislikeIndex, 1);
    score += 1; // dislike is removed
  }

  // if post is not already liked
  if (likeIndex === -1) {
    this.likedPosts.push(postId);
    score += 1; // like is added
  }

  return new Promise((resolve, reject) => {
    this.save()
      .then((user) =>
        resolve({
          user,
          score,
        })
      )
      .catch(reject);
  });
};

UserSchema.methods.dislikePost = function (postId) {
  const dislikeIndex = this.dislikedPosts.indexOf(postId);
  const likeIndex = this.likedPosts.indexOf(postId);

  // this is the number that how much post score will change
  let score = 0;

  // if post is disliked then remove dislike
  if (likeIndex !== -1) {
    this.likedPosts.splice(likeIndex, 1);
    score -= 1; // dislike is removed
  }

  // if post is not already liked
  if (dislikeIndex === -1) {
    this.dislikedPosts.push(postId);
    score -= 1; // like is added
  }

  return new Promise((resolve, reject) => {
    this.save()
      .then((user) =>
        resolve({
          user,
          score,
        })
      )
      .catch(reject);
  });
};

export default model('User', UserSchema);
