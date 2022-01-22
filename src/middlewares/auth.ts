import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

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

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = getToken(req);
  if (!token) return res.status(401).send('No access token found in call!');
  try {
    const decoded = jwt.verify(token, config.secret as string, {
      algorithms: ['HS256'],
    });
    //@ts-ignore
    req.user = decoded.id;
    next();
  } catch (err) {
    return res.status(400).send('Invalid token');
  }
};

export default auth;
