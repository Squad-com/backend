import 'dotenv/config';
import App from './app';
import AuthController from './auth/auth.controller';
import PostController from './post/post.controller';
import UserController from './user/user.controller';

const app = new App([
  new UserController(),
  new PostController(),
  new AuthController(),
]);

app.listen();
