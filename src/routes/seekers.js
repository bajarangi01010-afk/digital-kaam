const express = require('express');
const db = require('../db');
const { isValidName, isValidCity, isValidPhone } = require('../utils/validators');

const router = express.Router();

router.post('/register-seeker', (req, res) => {
  const { name, city, phone, lat, lng, accuracy } = req.body;
  if (!isValidName(name)) return res.status(400).json({ message: 'Sahi naam daalein' });
  if (!isValidCity(city)) return res.status(400).json({ message: 'Sahi city daalein' });
  if (!isValidPhone(phone)) return res.status(400).json({ message: 'Sahi 10-digit phone number daalein' });

  const latNum = Number(lat), lngNum = Number(lng), accNum = Number(accuracy);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({ message: 'Customer ki current location nahi mili. Location permission allow karein.' });
  }

  db.prepare(`
    INSERT INTO seekers (name, city, phone, current_lat, current_lng, current_accuracy, location_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(name.trim(), city.trim(), phone.trim(), latNum, lngNum, Number.isFinite(accNum) ? accNum : null);
  res.json({ message: 'Customer registration successful! Aapki location bhi save ho gayi hai.' });
});

module.exports = router;
