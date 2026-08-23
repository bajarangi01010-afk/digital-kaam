const express = require('express');
const db = require('../db');
const { isValidId } = require('../utils/validators');

const router = express.Router();

// ---------- LIVE LOCATION + REVERSE GEOCODING ----------
router.post('/update-location/:workerId', (req, res) => {
  const { lat, lng, accuracy, heading, speed } = req.body;
  if (!isValidId(req.params.workerId) || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180 || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1000) {
    return res.status(400).json({ message: 'Location accuracy bahut low hai ya data galat hai' });
  }
  const result = db.prepare(`
    UPDATE workers
    SET current_lat = ?, current_lng = ?, current_accuracy = ?, current_heading = ?, current_speed = ?, location_updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(lat, lng, accuracy, Number.isFinite(heading) ? heading : null, Number.isFinite(speed) ? speed : null, req.params.workerId);
  if (!result.changes) return res.status(404).json({ message: 'Worker nahi mila' });
  res.json({ success: true, receivedAt: new Date().toISOString() });
});

router.get('/worker-location/:workerId', (req, res) => {
  if (!isValidId(req.params.workerId)) return res.status(400).json({ message: 'Galat worker id' });
  const worker = db.prepare(`SELECT current_lat, current_lng, current_accuracy, current_heading, current_speed, location_updated_at FROM workers WHERE id = ?`).get(req.params.workerId);
  if (!worker || worker.current_lat === null || worker.current_lng === null) return res.json({ available: false });
  const updatedMs = worker.location_updated_at ? new Date(worker.location_updated_at + 'Z').getTime() : 0;
  if (!updatedMs || Date.now() - updatedMs > 120000) return res.json({ available: false, stale: true, updatedAt: worker.location_updated_at });
  res.json({ available: true, lat: worker.current_lat, lng: worker.current_lng, accuracy: worker.current_accuracy, heading: worker.current_heading, speed: worker.current_speed, updatedAt: worker.location_updated_at });
});

router.get('/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  const nums = [fromLat, fromLng, toLat, toLng].map(Number);
  if (nums.some(n => !Number.isFinite(n))) return res.status(400).json({ message: 'Route coordinates missing' });
  try {
    const [fl, fn, tl, tn] = nums;
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${fn},${fl};${tn},${tl}?overview=full&geometries=geojson&steps=false`, { headers: { 'User-Agent': 'DigitalKaam/1.0' } });
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const data = await response.json();
    if (!data.routes || !data.routes[0]) return res.status(404).json({ message: 'Route nahi mili' });
    res.json({ distanceMeters: data.routes[0].distance, durationSeconds: data.routes[0].duration, geometry: data.routes[0].geometry });
  } catch (err) {
    console.error('Route error:', err.message);
    res.status(502).json({ message: 'Route service abhi available nahi hai' });
  }
});

router.get('/reverse-geocode', async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ message: 'Invalid coordinates' });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'DigitalKaam/1.0 contact: support@digitalkaam.local', 'Accept-Language': 'hi,en' } });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const data = await response.json();
    const a = data.address || {};
    res.json({ displayName: data.display_name || '', city: a.city || a.town || a.village || a.municipality || a.county || a.suburb || '', address: data.display_name || '' });
  } catch (err) {
    console.error('Geocode error:', err.message);
    res.status(502).json({ message: 'Address lookup abhi available nahi hai' });
  }
});

module.exports = router;
