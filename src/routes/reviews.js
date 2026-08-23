const express = require('express');
const db = require('../db');
const { isValidName, isValidId } = require('../utils/validators');

const router = express.Router();

const MAX_COMMENT_LENGTH = 300;

// Worker ke saare reviews (latest pehle) + rating ka summary
router.get('/worker-reviews/:workerId', (req, res) => {
  if (!isValidId(req.params.workerId)) return res.status(400).json({ message: 'Galat worker id' });
  if (!db.prepare('SELECT 1 FROM workers WHERE id = ?').get(req.params.workerId)) {
    return res.status(404).json({ message: 'Worker nahi mila' });
  }

  const reviews = db.prepare(`
    SELECT id, customer_name, rating, comment, created_at
    FROM reviews WHERE worker_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.params.workerId);

  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  res.json({ reviews, total, average: Number(average.toFixed(1)), breakdown });
});

router.post('/add-review', (req, res) => {
  const { worker_id, customer_name, rating, comment } = req.body;

  if (!isValidName(customer_name)) return res.status(400).json({ message: 'Sahi naam daalein (kam se kam 3 letters)' });
  if (!isValidId(worker_id) || !db.prepare('SELECT 1 FROM workers WHERE id = ?').get(worker_id)) {
    return res.status(404).json({ message: 'Worker nahi mila' });
  }
  const ratingNum = parseInt(rating, 10);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating 1 se 5 star ke beech honi chahiye' });
  }

  let cleanComment = null;
  if (comment !== undefined && comment !== null && String(comment).trim() !== '') {
    cleanComment = String(comment).trim();
    if (cleanComment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ message: `Review sirf ${MAX_COMMENT_LENGTH} characters tak likhein` });
    }
  }

  const insert = db.prepare('INSERT INTO reviews (worker_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)');
  insert.run(worker_id, customer_name.trim(), ratingNum, cleanComment);
  res.json({ message: 'Dhanyavaad! Aapka review add ho gaya.' });
});

module.exports = router;
