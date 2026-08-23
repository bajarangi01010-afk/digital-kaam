const express = require('express');
const { SKILLS } = require('../config');

const router = express.Router();

router.get('/config/skills', (req, res) => {
  res.json({ skills: SKILLS });
});

module.exports = router;
