import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/company')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-company-${Date.now()}${ext}`);
  }
})

export const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    if (mimeType) return cb(null, true);

    return cb(new Error('INVALID_FILE_TYPE:Formato de imagen no soportado (solo JPG, PNG, WEBP)'));
  }
});