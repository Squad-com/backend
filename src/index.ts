import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import cloudinary from 'cloudinary';
import errorhandler from 'errorhandler';
import mongoose from 'mongoose';
import morgan from 'morgan';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import dotenv from 'dotenv';
import passportConfig from './middlewares/passport';
import logger from './utils/logger';
import { transports } from 'winston';

// configs
const app = express();
dotenv.config();

// Uncaught error handling
logger.exceptions.handle(new transports.File({ filename: 'exceptions.log' }));

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

// apply global config cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(
  session({
    secret: process.env.secret as string,
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passportConfig);
app.use(errorhandler());

// Mongoose connection
const DBURL = process.env.DBURL || '';

mongoose.connect(DBURL, () => {
  logger.info('DB connection is established!');
});
mongoose.set('debug', true);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

// catch unexisting routes
app.use((req: Request, _, next) => {
  const error = new Error(`No matching route for ${req.url}`);
  // @ts-ignore
  error.status = 404;
  next(error);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  // @ts-ignore
  res.status(err.status || 500).json({ message: err.message, error: err });
});

// start app
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on PORT=${PORT}`);
});
