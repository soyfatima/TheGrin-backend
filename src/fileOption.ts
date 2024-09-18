import { diskStorage } from 'multer';
import { extname } from 'path';

export const folderFileOptions = {
  storage: diskStorage({
    destination: './userFile',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      const fileName = `${uniqueSuffix}${fileExtension}`;
      callback(null, fileName);
    },
  }),
};
