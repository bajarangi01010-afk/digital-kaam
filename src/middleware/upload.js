const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { WORKER_PHOTO_DIR, CERTIFICATE_DIR } = require('../config');

// ---------- FILE UPLOAD SETUP ----------

[WORKER_PHOTO_DIR, CERTIFICATE_DIR].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'photo') cb(null, WORKER_PHOTO_DIR);
    else if (file.fieldname === 'certificate') cb(null, CERTIFICATE_DIR);
    else cb(new Error('Galat file field'), null);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.jpg`;
    cb(null, uniqueName);
  }
});

function imageFileFilter(req, file, cb) {
  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  if (allowedExts.has(ext) && allowedMimes.has(file.mimetype)) cb(null, true);
  else cb(new Error('Sirf genuine JPG, PNG, ya WEBP image file allowed hai'));
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

// Multer errors ko handle karo (jaise file bahut badi ho, ya galat type ho)
function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError || (err.message && (err.message.includes('image file') || err.message.includes('File too large')))) {
    return res.status(400).json({ message: err.message === 'File too large' ? 'Photo/certificate 2MB se chota hona chahiye' : err.message });
  }
  next(err);
}

module.exports = { upload, multerErrorHandler };
