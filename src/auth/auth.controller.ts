import { NextFunction, Request, Response, Router } from 'express';
import passport from 'passport';
import Controller from '../interfaces/controller.interface';
import userModel from '../user/user.model';

class AuthController implements Controller {
  public path = '/auth';
  public router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/login`, this.login);
    this.router.post(`/register`, this.register);
  }

  private login = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    if (!request.body.username)
      return response
        .status(422)
        .json({ errors: { username: "can't be blank" } });
    if (!request.body.password)
      return response
        .status(422)
        .json({ errors: { password: "can't be blank" } });
    passport.authenticate('local', { session: true }, (err, user, info) => {
      if (err) return next(err);
      if (user) {
        const token = user.generateJWT();
        return response.json({ token });
      } else {
        return response
          .status(422)
          .json(info || { message: 'username or password is wrong!' });
      }
    })(request, response, next);
  };

  private register = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const newUser = new this.user({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      username: request.body.username,
    });
    newUser.setPassword(request.body.password);

    newUser
      .save()
      .then(() => {
        return response.json(newUser.toAuthJSON());
      })
      .catch(next);
  };
}

export default AuthController;
