import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      cb(new Error('File type is not supported'));
      return;
    }
    cb(null, true);
  },
});

export default upload;
