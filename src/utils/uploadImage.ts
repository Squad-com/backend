import cloudinary from 'cloudinary';
import sharp from 'sharp';
import logger from './logger';

const uploadImage = (file: Buffer): Promise<string> =>
  new Promise(async (resolve, reject) => {
    const fileWebp = await sharp(file)
      .resize({ width: 960 })
      .webp({ lossless: true, quality: 70 })
      .toBuffer()
      .catch((err) => {
        logger.error(err);
        return null;
      });

    const filePng = await sharp(file)
      .png({ quality: 70 })
      .toBuffer()
      .catch((err) => {
        logger.error(err);
        return null;
      });

    cloudinary.v2.uploader
      .upload_stream(
        {
          folder: 'post-images',
        },
        (error, result) => {
          if (error) {
            reject(result);
          }
          resolve(result?.url || '');
        }
      )
      .end(fileWebp);
  });

export default uploadImage;
