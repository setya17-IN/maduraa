import multer from 'multer';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const parseImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE + 1, files: 1, fields: 0 },
}).single('image');

const productImageUpload = (req, res, next) => {
  parseImage(req, res, (error) => {
    if (!error) {
      if (req.file?.size > MAX_IMAGE_SIZE) {
        return res.status(413).json({ status: 'error', message: 'Ukuran gambar maksimal 2 MB' });
      }
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ status: 'error', message: 'Ukuran gambar maksimal 2 MB' });
    }
    return res.status(400).json({ status: 'error', message: 'Request upload gambar tidak valid' });
  });
};

export default productImageUpload;
