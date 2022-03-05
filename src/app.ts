import bodyParser from 'body-parser';
import cloudinary from 'cloudinary';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import errorhandler from 'errorhandler';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import morgan from 'morgan';
import Controller from './interfaces/controller.interface';
import errorMiddleware from './middlewares/error.middleware';
import passportMiddleware from './middlewares/passport.middleware';
import logger from './utils/logger';

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();
    dotenv.config();
    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeConfigs();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen() {
    const { PORT = 8000 } = process.env;
    this.app.listen(PORT, () => {
      console.log(`App listening on the port ${PORT}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.use(morgan('dev'));

    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(bodyParser.json({ limit: '50mb' }));

    this.app.use(
      session({
        secret: process.env.secret as string,
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: false,
      })
    );
    this.app.use(passportMiddleware);
    this.app.use(errorhandler());
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeConfigs() {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use(controller.path, controller.router);
    });
  }

  private connectToTheDatabase() {
    const { DBURL = '' } = process.env;

    mongoose.connect(DBURL, () => {
      logger.info('DB connection is established!');
    });
    mongoose.set('debug', true);
  }
}

export default App;
