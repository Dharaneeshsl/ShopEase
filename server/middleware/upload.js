const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME || '';
  return Boolean(name && !name.includes('your_cloudinary') && process.env.CLOUDINARY_API_KEY);
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadToCloud = async (filePath, folder = 'shopease/products') => {
  if (!isCloudinaryConfigured()) {
    return {
      public_id: path.basename(filePath),
      url: `/uploads/${path.basename(filePath)}`,
    };
  }

  const result = await cloudinary.uploader.upload(filePath, { folder });
  fs.unlink(filePath, () => {});
  return { public_id: result.public_id, url: result.secure_url };
};

module.exports = { upload, uploadToCloud, isCloudinaryConfigured };
