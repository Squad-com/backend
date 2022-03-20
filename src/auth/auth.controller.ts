import { NextFunction, Request, Response, Router } from 'express';
import passport from 'passport';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import Controller from '../interfaces/controller.interface';
import validationMiddleware from '../middlewares/validation.middleware';
import userModel from '../user/user.model';
import { LoginDto, RegisterDto } from './auth.dto';

class AuthController implements Controller {
  public path = '/auth';
  public router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/login`, validationMiddleware(LoginDto), this.login);
    this.router.post(
      `/register`,
      validationMiddleware(RegisterDto),
      this.register
    );
  }

  private login = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    passport.authenticate('local', { session: true }, (err, user, info) => {
      if (err) return next(err);
      if (user) {
        const token = user.generateJWT();
        return response.json({ token });
      } else {
        return response.status(422).json(new WrongCredentialsException());
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
