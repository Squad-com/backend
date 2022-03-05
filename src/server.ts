import 'dotenv/config';
import App from './app';
import AuthController from './auth/auth.controller';
import CommentController from './comment/comment.controller';
import PostController from './post/post.controller';
import UserController from './user/user.controller';

const app = new App([
  new UserController(),
  new PostController(),
  new CommentController(),
  new AuthController(),
]);

app.listen();
