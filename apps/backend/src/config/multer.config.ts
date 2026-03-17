import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads/citizens',
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow images and PDFs
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
