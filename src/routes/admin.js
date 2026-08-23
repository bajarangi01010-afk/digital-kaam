const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAdmin } = require('../middleware/admin');
const { isValidId } = require('../utils/validators');
const { ROOT_DIR } = require('../config');

const router = express.Router();

router.get('/admin/pending-workers', requireAdmin, (req, res) => {
  const pending = db.prepare(`
    SELECT id, name, skill, city, phone, photo_path, certificate_path, tier,
           verification_status, profile_photo_status, starting_price, created_at
    FROM workers
    WHERE profile_photo_status = 'pending'
       OR (tier = 'professional' AND verification_status = 'pending')
    ORDER BY created_at ASC
  `).all();
  res.json({ pending });
});

router.get('/admin/certificate/:workerId', requireAdmin, (req, res) => {
  if (!isValidId(req.params.workerId)) return res.status(400).end();
  const worker = db.prepare('SELECT certificate_path FROM workers WHERE id = ?').get(req.params.workerId);
  if (!worker || !worker.certificate_path) return res.status(404).end();
  const certificateFile = path.isAbsolute(worker.certificate_path)
    ? worker.certificate_path
    : path.join(ROOT_DIR, worker.certificate_path.startsWith('/') ? `public${worker.certificate_path}` : worker.certificate_path);
  if (!fs.existsSync(certificateFile)) return res.status(404).end();
  res.sendFile(certificateFile, { headers: { 'Cache-Control': 'private, no-store' } });
});

router.get('/admin/seekers', requireAdmin, (req, res) => {
  const seekers = db.prepare(`
    SELECT id, name, city, phone, current_lat, current_lng, current_accuracy,
           location_updated_at, created_at
    FROM seekers ORDER BY created_at DESC
  `).all();
  res.json({ seekers });
});

router.post('/admin/verify-worker/:workerId', requireAdmin, (req, res) => {
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Galat action' });
  if (!isValidId(req.params.workerId)) return res.status(400).json({ message: 'Galat worker id' });

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.workerId);
  if (!worker) return res.status(404).json({ message: 'Worker nahi mila' });

  if (action === 'approve') {
    db.prepare(`UPDATE workers SET profile_photo_status = 'approved', verification_status = CASE WHEN tier = 'professional' THEN 'approved' ELSE verification_status END WHERE id = ?`).run(worker.id);
  } else {
    db.prepare(`UPDATE workers SET profile_photo_status = 'rejected', verification_status = CASE WHEN tier = 'professional' THEN 'rejected' ELSE verification_status END WHERE id = ?`).run(worker.id);
  }
  res.json({ message: `Worker ${action === 'approve' ? 'approve' : 'reject'} kar diya gaya.` });
});

module.exports = router;
