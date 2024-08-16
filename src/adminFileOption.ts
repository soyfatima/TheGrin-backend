import { diskStorage } from 'multer';
import { extname } from 'path';

export const adminFileOptions = {
  storage: diskStorage({
    destination: './adminFile', // Destination folder for storing uploaded files
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      const fileName = `${uniqueSuffix}${fileExtension}`;
      callback(null, fileName);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Optional: restrict file types
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type'), false);
    }
  },
};
