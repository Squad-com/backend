import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import userModel from '../user/user.model';

const getToken = (req: any) => {
  if (
    (req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
};

const authMiddleware = (
  request: RequestWithUser,
  response: Response,
  next: NextFunction
) => {
  const token = getToken(request);
  if (!token) return next(new AuthenticationTokenMissingException());
  try {
    const decoded: any = jwt.verify(token, config.secret as string, {
      algorithms: ['HS256'],
    });
    userModel.findById(decoded.id).exec((err, user) => {
      if (err) return next(err);
      if (!user) return next(new WrongAuthenticationTokenException());
      request.user = user;
      return next();
    });
  } catch (err) {
    return next(new AuthenticationTokenMissingException());
  }
};

export default authMiddleware;
