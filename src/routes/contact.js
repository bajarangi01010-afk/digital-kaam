const express = require('express');
const db = require('../db');
const { isValidId } = require('../utils/validators');

const router = express.Router();

router.post('/track-contact/:workerId', (req, res) => {
  if (!isValidId(req.params.workerId)) return res.status(400).json({ message: 'Galat worker' });
  const result = db.prepare('UPDATE workers SET contact_count = contact_count + 1 WHERE id = ?').run(req.params.workerId);
  if (!result.changes) return res.status(404).json({ message: 'Worker nahi mila' });
  res.json({ success: true });
});

module.exports = router;
