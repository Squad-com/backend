import { NextFunction, Response, Router } from 'express';
import Controller from '../interfaces/controller.interface';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import authMiddleware from '../middlewares/auth.middleware';

class UserController implements Controller {
  public path = '/users';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`/`, authMiddleware, this.getUserById);
  }

  private getUserById = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ) => {
    return response.json(request.user.toAuthJSON());
  };
}

export default UserController;
