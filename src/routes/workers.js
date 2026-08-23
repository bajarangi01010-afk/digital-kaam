const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('../db');
const { upload } = require('../middleware/upload');
const {
  isValidName, isValidSkill, isValidCity, isValidPhone,
  isValidTier, isValidPrice
} = require('../utils/validators');

const router = express.Router();

router.get('/workers', (req, res) => {
  const city = req.query.city;
  const skill = req.query.skill;

  // Certificate path private hai; public worker list mein expose nahi karna.
  let query = `SELECT id, name, skill, city, phone, contact_count, created_at,
    photo_path, tier, verification_status, profile_photo_status, starting_price FROM workers WHERE profile_photo_status = 'approved' AND 1=1`;
  const params = [];

  if (city) {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }
  if (skill) {
    query += ' AND skill LIKE ?';
    params.push(`%${skill}%`);
  }

  const workers = db.prepare(query).all(...params);

  const workersWithRatings = workers.map(worker => {
    const reviews = db.prepare('SELECT rating FROM reviews WHERE worker_id = ?').all(worker.id);
    const avg = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    return { ...worker, averageRating: Number(avg), reviewCount: reviews.length };
  });

  // Verified professionals ko top pe dikhayein, phir rating se sort
  workersWithRatings.sort((a, b) => {
    const aVerified = a.tier === 'professional' && a.verification_status === 'approved' ? 1 : 0;
    const bVerified = b.tier === 'professional' && b.verification_status === 'approved' ? 1 : 0;
    if (aVerified !== bVerified) return bVerified - aVerified;
    return b.averageRating - a.averageRating;
  });

  res.json(workersWithRatings);
});

// Registration ab multipart/form-data hai (photo mandatory, certificate professional tier ke liye)
router.post('/register-worker', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
  const { name, skill, city, phone, tier, starting_price, lat, lng, accuracy } = req.body;
  const photoFile = req.files && req.files.photo ? req.files.photo[0] : null;
  const certificateFile = req.files && req.files.certificate ? req.files.certificate[0] : null;

  const cleanupFiles = () => {
    [photoFile, certificateFile].filter(Boolean).forEach(file => fs.unlink(file.path, () => {}));
  };

  if (!isValidName(name)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi naam daalein' }); }
  if (!isValidSkill(skill)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi skill list se chunein' }); }
  if (!isValidCity(city)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi city daalein' }); }
  if (!isValidPhone(phone)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi 10-digit phone number daalein' }); }
  if (!isValidTier(tier)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi category chunein' }); }
  if (!isValidPrice(starting_price)) { cleanupFiles(); return res.status(400).json({ message: 'Sahi starting price daalein' }); }
  if (!photoFile) { cleanupFiles(); return res.status(400).json({ message: 'Profile photo zaroori hai' }); }

  const tierClean = tier.trim().toLowerCase();
  if (tierClean === 'professional' && !certificateFile) {
    cleanupFiles();
    return res.status(400).json({ message: 'Professional category ke liye certificate/degree image zaroori hai' });
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const accNum = Number(accuracy);
  const hasLocation = Number.isFinite(latNum) && Number.isFinite(lngNum) &&
    latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  if (!hasLocation) {
    cleanupFiles();
    return res.status(400).json({ message: 'Registration se pehle accurate current location allow karein' });
  }

  try {
    // Decode the uploaded bytes, enforce real image dimensions and normalize them.
    // This blocks renamed text/HTML/random binary files even if their extension says .jpg.
    const photoMeta = await sharp(photoFile.path, { failOn: 'error' }).metadata();
    if (!photoMeta.width || !photoMeta.height || photoMeta.width < 240 || photoMeta.height < 240) {
      throw new Error('PROFILE_TOO_SMALL');
    }
    const photoStats = await sharp(photoFile.path).stats();
    const photoVariance = photoStats.channels.reduce((sum, c) => sum + (c.stdev || 0), 0);
    if (photoVariance < 12) throw new Error('PROFILE_BLANK');
    await sharp(photoFile.path, { failOn: 'error' })
      .rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true }).toFile(`${photoFile.path}.safe`);
    fs.renameSync(`${photoFile.path}.safe`, photoFile.path);

    if (certificateFile) {
      const certMeta = await sharp(certificateFile.path, { failOn: 'error' }).metadata();
      if (!certMeta.width || !certMeta.height || certMeta.width < 400 || certMeta.height < 250) {
        throw new Error('CERT_TOO_SMALL');
      }
      await sharp(certificateFile.path, { failOn: 'error' })
        .rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, mozjpeg: true }).toFile(`${certificateFile.path}.safe`);
      fs.renameSync(`${certificateFile.path}.safe`, certificateFile.path);
    }

    const photoPath = `/uploads/workers/${photoFile.filename}`;
    // Certificate stays outside /public and can only be fetched by an authenticated admin.
    const certificatePath = certificateFile ? path.resolve(certificateFile.path) : null;
    const verificationStatus = tierClean === 'professional' ? 'pending' : 'not_applicable';

    db.prepare(`
      INSERT INTO workers (
        name, skill, city, phone, photo_path, tier, certificate_path,
        verification_status, profile_photo_status, starting_price,
        current_lat, current_lng, current_accuracy, location_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      name.trim(), skill.trim(), city.trim(), phone.trim(), photoPath, tierClean,
      certificatePath, verificationStatus, Math.round(parseFloat(starting_price)),
      latNum, lngNum, Number.isFinite(accNum) ? accNum : null
    );

    res.json({
      message: 'Registration receive ho gaya. Photo aur documents admin review ke baad profile live hogi.',
      verification: 'pending'
    });
  } catch (err) {
    cleanupFiles();
    const messages = {
      PROFILE_TOO_SMALL: 'Profile photo bahut chhoti hai. Clear photo (minimum 240x240) upload karein.',
      PROFILE_BLANK: 'Profile photo blank/invalid lag rahi hai. Apni clear photo upload karein.',
      CERT_TOO_SMALL: 'Certificate image bahut chhoti hai. Original/clear certificate ki photo upload karein.'
    };
    if (messages[err.message]) return res.status(400).json({ message: messages[err.message] });
    console.error('Upload validation error:', err);
    return res.status(400).json({ message: 'Uploaded image valid/readable nahi hai. Original JPG/PNG/WEBP file use karein.' });
  }
});

module.exports = router;
