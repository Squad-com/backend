import { Request } from 'express';
import { IUser } from '../user/user.model';

interface RequestWithUser extends Request {
  user: IUser;
}

export default RequestWithUser;
