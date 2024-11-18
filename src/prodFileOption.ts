import { diskStorage } from 'multer';
import { extname } from 'path';

export const ProdFileOptions = {
  storage: diskStorage({
    destination: './productFile', 
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      const fileName = `${uniqueSuffix}${fileExtension}`;
      // Save the file in the 'profilePictures' folder
      callback(null, fileName);
    },
  }),
};
