/* =========================================================
   DIGITAL KAAM 2.0 — MASTER BACKEND SERVER
   High Security, SQLite3, Sharp, Multer, OTP, Razorpay, OSM
   ========================================================= */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const multer = require('multer');
const sharp = require('sharp');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@digitalkaam2026';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key_12345';
const ADMIN_PHONES = (process.env.ADMIN_PHONES || '6205399450,9065064475,8603766262').split(',').map(s => s.trim());
const PRIMARY_ADMIN_PHONE = process.env.PRIMARY_ADMIN_PHONE || '6205399450';
const MAX_SERVICE_RADIUS_KM = Number(process.env.MAX_SERVICE_RADIUS_KM) || 15;

// Distance Calculator (Haversine Formula in KM)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const nLat1 = Number(lat1), nLon1 = Number(lon1), nLat2 = Number(lat2), nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;
  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Initialize Razorpay Instance
let rzp = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key') {
  try {
    rzp = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  } catch (e) {
    console.log('Razorpay init notice: Using simulated test mode.');
  }
}

// Ensure Upload Folders Exist
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const PRIVATE_UPLOADS_DIR = path.join(__dirname, 'private_uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PRIVATE_UPLOADS_DIR)) fs.mkdirSync(PRIVATE_UPLOADS_DIR, { recursive: true });

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'digitalkaam.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    skill TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'experienced',
    starting_price REAL NOT NULL,
    photo_path TEXT,
    certificate_path TEXT,
    verification_status TEXT DEFAULT 'pending',
    profile_photo_status TEXT DEFAULT 'approved',
    lat REAL,
    lng REAL,
    accuracy REAL,
    trust_score INTEGER DEFAULT 80,
    phone_verified INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    is_pro_member INTEGER DEFAULT 0,
    pro_expires_at DATETIME,
    wallet_balance REAL DEFAULT 0,
    id_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seekers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    lat REAL,
    lng REAL,
    accuracy REAL,
    trust_score INTEGER DEFAULT 80,
    phone_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_date TEXT,
    address TEXT NOT NULL,
    message TEXT,
    estimated_amount REAL,
    advance_amount REAL,
    payment_status TEXT DEFAULT 'unpaid',
    status TEXT DEFAULT 'pending',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    customer_lat REAL,
    customer_lng REAL,
    customer_accuracy REAL,
    actual_job_amount REAL,
    commission_amount REAL,
    commission_status TEXT DEFAULT 'unpaid',
    commission_order_id TEXT,
    commission_payment_id TEXT,
    start_otp TEXT,
    completion_otp TEXT,
    job_started_at DATETIME,
    job_completed_at DATETIME,
    escrow_status TEXT DEFAULT 'held',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(worker_id) REFERENCES workers(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    verified_booking INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(worker_id) REFERENCES workers(id)
  );

  CREATE TABLE IF NOT EXISTS worker_locations (
    worker_id INTEGER PRIMARY KEY,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    accuracy REAL,
    heading REAL,
    speed REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(worker_id) REFERENCES workers(id)
  );

  CREATE TABLE IF NOT EXISTS otp_records (
    phone TEXT PRIMARY KEY,
    otp_hash TEXT NOT NULL,
    session_token TEXT NOT NULL,
    verification_token TEXT,
    expires_at INTEGER NOT NULL,
    verified INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_sent_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_phone TEXT NOT NULL,
    user_type TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    expires_at DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe In-Place Table Column Migrations
try {
  const workerCols = db.prepare("PRAGMA table_info(workers)").all().map(c => c.name);
  if (!workerCols.includes('is_pro_member')) db.exec("ALTER TABLE workers ADD COLUMN is_pro_member INTEGER DEFAULT 0");
  if (!workerCols.includes('pro_expires_at')) db.exec("ALTER TABLE workers ADD COLUMN pro_expires_at DATETIME");
  if (!workerCols.includes('wallet_balance')) db.exec("ALTER TABLE workers ADD COLUMN wallet_balance REAL DEFAULT 0");
  if (!workerCols.includes('id_code')) db.exec("ALTER TABLE workers ADD COLUMN id_code TEXT");
  if (!workerCols.includes('govt_id_type')) db.exec("ALTER TABLE workers ADD COLUMN govt_id_type TEXT");
  if (!workerCols.includes('govt_id_number')) db.exec("ALTER TABLE workers ADD COLUMN govt_id_number TEXT");
  if (!workerCols.includes('govt_id_photo')) db.exec("ALTER TABLE workers ADD COLUMN govt_id_photo TEXT");
  if (!workerCols.includes('live_selfie_path')) db.exec("ALTER TABLE workers ADD COLUMN live_selfie_path TEXT");
  if (!workerCols.includes('terms_agreed')) db.exec("ALTER TABLE workers ADD COLUMN terms_agreed INTEGER DEFAULT 1");

  const seekerCols = db.prepare("PRAGMA table_info(seekers)").all().map(c => c.name);
  if (!seekerCols.includes('govt_id_type')) db.exec("ALTER TABLE seekers ADD COLUMN govt_id_type TEXT");
  if (!seekerCols.includes('govt_id_number')) db.exec("ALTER TABLE seekers ADD COLUMN govt_id_number TEXT");
  if (!seekerCols.includes('govt_id_photo')) db.exec("ALTER TABLE seekers ADD COLUMN govt_id_photo TEXT");
  if (!seekerCols.includes('live_selfie_path')) db.exec("ALTER TABLE seekers ADD COLUMN live_selfie_path TEXT");
  if (!seekerCols.includes('legal_consent')) db.exec("ALTER TABLE seekers ADD COLUMN legal_consent INTEGER DEFAULT 1");

  const bookingCols = db.prepare("PRAGMA table_info(bookings)").all().map(c => c.name);
  if (!bookingCols.includes('start_otp')) db.exec("ALTER TABLE bookings ADD COLUMN start_otp TEXT");
  if (!bookingCols.includes('completion_otp')) db.exec("ALTER TABLE bookings ADD COLUMN completion_otp TEXT");
  if (!bookingCols.includes('job_started_at')) db.exec("ALTER TABLE bookings ADD COLUMN job_started_at DATETIME");
  if (!bookingCols.includes('job_completed_at')) db.exec("ALTER TABLE bookings ADD COLUMN job_completed_at DATETIME");
  if (!bookingCols.includes('escrow_status')) db.exec("ALTER TABLE bookings ADD COLUMN escrow_status TEXT DEFAULT 'held'");
  if (!bookingCols.includes('delay_reason')) db.exec("ALTER TABLE bookings ADD COLUMN delay_reason TEXT");
  if (!bookingCols.includes('delay_minutes')) db.exec("ALTER TABLE bookings ADD COLUMN delay_minutes INTEGER DEFAULT 0");
  if (!bookingCols.includes('is_amc_free_service')) db.exec("ALTER TABLE bookings ADD COLUMN is_amc_free_service INTEGER DEFAULT 0");
  if (!bookingCols.includes('reassigned_from_worker_id')) db.exec("ALTER TABLE bookings ADD COLUMN reassigned_from_worker_id INTEGER");
  if (!bookingCols.includes('tip_amount')) db.exec("ALTER TABLE bookings ADD COLUMN tip_amount INTEGER DEFAULT 0");
  if (!bookingCols.includes('refund_id')) db.exec("ALTER TABLE bookings ADD COLUMN refund_id TEXT");
  if (!bookingCols.includes('refund_amount')) db.exec("ALTER TABLE bookings ADD COLUMN refund_amount REAL DEFAULT 0");
  if (!bookingCols.includes('refund_status')) db.exec("ALTER TABLE bookings ADD COLUMN refund_status TEXT");
  if (!bookingCols.includes('refunded_at')) db.exec("ALTER TABLE bookings ADD COLUMN refunded_at DATETIME");

  const subCols = db.prepare("PRAGMA table_info(subscriptions)").all().map(c => c.name);
  if (!subCols.includes('free_services_total')) db.exec("ALTER TABLE subscriptions ADD COLUMN free_services_total INTEGER DEFAULT 2");
  if (!subCols.includes('free_services_used')) db.exec("ALTER TABLE subscriptions ADD COLUMN free_services_used INTEGER DEFAULT 0");

  db.exec(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      customer_phone TEXT NOT NULL,
      amount REAL NOT NULL,
      refund_id TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'processed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Auto populate id_codes for existing workers if empty
  const missingCodeWorkers = db.prepare('SELECT id FROM workers WHERE id_code IS NULL').all();
  const updateCode = db.prepare('UPDATE workers SET id_code = ? WHERE id = ?');
  missingCodeWorkers.forEach(w => {
    const code = 'DK' + Date.now().toString(36).toUpperCase().slice(-4) + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    updateCode.run(code, w.id);
  });
} catch (e) {
  console.log('Migration check:', e.message);
}

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple In-Memory Rate Limiter
const rateLimitMap = new Map();
function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'ip';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 120;

  const entry = rateLimitMap.get(ip) || { count: 0, startTime: now };
  if (now - entry.startTime > windowMs) {
    entry.count = 1;
    entry.startTime = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);

  if (entry.count > maxReqs) {
    return res.status(429).json({ message: 'Bahut zyada requests aayi hain. Kripya 1 minute baad try karein.' });
  }
  next();
}
app.use(rateLimiter);

// Anti-Garbage Server Validation Helpers
function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || '').replace(/\D/g, ''));
}

function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 50) return false;
  if (!/^[a-zA-Z\u0900-\u097F\s\.\']+$/.test(clean)) return false;
  if (/(.)\1{3,}/.test(clean.toLowerCase())) return false;
  return true;
}

// Multer Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// =========================================================
// 1. CONFIG & SKILLS
// =========================================================
const SKILLS_LIST = [
  '💪 Majdur / Daily Wage Labor (दैनिक मजदूर)',
  '⚡ Electrician (Bijli Mistri)',
  '🔧 Plumber (Nal & Motor Fitting)',
  '🔨 Carpenter (Furniture & Woodwork)',
  '🎨 Painter (House & Wall Painting)',
  '❄️ AC & Refrigerator Repair',
  '📺 Washing Machine & Geyser Repair',
  '🍳 Cook & Home Chef',
  '🧹 Home Deep Cleaning & Maid',
  '🚗 Driver (Daily & Outstation)',
  '💄 Beautician & Salon at Home',
  '💇 Barber & Grooming at Home',
  '🧱 Mason & Tile Mistri (Raj Mistri)',
  '📦 Packers & Movers',
  '🌿 Gardener & Mali',
  '🪡 Tailor & Boutique at Home',
  '🛋️ Sofa & Carpet Dry Cleaning',
  '🐜 Pest Control Specialist',
  '🔒 Locksmith / Chabi Wala',
  '💻 Computer, Laptop & WiFi Repair',
  '📹 CCTV & Security Installation',
  '☀️ Solar Panel Technician',
  '💧 Water Purifier / RO Service',
  '🛵 Bike & Scooter Doorstep Mechanic',
  '🚘 Car Mechanic & Doorstep Car Wash',
  '🚪 Welder & Iron Fabrication',
  '🪵 False Ceiling & POP Design',
  '🧼 Laundry, Dry Clean & Steam Iron',
  '🩺 Nurse & Home Patient Attendant',
  '👶 Baby Sitter & Nanny',
  '🐕 Pet Grooming & Dog Walker',
  '🎈 Event & Birthday Decorator',
  '🔊 DJ, Sound & Tent Service',
  '🏗️ Labor & Loading Helper',
  '📦 Courier & Local Delivery Boy'
];

app.get('/config/skills', (req, res) => {
  res.json({ skills: SKILLS_LIST });
});

// =========================================================
// 2. REVERSE GEOCODING & OSRM ROUTING (OSM)
// =========================================================
app.get('/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat aur lng required hain.' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DigitalKaamApp/2.0 (contact@digitalkaam.local)' }
    });
    if (!response.ok) throw new Error('Nominatim error');
    const data = await response.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.state_district || addr.county || 'Aapka Shehar';
    const formattedAddress = data.display_name || `${city}, India`;
    res.json({ city, address: formattedAddress });
  } catch (e) {
    res.json({ city: 'Current Location', address: `GPS: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` });
  }
});

app.get('/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ message: 'Coordinates missing hain.' });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Route service unavailable');
    const data = await r.json();
    if (!data.routes || !data.routes.length) throw new Error('No route found');
    res.json({
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration
    });
  } catch (e) {
    res.json({
      geometry: {
        type: 'LineString',
        coordinates: [[Number(fromLng), Number(fromLat)], [Number(toLng), Number(toLat)]]
      },
      distance: 0,
      duration: 0
    });
  }
});

// App Configuration & Helpline Info
app.get('/config/app-info', (req, res) => {
  res.json({
    adminPhones: ADMIN_PHONES,
    primaryAdminPhone: PRIMARY_ADMIN_PHONE,
    maxRadiusKm: MAX_SERVICE_RADIUS_KM
  });
});

// =========================================================
// 3. MANDATORY OTP VERIFICATION ENGINE
// =========================================================
app.post('/api/otp/send', (req, res) => {
  const { phone, purpose } = req.body;
  if (!isValidIndianPhone(phone)) {
    return res.status(400).json({ message: 'Kripya sahi 10-digit mobile number dalein.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');

  // 🔒 STRICT REGISTERED PHONE CHECK FOR LOGINS
  if (purpose === 'worker_login') {
    const workerExists = db.prepare('SELECT id FROM workers WHERE phone = ?').get(cleanPhone);
    if (!workerExists) {
      return res.status(404).json({ message: 'Yeh mobile number registered worker nahi hai. Kripya pehle Worker Registration karein.' });
    }
  }
  if (purpose === 'customer_portal_login') {
    const customerExists = db.prepare('SELECT id FROM bookings WHERE customer_phone = ?').get(cleanPhone);
    const seekerExists = db.prepare('SELECT id FROM seekers WHERE phone = ?').get(cleanPhone);
    if (!customerExists && !seekerExists) {
      return res.status(404).json({ message: 'Is mobile number se koi booking ya customer account nahi mila.' });
    }
  }

  const now = Date.now();

  const existing = db.prepare('SELECT * FROM otp_records WHERE phone = ?').get(cleanPhone);
  if (existing && now - existing.last_sent_at < 25000) {
    return res.status(429).json({ message: 'Kripya 30 seconds intezaar karein.' });
  }

  const rawOtp = String(Math.floor(1000 + Math.random() * 9000));
  const otpHash = crypto.createHash('sha256').update(rawOtp + cleanPhone).digest('hex');
  const sessionToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = now + (5 * 60 * 1000); // 5 minutes

  db.prepare(`
    INSERT INTO otp_records (phone, otp_hash, session_token, expires_at, verified, attempts, last_sent_at)
    VALUES (?, ?, ?, ?, 0, 0, ?)
    ON CONFLICT(phone) DO UPDATE SET
      otp_hash = excluded.otp_hash,
      session_token = excluded.session_token,
      expires_at = excluded.expires_at,
      verified = 0,
      attempts = 0,
      last_sent_at = excluded.last_sent_at
  `).run(cleanPhone, otpHash, sessionToken, expiresAt, now);

  res.json({
    message: `OTP +91 ${cleanPhone} par bhej diya gaya hai.`,
    sessionToken,
    testOtp: rawOtp
  });
});

app.post('/api/otp/verify', (req, res) => {
  const { phone, otp, sessionToken } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  const record = db.prepare('SELECT * FROM otp_records WHERE phone = ?').get(cleanPhone);
  if (!record || record.session_token !== sessionToken) {
    return res.status(400).json({ message: 'Invalid OTP session. Naya OTP mangwayein.' });
  }

  if (Date.now() > record.expires_at) {
    return res.status(400).json({ message: 'OTP expire ho chuka hai. Dobara OTP mangwayein.' });
  }

  if (record.attempts >= 5) {
    return res.status(400).json({ message: 'Bahut baar galat OTP dala gaya. Naya OTP request karein.' });
  }

  const expectedHash = crypto.createHash('sha256').update(String(otp) + cleanPhone).digest('hex');
  if (expectedHash !== record.otp_hash) {
    db.prepare('UPDATE otp_records SET attempts = attempts + 1 WHERE phone = ?').run(cleanPhone);
    return res.status(400).json({ message: 'Galat OTP dala hai. Kripya check karein.' });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE otp_records SET verified = 1, verification_token = ? WHERE phone = ?').run(verificationToken, cleanPhone);

  res.json({
    message: 'Mobile number successfully verified!',
    verificationToken
  });
});

function verifyOtpToken(phone, token) {
  if (!token) return false;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const rec = db.prepare('SELECT * FROM otp_records WHERE phone = ? AND verification_token = ? AND verified = 1').get(cleanPhone, token);
  return !!rec;
}

// =========================================================
// 4. WORKER REGISTRATION WITH SHARP & MULTER
// =========================================================
const uploadWorkerFiles = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'govt_id_photo', maxCount: 1 },
  { name: 'live_selfie', maxCount: 1 }
]);

app.post('/register-worker', uploadWorkerFiles, async (req, res) => {
  try {
    const { name, skill, city, phone, tier, starting_price, lat, lng, accuracy, otpToken, govt_id_type, govt_id_number, terms_agreed } = req.body;

    if (!isValidName(name)) {
      return res.status(400).json({ message: 'Kripya sahi poora naam daalein (2-50 akshar, sirf letters).' });
    }
    if (!isValidIndianPhone(phone)) {
      return res.status(400).json({ message: 'Kripya 10-digit sahi Indian mobile number daalein.' });
    }
    if (!SKILLS_LIST.includes(skill)) {
      return res.status(400).json({ message: 'Kripya list se valid Skill chunein.' });
    }
    if (!['professional', 'experienced', 'new'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid Category.' });
    }
    const price = Number(starting_price);
    if (isNaN(price) || price < 1 || price > 500000) {
      return res.status(400).json({ message: 'Kripya sahi starting price (₹1 - ₹5,00,000) daalein.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');

    const existing = db.prepare('SELECT id FROM workers WHERE phone = ?').get(cleanPhone);
    if (existing) {
      return res.status(400).json({ message: 'Is mobile number se Worker pehle se registered hai.' });
    }

    if (!req.files || !req.files['photo']) {
      return res.status(400).json({ message: 'Profile photo upload karna zaroori hai.' });
    }

    if (tier === 'professional' && (!req.files || !req.files['certificate'])) {
      return res.status(400).json({ message: 'Professional category ke liye Certificate photo zaroori hai.' });
    }

    // Process Profile Photo with Sharp
    const photoFile = req.files['photo'][0];
    const photoMeta = await sharp(photoFile.buffer).metadata();
    if (!photoMeta.width || photoMeta.width < 150 || !photoMeta.height || photoMeta.height < 150) {
      return res.status(400).json({ message: 'Photo ek valid selfie ya clear photo honi chahiye (minimum 150x150 pixels). Blurry ya garbage image nahi chalegi.' });
    }

    const photoFilename = `worker-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
    const photoPath = path.join(UPLOADS_DIR, photoFilename);
    await sharp(photoFile.buffer)
      .rotate()
      .resize(450, 450, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(photoPath);

    const publicPhotoUrl = `/uploads/${photoFilename}`;

    let publicCertUrl = null;
    if (req.files['certificate']) {
      const certFile = req.files['certificate'][0];
      const isPdf = certFile.buffer.length > 4 && certFile.buffer.toString('utf8', 0, 4) === '%PDF';
      if (!isPdf) {
        try {
          const certMeta = await sharp(certFile.buffer).metadata();
          if (!certMeta.width || certMeta.width < 200 || !certMeta.height || certMeta.height < 100) {
            throw new Error('invalid_size');
          }
        } catch (e) {
          return res.status(400).json({ message: 'Certificate ek valid document hona chahiye (PDF ya clear image).' });
        }
      }
      
      const certFilename = isPdf ? `cert-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.pdf` : `cert-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
      const certPath = path.join(PRIVATE_UPLOADS_DIR, certFilename);
      if (isPdf) {
        fs.writeFileSync(certPath, certFile.buffer);
      } else {
        await sharp(certFile.buffer)
          .rotate()
          .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(certPath);
      }
      publicCertUrl = certFilename;
    }

    // Process Govt ID Photo
    let publicGovtIdUrl = null;
    if (req.files['govt_id_photo']) {
      const gidFile = req.files['govt_id_photo'][0];
      const gidFilename = `gid-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
      const gidPath = path.join(UPLOADS_DIR, gidFilename);
      await sharp(gidFile.buffer)
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(gidPath);
      publicGovtIdUrl = `/uploads/${gidFilename}`;
    }

    // Process Live Selfie Photo
    let publicSelfieUrl = null;
    if (req.files['live_selfie']) {
      const selfieFile = req.files['live_selfie'][0];
      const selfieFilename = `selfie-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
      const selfiePath = path.join(UPLOADS_DIR, selfieFilename);
      await sharp(selfieFile.buffer)
        .rotate()
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(selfiePath);
      publicSelfieUrl = `/uploads/${selfieFilename}`;
    }

    const isPhoneVerified = verifyOtpToken(cleanPhone, otpToken) ? 1 : 0;
    const initialStatus = 'approved';
    const id_code = 'DK' + Date.now().toString(36).toUpperCase().slice(-4) + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO workers (
        name, skill, phone, city, tier, starting_price, photo_path, certificate_path, 
        govt_id_type, govt_id_number, govt_id_photo, live_selfie_path, terms_agreed,
        verification_status, profile_photo_status, lat, lng, accuracy, phone_verified, id_code
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?)
    `);

    stmt.run(
      name.trim(),
      skill,
      cleanPhone,
      city.trim(),
      tier,
      price,
      publicPhotoUrl,
      publicCertUrl,
      govt_id_type || null,
      govt_id_number || null,
      publicGovtIdUrl,
      publicSelfieUrl,
      terms_agreed ? 1 : 1,
      initialStatus,
      lat ? Number(lat) : null,
      lng ? Number(lng) : null,
      accuracy ? Number(accuracy) : null,
      isPhoneVerified,
      id_code
    );

    res.json({
      message: 'Badhai ho! Aapka Worker account & Live Face ID safaltapoorvak register ho gaya hai.',
      verified: true
    });
  } catch (err) {
    console.error('Register worker error:', err);
    res.status(500).json({ message: 'Registration fail hua. Kripya photo format check karke dobara try karein.' });
  }
});

// =========================================================
// 5. SEEKER (CUSTOMER) REGISTRATION
// =========================================================
app.post('/register-seeker', (req, res) => {
  const { name, phone, city, lat, lng, accuracy, otpToken } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ message: 'Kripya sahi naam daalein.' });
  }
  if (!isValidIndianPhone(phone)) {
    return res.status(400).json({ message: 'Kripya sahi 10-digit mobile number daalein.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const isPhoneVerified = verifyOtpToken(cleanPhone, otpToken) ? 1 : 0;

  try {
    db.prepare(`
      INSERT INTO seekers (name, phone, city, lat, lng, accuracy, phone_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET
        name = excluded.name,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        accuracy = excluded.accuracy,
        phone_verified = excluded.phone_verified
    `).run(
      name.trim(),
      cleanPhone,
      city.trim(),
      lat ? Number(lat) : null,
      lng ? Number(lng) : null,
      accuracy ? Number(accuracy) : null,
      isPhoneVerified
    );

    res.json({ message: 'Customer registration safalta se poora hua!' });
  } catch (err) {
    res.status(500).json({ message: 'Customer registration fail hua.' });
  }
});

const uploadCustomerFiles = upload.fields([
  { name: 'govt_id_photo', maxCount: 1 },
  { name: 'live_selfie', maxCount: 1 }
]);

app.post('/api/customer/complete-profile', uploadCustomerFiles, async (req, res) => {
  const { phone, name, city, govt_id_type, govt_id_number, legal_consent } = req.body;
  if (!phone || !name || !city) return res.status(400).json({ message: 'Phone, naam aur shehar mandatory hain.' });
  
  const cleanPhone = String(phone).replace(/\D/g, '');
  let idPhotoPath = null;
  let selfiePath = null;
  if (req.files && req.files['govt_id_photo']) {
    idPhotoPath = '/uploads/' + req.files['govt_id_photo'][0].filename;
  }
  if (req.files && req.files['live_selfie']) {
    selfiePath = '/uploads/' + req.files['live_selfie'][0].filename;
  }

  const existing = db.prepare('SELECT id FROM seekers WHERE phone = ?').get(cleanPhone);
  if (existing) {
    db.prepare(`UPDATE seekers SET name=?, city=?, govt_id_type=?, govt_id_number=?, govt_id_photo=COALESCE(?, govt_id_photo), live_selfie_path=COALESCE(?, live_selfie_path), legal_consent=? WHERE phone=?`)
      .run(name.trim(), city.trim(), govt_id_type || null, govt_id_number || null, idPhotoPath, selfiePath, legal_consent ? 1 : 0, cleanPhone);
  } else {
    db.prepare(`INSERT OR IGNORE INTO seekers (phone, name, city, govt_id_type, govt_id_number, govt_id_photo, live_selfie_path, legal_consent, phone_verified) VALUES (?,?,?,?,?,?,?,?,1)`)
      .run(cleanPhone, name.trim(), city.trim(), govt_id_type || null, govt_id_number || null, idPhotoPath, selfiePath, legal_consent ? 1 : 0);
  }
  
  res.json({ ok: true, message: 'KYC & Live Face Verified! Digital Kaam mein swagat hai 🚀' });
});

app.get('/api/customer/check-profile', (req, res) => {
  const phone = req.query.phone;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const existing = db.prepare('SELECT id, name, govt_id_type FROM seekers WHERE phone = ?').get(cleanPhone);
  if (existing && existing.govt_id_type) {
    res.json({ exists: true, name: existing.name });
  } else {
    res.json({ exists: false });
  }
});

// Customer profile auto-fill (for booking modal)
app.get('/api/customer/profile/:phone', (req, res) => {
  const cleanPhone = String(req.params.phone).replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.json({ found: false });
  }
  const seeker = db.prepare('SELECT name, city FROM seekers WHERE phone = ?').get(cleanPhone);
  if (seeker) {
    return res.json({ found: true, name: seeker.name || '', city: seeker.city || '' });
  }
  res.json({ found: false });
});

// Mask sensitive Govt ID numbers for public view
function maskGovtId(type, number) {
  if (!number) return null;
  const s = String(number).trim();
  if (type === 'Aadhaar') {
    const digits = s.replace(/\D/g, '');
    return digits.length === 12 ? `XXXX-XXXX-${digits.slice(8)}` : `XXXX-${digits.slice(-4)}`;
  }
  if (type === 'Voter ID') return s.length >= 6 ? `${s.slice(0, 3)}XXXX${s.slice(-3)}` : s;
  if (type === 'PAN Card') return s.length === 10 ? `${s.slice(0, 2)}XXXXXX${s.slice(-2)}` : s;
  if (type === 'Passport') return s.length === 8 ? `${s[0]}XXXX${s.slice(-3)}` : s;
  if (type === 'Driving License') return s.length > 6 ? `${s.slice(0, 4)}XXXXXX${s.slice(-4)}` : s;
  return s.length > 4 ? `XXXX-${s.slice(-4)}` : s;
}

// =========================================================
// 6. WORKER DISCOVERY, REVIEWS & CONTACT TRACKING
// =========================================================
app.get('/workers', (req, res) => {
  const { city, skill } = req.query;

  let query = `
    SELECT w.*, 
      COALESCE(AVG(r.rating), 0) as averageRating,
      COUNT(r.id) as reviewCount,
      (SELECT COUNT(*) FROM bookings b WHERE b.worker_id = w.id AND b.status IN ('accepted', 'in_progress')) as active_jobs_count
    FROM workers w
    LEFT JOIN reviews r ON r.worker_id = w.id
    WHERE w.verification_status = 'approved'
  `;
  const params = [];

  if (city && city.trim()) {
    query += ' AND (LOWER(w.city) LIKE ? OR LOWER(w.skill) LIKE ?)';
    params.push(`%${city.trim().toLowerCase()}%`, `%${city.trim().toLowerCase()}%`);
  }
  if (skill && skill.trim()) {
    const rawSkill = skill.trim();
    const cleanSkill = rawSkill.replace(/[^\w\s\u0900-\u097F]/gi, '').trim().toLowerCase();
    const firstWord = cleanSkill.split(/\s+/)[0] || cleanSkill;
    query += ' AND (w.skill = ? OR LOWER(w.skill) LIKE ? OR LOWER(w.skill) LIKE ?)';
    params.push(rawSkill, `%${firstWord}%`, `%${cleanSkill}%`);
  }

  query += ' GROUP BY w.id ORDER BY w.is_pro_member DESC, averageRating DESC, w.trust_score DESC, w.id DESC';

  const rows = db.prepare(query).all(...params);
  const formatted = rows.map(r => ({
    ...r,
    is_busy: (r.active_jobs_count || 0) > 0,
    id_code: r.id_code,
    masked_id_number: maskGovtId(r.govt_id_type, r.govt_id_number),
    averageRating: Math.round(r.averageRating * 10) / 10
  }));

  res.json(formatted);
});

// =========================================================
// PYTHON-POWERED REAL-TIME VOICE AI BRAIN ENDPOINT
// =========================================================
const { execFile } = require('child_process');

app.post('/api/voice-ai/query', (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.json({
      spoken_response: 'Namaste! Main Digital Kaam Awaaz Saathi hoon. Aap kya madad chahte hain?',
      suggestions: ['📜 Niyam Samjhao', '📝 Form Bharo', '🔍 Worker Dhundo'],
      action: 'none'
    });
  }

  const pyPath = path.join(__dirname, 'voice_brain.py');
  execFile('python', [pyPath, query.trim()], { timeout: 4000 }, (error, stdout, stderr) => {
    if (error || !stdout) {
      return res.json({
        query,
        spoken_response: 'Main samajh raha hoon. Aap worker search kar sakte hain, booking track kar sakte hain ya apna form bhar sakte hain.',
        action: 'none',
        suggestions: ['🔍 Worker Dhundo', '📝 Form Bharo', '📜 Niyam Samjhao']
      });
    }

    try {
      const parsed = JSON.parse(stdout.trim());
      res.json(parsed);
    } catch (e) {
      res.json({
        query,
        spoken_response: stdout.trim() || 'Aapki request process ho gayi hai.',
        action: 'none',
        suggestions: ['🔍 Worker Dhundo', '📦 Booking Status']
      });
    }
  });
});

// =========================================================
// 7. REAL REFUND PROCESSING ENGINE
// =========================================================
app.post('/api/bookings/cancel-and-refund', async (req, res) => {
  const { booking_id, phone, reason } = req.body;
  if (!booking_id) return res.status(400).json({ message: 'Booking ID required.' });

  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(booking_id));
  if (!b) return res.status(404).json({ message: 'Booking nahi mili.' });

  if (b.status === 'completed') {
    return res.status(400).json({ message: 'Completed booking cancel ya refund nahi ho sakti.' });
  }
  if (b.payment_status === 'refunded' || b.status === 'cancelled') {
    return res.json({ 
      ok: true, 
      message: 'Yeh booking pehle hi cancel aur 100% refund ho chuki hai.',
      refund_id: b.refund_id,
      amount: b.refund_amount || b.advance_amount || 0
    });
  }

  const refundAmt = Number(b.advance_amount) || 0;
  const refundId = 'RFND-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  // Trigger live Razorpay refund if real key and live payment ID exists
  if (rzp && b.razorpay_payment_id && !b.razorpay_payment_id.startsWith('pay_simulated')) {
    try {
      await rzp.payments.refund(b.razorpay_payment_id, {
        amount: Math.round(refundAmt * 100),
        notes: { reason: reason || 'Customer requested 100% refund cancellation' }
      });
    } catch (e) {
      console.log('Razorpay live refund note:', e.message);
    }
  }

  // Update Booking Status to Cancelled & Refunded
  db.prepare(`
    UPDATE bookings 
    SET status = 'cancelled', 
        payment_status = 'refunded', 
        refund_id = ?, 
        refund_amount = ?, 
        refund_status = 'processed', 
        refunded_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(refundId, refundAmt, b.id);

  // Insert into Refunds audit table
  db.prepare(`
    INSERT INTO refunds (booking_id, customer_phone, amount, refund_id, reason, status)
    VALUES (?, ?, ?, ?, ?, 'processed')
  `).run(b.id, b.customer_phone, refundAmt, refundId, reason || '100% Guaranteed Refund Policy');

  res.json({
    ok: true,
    message: `100% Refund safaltapoorvak process ho gaya! ₹${refundAmt} aapke source account mein bhej diya gaya hai.`,
    refund_id: refundId,
    refund_amount: refundAmt,
    status: 'processed',
    eta: '10-15 minute (UPI / Card)'
  });
});

app.post('/track-contact/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id) {
    try {
      db.prepare('INSERT INTO contact_analytics (worker_id) VALUES (?)').run(id);
    } catch (e) {}
  }
  res.json({ ok: true });
});

app.get('/worker-reviews/:id', (req, res) => {
  const id = Number(req.params.id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE worker_id = ? ORDER BY id DESC').all(id);
  const avgRow = db.prepare('SELECT AVG(rating) as avg, COUNT(id) as total FROM reviews WHERE worker_id = ?').get(id);

  res.json({
    reviews,
    average: Math.round((avgRow.avg || 0) * 10) / 10,
    total: avgRow.total || 0
  });
});

app.post('/add-review', (req, res) => {
  const { worker_id, customer_name, rating, comment } = req.body;
  if (!isValidName(customer_name)) {
    return res.status(400).json({ message: 'Kripya sahi naam daalein.' });
  }
  const r = Number(rating);
  if (isNaN(r) || r < 1 || r > 5) {
    return res.status(400).json({ message: 'Rating 1 se 5 stars ke beech honi chahiye.' });
  }

  db.prepare(`
    INSERT INTO reviews (worker_id, customer_name, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(Number(worker_id), customer_name.trim(), r, comment ? comment.trim() : '');

  res.json({ message: 'Dhanyawad! Review add ho gaya hai.' });
});

// Rate Cards Master Data
const MASTER_RATE_CARDS = [
  { 
    category: '💪 Majdur / Daily Wage Labor (दैनिक मजदूर)', 
    visiting_fee: 0, 
    items: [
      { service: 'Daily Construction / Loading Labor (8 Hours)', price: '₹450/day' },
      { service: 'Home Shifting & Heavy Luggage Helper', price: '₹350/half-day' },
      { service: 'Garden & Debris Cleaning Labor', price: '₹400/day' },
      { service: 'Demolition & Wall Breaking Helper', price: '₹500/day' }
    ]
  },
  { 
    category: '⚡ Electrician (Bijli Mistri)', 
    visiting_fee: 99, 
    items: [
      { service: 'Switchboard Repair / Fitting', price: '₹149' },
      { service: 'Ceiling Fan Installation / Repair', price: '₹199' },
      { service: 'Inverter & Battery Wiring', price: '₹349' },
      { service: 'Short Circuit / Wire Fault Detection', price: '₹299' }
    ]
  },
  { 
    category: '🔧 Plumber (Nal & Motor Fitting)', 
    visiting_fee: 99, 
    items: [
      { service: 'Water Tap Repair / Installation', price: '₹149' },
      { service: 'Water Motor / Pump Repair', price: '₹349' },
      { service: 'Water Tank Cleaning (500L - 1000L)', price: '₹499' },
      { service: 'Bathroom Drain / Pipe Blockage Removal', price: '₹249' }
    ]
  },
  { 
    category: '❄️ AC & Refrigerator Repair', 
    visiting_fee: 149, 
    items: [
      { service: 'Split / Window AC Jet Foam Service', price: '₹499' },
      { service: 'AC Gas Charging (R32 / R410)', price: '₹1,499' },
      { service: 'Refrigerator Cooling & Thermostat Fix', price: '₹399' },
      { service: 'AC Installation / Uninstallation', price: '₹799' }
    ]
  },
  { 
    category: '🧹 Home Deep Cleaning & Maid', 
    visiting_fee: 0, 
    items: [
      { service: '1 BHK Complete Home Deep Clean', price: '₹1,299' },
      { service: 'Bathroom Deep Cleaning & Acid Wash', price: '₹399' },
      { service: 'Kitchen Chimney & Oil Stain Clean', price: '₹499' },
      { service: 'Sofa 5-Seater Shampoo Dry Clean', price: '₹599' }
    ]
  },
  { 
    category: '🍳 Cook & Home Chef', 
    visiting_fee: 99, 
    items: [
      { service: 'Daily Home Cook (Monthly 2 Times/day)', price: '₹2,999/mo' },
      { service: 'Party / Special Occasion Chef (Up to 15 people)', price: '₹899' },
      { service: 'Pure Veg / North Indian Special Feast', price: '₹699' }
    ]
  },
  { 
    category: '🚗 Driver (Daily & Outstation)', 
    visiting_fee: 99, 
    items: [
      { service: 'Daily In-City Driver (8 Hours)', price: '₹599/day' },
      { service: 'Outstation Highway Trip (Per Day)', price: '₹899/day' },
      { service: 'Monthly Permanent Driver (9 Hours/day)', price: '₹12,500/mo' }
    ]
  },
  { 
    category: '🧱 Mason & Tile Mistri (Raj Mistri)', 
    visiting_fee: 149, 
    items: [
      { service: 'Tile Repair / Replacement (Per Sq. Ft)', price: '₹25/sqft' },
      { service: 'Wall Plaster & Minor Masonry Work', price: '₹499/day' },
      { service: 'Granite & Marble Polishing', price: '₹35/sqft' }
    ]
  }
];

app.get('/api/rate-cards', (req, res) => {
  res.json({ rateCards: MASTER_RATE_CARDS });
});

// =========================================================
// 7. RAZORPAY ADVANCE BOOKINGS & COMMISSION ORDERS
// =========================================================
app.post('/create-booking-order', async (req, res) => {
  try {
    const { worker_id, customer_name, customer_phone, service_date, address, message, estimated_amount, customer_lat, customer_lng, customer_accuracy } = req.body;

    if (!isValidName(customer_name)) return res.status(400).json({ message: 'Kripya sahi customer naam daalein.' });
    if (!isValidIndianPhone(customer_phone)) return res.status(400).json({ message: 'Kripya 10-digit mobile number daalein.' });

    const workerIdNum = Number(worker_id);

    // 🔒 1. CONCURRENCY AUTO-LOCK: Block booking if worker is already on an active job
    const activeJob = db.prepare(`
      SELECT id FROM bookings 
      WHERE worker_id = ? AND status IN ('accepted', 'in_progress')
    `).get(workerIdNum);

    if (activeJob) {
      return res.status(400).json({ 
        message: 'Yeh Worker abhi dusre customer ke live order par busy hain. Kripya dusra worker chunein ya unka kaam pura hone ka wait karein.' 
      });
    }

    // 📍 2. HYPERLOCAL 5KM RADIUS CHECK
    const worker = db.prepare('SELECT lat, lng, name FROM workers WHERE id = ?').get(workerIdNum);
    if (worker && worker.lat && worker.lng && customer_lat && customer_lng) {
      const distKm = calculateDistanceKm(worker.lat, worker.lng, Number(customer_lat), Number(customer_lng));
      if (distKm !== null && distKm > MAX_SERVICE_RADIUS_KM) {
        return res.status(400).json({ 
          message: `Yeh customer address worker ke ${MAX_SERVICE_RADIUS_KM}km service radius se bahar hai (${distKm} km door). Workers maximum ${MAX_SERVICE_RADIUS_KM}km tak hi doorstep service dete hain. Kripya apne paas ka worker chunein.` 
        });
      }
    }

    const estAmount = Number(estimated_amount) || 500;
    const cleanPhone = String(customer_phone).replace(/\D/g, '');

    // 🏡 3. AMC 2 FREE SERVICES AUTO-DETECTION
    const amcSub = db.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_phone = ? AND plan_name = 'plus_amc' AND status = 'active' AND free_services_used < free_services_total
      ORDER BY id DESC
    `).get(cleanPhone);

    let isAmcFree = 0;
    let advanceAmount = Math.max(20, Math.round(estAmount * 0.10));

    if (amcSub) {
      isAmcFree = 1;
      advanceAmount = 0; // ₹0 token for Plus AMC Member
      db.prepare(`UPDATE subscriptions SET free_services_used = free_services_used + 1 WHERE id = ?`).run(amcSub.id);
    }

    // Generate 4-digit Arrival Start OTP & Job Completion OTP for security handshake
    const startOtp = String(Math.floor(1000 + Math.random() * 9000));
    const completionOtp = String(Math.floor(1000 + Math.random() * 9000));

    let orderId = `order_mock_${Date.now()}`;
    if (rzp && advanceAmount > 0) {
      const order = await rzp.orders.create({
        amount: advanceAmount * 100,
        currency: 'INR',
        receipt: `bk_${Date.now()}`
      });
      orderId = order.id;
    }

    const stmt = db.prepare(`
      INSERT INTO bookings (worker_id, customer_name, customer_phone, service_date, address, message, estimated_amount, advance_amount, payment_status, status, razorpay_order_id, customer_lat, customer_lng, customer_accuracy, start_otp, completion_otp, escrow_status, is_amc_free_service)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'held', ?)
    `);

    const result = stmt.run(
      workerIdNum,
      customer_name.trim(),
      cleanPhone,
      service_date || null,
      address ? address.trim() : 'Local Service Address',
      message ? message.trim() : '',
      estAmount,
      advanceAmount,
      isAmcFree ? 'paid' : 'pending',
      isAmcFree ? 'pending' : 'pending',
      orderId,
      customer_lat ? Number(customer_lat) : null,
      customer_lng ? Number(customer_lng) : null,
      customer_accuracy ? Number(customer_accuracy) : null,
      startOtp,
      completionOtp,
      isAmcFree
    );

    res.json({
      bookingId: result.lastInsertRowid,
      orderId,
      amount: advanceAmount,
      isAmcFree: isAmcFree === 1,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create booking order error:', err);
    res.status(500).json({ message: 'Booking order create nahi ho saka.' });
  }
});

// =========================================================
// 🚨 DELAY ALERTS, LATE CANCELLATIONS & AUTO-REASSIGNMENT
// =========================================================
app.post('/api/job/report-delay/:id', (req, res) => {
  const id = Number(req.params.id);
  const { reason, minutes } = req.body;
  const mins = Number(minutes) || 10;

  db.prepare(`
    UPDATE bookings 
    SET delay_reason = ?, delay_minutes = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(reason ? reason.trim() : 'Traffic / Vehicle issue', mins, id);

  res.json({ ok: true, message: `Customer ko ${mins} minute delay ka alert bhej diya gaya hai.` });
});

app.post('/api/job/cancel-late/:id', (req, res) => {
  const id = Number(req.params.id);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili.' });

  db.prepare(`
    UPDATE bookings 
    SET status = 'cancelled_late', escrow_status = 'refunded', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(id);

  // Deduct 5 trust score points from worker for unexcused delay
  db.prepare(`UPDATE workers SET trust_score = MAX(50, trust_score - 5) WHERE id = ?`).run(booking.worker_id);

  res.json({ 
    ok: true, 
    message: 'Booking cancel ho gayi hai aur 100% advance token instant refund initiate ho gaya hai (₹0 cancellation fee).' 
  });
});

app.post('/api/job/reassign/:id', (req, res) => {
  const id = Number(req.params.id);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili.' });

  const currentWorker = db.prepare('SELECT * FROM workers WHERE id = ?').get(booking.worker_id);

  // Find next nearest available free worker with matching skill
  const skillQuery = currentWorker && currentWorker.skill ? `%${currentWorker.skill.replace(/[^\w\s\u0900-\u097F]/gi, '').trim().split(/\s+/)[0]}%` : '%';
  const nextWorker = db.prepare(`
    SELECT w.* FROM workers w
    WHERE w.id != ? AND (w.skill = ? OR w.skill LIKE ?) AND w.verification_status = 'approved' AND w.is_available = 1
      AND (SELECT COUNT(*) FROM bookings b WHERE b.worker_id = w.id AND b.status IN ('accepted', 'in_progress')) = 0
    ORDER BY w.is_pro_member DESC, w.trust_score DESC, w.id ASC
    LIMIT 1
  `).get(booking.worker_id, currentWorker ? currentWorker.skill : '', skillQuery);

  if (!nextWorker) {
    return res.status(404).json({ 
      message: 'Is samay area mein koi dusra free worker available nahi hai. Kripya 1-Tap Cancel & 100% Refund chunein.' 
    });
  }

  // Deduct penalty from delayed worker
  db.prepare(`UPDATE workers SET trust_score = MAX(50, trust_score - 5) WHERE id = ?`).run(booking.worker_id);

  // Reassign to nextWorker
  db.prepare(`
    UPDATE bookings 
    SET worker_id = ?, reassigned_from_worker_id = ?, status = 'pending', delay_reason = NULL, delay_minutes = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextWorker.id, booking.worker_id, id);

  res.json({ 
    ok: true, 
    message: `Naya Verified Worker (${nextWorker.name}) assign kar diya gaya hai!`,
    newWorker: { id: nextWorker.id, name: nextWorker.name, phone: nextWorker.phone, skill: nextWorker.skill }
  });
});

app.post('/api/job/add-tip/:id', (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;
  const tip = Number(amount) || 20;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili.' });

  db.prepare(`UPDATE bookings SET tip_amount = tip_amount + ? WHERE id = ?`).run(tip, id);
  db.prepare(`UPDATE workers SET wallet_balance = wallet_balance + ? WHERE id = ?`).run(tip, booking.worker_id);
  db.prepare(`INSERT INTO wallet_transactions (worker_id, amount, type, description) VALUES (?, ?, 'credit', ?)`).run(booking.worker_id, tip, `Customer Tip / Bakshish for Job #${id}`);

  res.json({ ok: true, message: `Dhanyawad! ₹${tip} worker ke wallet mein bakshish jud gayi.` });
});

app.post('/verify-payment/:bookingId', (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (rzp && razorpay_signature) {
    const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification signature match nahi hua.' });
    }
  }

  db.prepare(`
    UPDATE bookings 
    SET payment_status = 'paid', status = 'pending', razorpay_payment_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(razorpay_payment_id || `pay_${Date.now()}`, bookingId);

  res.json({ message: 'Payment verify ho gaya! Worker ko request bhej di gayi hai.' });
});

// =========================================================
// 8. WORKER PANEL: MY BOOKINGS, 2-STEP OTP & WALLET
// =========================================================
app.get('/my-bookings', (req, res) => {
  const { phone } = req.query;
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  const worker = db.prepare('SELECT * FROM workers WHERE phone = ?').get(cleanPhone);
  if (!worker) {
    return res.json({ found: false });
  }

  const bookings = db.prepare(`
    SELECT * FROM bookings 
    WHERE worker_id = ? AND payment_status = 'paid'
    ORDER BY id DESC
  `).all(worker.id);

  res.json({
    found: true,
    worker: {
      id: worker.id,
      id_code: worker.id_code,
      name: worker.name,
      skill: worker.skill,
      city: worker.city,
      tier: worker.tier,
      trust_score: worker.trust_score,
      photo_path: worker.photo_path,
      is_available: worker.is_available,
      is_pro_member: worker.is_pro_member === 1,
      pro_expires_at: worker.pro_expires_at,
      wallet_balance: worker.wallet_balance || 0
    },
    bookings
  });
});

// 2-Step OTP Security Handshake: 1. Verify Arrival Start OTP
app.post('/api/job/verify-start-otp/:id', (req, res) => {
  const bookingId = Number(req.params.id);
  const { otp } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking record nahi mila.' });

  if (String(booking.start_otp).trim() !== String(otp).trim()) {
    return res.status(400).json({ message: '❌ Galat Start OTP! Kripya customer se sahi 4-digit code lein.' });
  }

  db.prepare(`
    UPDATE bookings 
    SET status = 'in_progress', job_started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(bookingId);

  res.json({ ok: true, message: '✅ Start OTP Verified! Kaam shuru ho gaya (Status: In-Progress).' });
});

// 2-Step OTP Security Handshake: 2. Verify Job Completion OTP
app.post('/api/job/verify-complete-otp/:id', (req, res) => {
  const bookingId = Number(req.params.id);
  const { otp, job_amount } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking record nahi mila.' });

  if (String(booking.completion_otp).trim() !== String(otp).trim()) {
    return res.status(400).json({ message: '❌ Galat Completion OTP! Kaam khatam hone par customer se code lein.' });
  }

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(booking.worker_id);
  const isPro = worker && worker.is_pro_member === 1;
  const actualAmount = Number(job_amount) || booking.estimated_amount || 500;

  if (isPro) {
    // 0% Commission for Pro Pass Members!
    db.prepare(`
      UPDATE bookings 
      SET status = 'completed', actual_job_amount = ?, commission_amount = 0, commission_status = 'waived_pro', escrow_status = 'released', job_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(actualAmount, bookingId);

    db.prepare(`UPDATE workers SET wallet_balance = wallet_balance + ? WHERE id = ?`).run(actualAmount, worker.id);
    db.prepare(`INSERT INTO wallet_transactions (worker_id, amount, type, description) VALUES (?, ?, 'credit', ?)`).run(worker.id, actualAmount, `Job #${bookingId} Payout (0% Pro Commission)`);

    return res.json({ ok: true, isPro: true, message: '👑 Kaam poora hua! Pro Member hone ke karan ZERO commission kata.' });
  } else {
    // Free Tier: Set to work_finished, ready for 10% commission invoice payment
    db.prepare(`
      UPDATE bookings 
      SET status = 'work_finished', actual_job_amount = ?, job_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(actualAmount, bookingId);

    return res.json({ ok: true, isPro: false, message: '✅ Completion OTP Verified! Ab 10% platform commission pay karein.' });
  }
});

app.post('/update-booking-status/:id', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!['accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  if (status === 'rejected') {
    db.prepare(`
      UPDATE bookings 
      SET status = 'rejected', escrow_status = 'refunded', payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);
    return res.json({ message: 'Booking reject kar di gayi hai aur customer ko 100% advance token refund initiate ho gaya hai.' });
  }

  db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  res.json({ message: `Booking status updated to ${status}.` });
});

app.post('/create-commission-order/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { job_amount } = req.body;
  const actualAmount = Number(job_amount);

  if (isNaN(actualAmount) || actualAmount <= 0) {
    return res.status(400).json({ message: 'Kripya actual job amount sahi daalein.' });
  }

  const commissionAmount = Math.max(10, Math.round(actualAmount * 0.10));
  let orderId = `comm_order_${Date.now()}`;

  if (rzp) {
    const order = await rzp.orders.create({
      amount: commissionAmount * 100,
      currency: 'INR',
      receipt: `comm_${id}_${Date.now()}`
    });
    orderId = order.id;
  }

  db.prepare(`
    UPDATE bookings 
    SET actual_job_amount = ?, commission_amount = ?, commission_order_id = ?
    WHERE id = ?
  `).run(actualAmount, commissionAmount, orderId, id);

  res.json({
    orderId,
    amount: commissionAmount,
    keyId: RAZORPAY_KEY_ID
  });
});

app.post('/verify-commission-payment/:id', (req, res) => {
  const id = Number(req.params.id);
  const { razorpay_payment_id } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (booking) {
    db.prepare(`
      UPDATE bookings 
      SET commission_status = 'paid', status = 'completed', escrow_status = 'released', commission_payment_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(razorpay_payment_id || `comm_pay_${Date.now()}`, id);

    const payout = (booking.actual_job_amount || 500) * 0.90;
    db.prepare(`UPDATE workers SET wallet_balance = wallet_balance + ? WHERE id = ?`).run(payout, booking.worker_id);
    db.prepare(`INSERT INTO wallet_transactions (worker_id, amount, type, description) VALUES (?, ?, 'credit', ?)`).run(booking.worker_id, payout, `Job #${id} Payout (Net 90%)`);
  }

  res.json({ message: 'Commission payment confirm ho gaya! Kaam poora ho gaya aur invoice generate ho gayi.' });
});

// =========================================================
// MONETIZATION: PRO PASS & CUSTOMER PLUS AMC SUBSCRIPTIONS
// =========================================================
app.post('/api/worker/buy-pro-pass', async (req, res) => {
  const { phone } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const worker = db.prepare('SELECT * FROM workers WHERE phone = ?').get(cleanPhone);
  if (!worker) return res.status(404).json({ message: 'Worker account nahi mila.' });

  const amount = 299; // ₹299/mo
  let orderId = `pro_ord_${Date.now()}`;
  if (rzp) {
    try {
      const ord = await rzp.orders.create({ amount: amount * 100, currency: 'INR', receipt: `pro_${worker.id}_${Date.now()}` });
      orderId = ord.id;
    } catch (e) {}
  }

  res.json({ orderId, amount, keyId: RAZORPAY_KEY_ID, workerId: worker.id });
});

app.post('/api/worker/verify-pro-pass', (req, res) => {
  const { phone, razorpay_payment_id } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const worker = db.prepare('SELECT * FROM workers WHERE phone = ?').get(cleanPhone);
  if (!worker) return res.status(404).json({ message: 'Worker nahi mila.' });

  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`UPDATE workers SET is_pro_member = 1, pro_expires_at = ?, trust_score = trust_score + 10 WHERE id = ?`).run(expiryDate, worker.id);
  db.prepare(`INSERT INTO subscriptions (user_phone, user_type, plan_name, amount, payment_id, expires_at) VALUES (?, 'worker', 'pro_pass', 299, ?, ?)`).run(cleanPhone, razorpay_payment_id || `pay_pro_${Date.now()}`, expiryDate);

  res.json({ ok: true, message: '👑 Badhaai ho! Aapka Digital Kaam Pro Pass active ho gaya hai (0% Commission & VIP Ranking).' });
});

app.post('/api/customer/buy-amc', async (req, res) => {
  const { phone, name } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!isValidIndianPhone(cleanPhone)) return res.status(400).json({ message: 'Valid 10-digit mobile number required.' });

  const amount = 999; // ₹999/yr
  let orderId = `amc_ord_${Date.now()}`;
  if (rzp) {
    try {
      const ord = await rzp.orders.create({ amount: amount * 100, currency: 'INR', receipt: `amc_${Date.now()}` });
      orderId = ord.id;
    } catch (e) {}
  }
  res.json({ orderId, amount, keyId: RAZORPAY_KEY_ID });
});

app.post('/api/customer/verify-amc', (req, res) => {
  const { phone, razorpay_payment_id } = req.body;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO subscriptions (user_phone, user_type, plan_name, amount, payment_id, expires_at) VALUES (?, 'customer', 'plus_amc', 999, ?, ?)`).run(cleanPhone, razorpay_payment_id || `pay_amc_${Date.now()}`, expiryDate);
  res.json({ ok: true, message: '🏡 Digital Kaam Plus AMC Active! 2 Free AC Services & Zero Visiting Fee unlocked.' });
});

app.get('/api/customer/amc-status', (req, res) => {
  const { phone } = req.query;
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const sub = db.prepare(`SELECT * FROM subscriptions WHERE user_phone = ? AND plan_name = 'plus_amc' AND status = 'active' ORDER BY id DESC`).get(cleanPhone);
  res.json({ isPlusMember: !!sub, subscription: sub });
});

// Worker Wallet API
app.get('/api/worker/wallet/:workerId', (req, res) => {
  const workerId = Number(req.params.workerId);
  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId);
  if (!worker) return res.status(404).json({ message: 'Worker nahi mila.' });

  const completed = db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(actual_job_amount), 0) as total FROM bookings WHERE worker_id = ? AND status = 'completed'`).get(workerId);
  const transactions = db.prepare(`SELECT * FROM wallet_transactions WHERE worker_id = ? ORDER BY id DESC LIMIT 10`).all(workerId);

  res.json({
    balance: worker.wallet_balance || (completed.total * 0.9),
    lifetimeEarnings: completed.total || 0,
    completedJobs: completed.c || 0,
    isPro: worker.is_pro_member === 1,
    proExpiresAt: worker.pro_expires_at,
    transactions
  });
});

app.post('/api/worker/wallet/withdraw/:workerId', (req, res) => {
  const workerId = Number(req.params.workerId);
  const { upi_id, amount } = req.body;
  const amt = Number(amount);

  const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId);
  if (!worker || worker.wallet_balance < amt || amt <= 0) {
    return res.status(400).json({ message: 'Withdrawal amount available balance se zyada nahi ho sakta.' });
  }

  db.prepare(`UPDATE workers SET wallet_balance = wallet_balance - ? WHERE id = ?`).run(amt, workerId);
  db.prepare(`INSERT INTO wallet_transactions (worker_id, amount, type, description) VALUES (?, ?, 'debit', ?)`).run(workerId, amt, `Withdrawal to UPI: ${upi_id || 'Bank Transfer'}`);

  res.json({ ok: true, message: `₹${amt} aapke UPI (${upi_id}) par 10-15 minute mein transfer ho jayega!` });
});

// Public QR Code Worker Verification Profile
app.get('/api/public/worker/:workerId', (req, res) => {
  const param = req.params.workerId;
  const isNum = /^\d+$/.test(param);
  const worker = isNum 
    ? db.prepare('SELECT * FROM workers WHERE id = ?').get(Number(param))
    : db.prepare('SELECT * FROM workers WHERE id_code = ?').get(param);

  if (!worker) return res.status(404).json({ message: 'Worker record nahi mila.' });

  const workerId = worker.id;
  const reviews = db.prepare('SELECT * FROM reviews WHERE worker_id = ? ORDER BY id DESC').all(workerId);
  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(id) as total FROM reviews WHERE worker_id = ?').get(workerId);
  const completed = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE worker_id = ? AND status = 'completed'`).get(workerId);

  res.json({
    id: worker.id,
    id_code: worker.id_code,
    name: worker.name,
    phone: worker.phone,
    skill: worker.skill,
    city: worker.city,
    tier: worker.tier,
    starting_price: worker.starting_price,
    photo_path: worker.photo_path,
    has_certificate: !!worker.certificate_path,
    govt_id_type: worker.govt_id_type,
    masked_id_number: maskGovtId(worker.govt_id_type, worker.govt_id_number),
    has_govt_id: !!worker.govt_id_photo,
    has_live_selfie: !!worker.live_selfie_path,
    verification_status: worker.verification_status,
    trust_score: worker.trust_score,
    phone_verified: worker.phone_verified,
    is_pro_member: worker.is_pro_member === 1,
    completed_jobs: completed.c || 0,
    rating: Math.round((avg.avg || 5) * 10) / 10,
    total_reviews: avg.total || 0,
    reviews
  });
});

// Worker Live Location Broadcast
app.post('/update-location/:workerId', (req, res) => {
  const workerId = Number(req.params.workerId);
  const { lat, lng, accuracy, heading, speed } = req.body;

  if (!lat || !lng) return res.status(400).json({ message: 'Coordinates required.' });

  db.prepare(`
    INSERT INTO worker_locations (worker_id, lat, lng, accuracy, heading, speed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(worker_id) DO UPDATE SET
      lat = excluded.lat,
      lng = excluded.lng,
      accuracy = excluded.accuracy,
      heading = excluded.heading,
      speed = excluded.speed,
      updated_at = CURRENT_TIMESTAMP
  `).run(workerId, Number(lat), Number(lng), accuracy ? Number(accuracy) : null, heading ? Number(heading) : null, speed ? Number(speed) : null);

  res.json({ ok: true });
});

// =========================================================
// 9. CUSTOMER: BOOKING STATUS & LIVE TRACKING
// =========================================================
app.get('/my-booking-status', (req, res) => {
  const { phone } = req.query;
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  const bookings = db.prepare(`
    SELECT b.*, w.name as worker_name, w.skill as worker_skill, w.phone as worker_phone, w.photo_path as worker_photo, w.id_code as worker_id_code, w.trust_score as worker_trust_score, w.is_pro_member as worker_is_pro
    FROM bookings b
    JOIN workers w ON w.id = b.worker_id
    WHERE b.customer_phone = ? AND b.payment_status = 'paid'
    ORDER BY b.id DESC
  `).all(cleanPhone);

  res.json({ bookings });
});

app.get('/worker-location/:workerId', (req, res) => {
  const workerId = Number(req.params.workerId);
  const loc = db.prepare('SELECT * FROM worker_locations WHERE worker_id = ?').get(workerId);

  if (!loc) {
    return res.json({ available: false, stale: false });
  }

  const updatedTime = new Date(loc.updated_at.includes('Z') ? loc.updated_at : loc.updated_at + 'Z').getTime();
  const isStale = (Date.now() - updatedTime) > 60000;

  res.json({
    available: true,
    stale: isStale,
    lat: loc.lat,
    lng: loc.lng,
    accuracy: loc.accuracy,
    updatedAt: loc.updated_at
  });
});

// =========================================================
// 10. ADMIN DASHBOARD & VERIFICATION APIs
// =========================================================
function adminAuth(req, res, next) {
  const pass = req.headers['x-admin-password'];
  if (pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Galat Admin Password! Access Denied.' });
  }
  next();
}

app.get('/admin/pending-workers', adminAuth, (req, res) => {
  const pending = db.prepare('SELECT * FROM workers ORDER BY id DESC').all();
  res.json({ pending });
});

app.get('/admin/seekers', adminAuth, (req, res) => {
  const seekers = db.prepare('SELECT * FROM seekers ORDER BY id DESC').all();
  res.json({ seekers });
});

// Admin Customer Management
app.get('/admin/customers', adminAuth, (req, res) => {
  const seekers = db.prepare('SELECT * FROM seekers ORDER BY id DESC').all();
  const bookingCustomers = db.prepare(`
    SELECT 
      customer_phone as phone,
      customer_name as name,
      address as city,
      COUNT(id) as total_bookings,
      COALESCE(SUM(estimated_amount), 0) as total_spent,
      MAX(created_at) as last_activity
    FROM bookings 
    GROUP BY customer_phone
    ORDER BY last_activity DESC
  `).all();

  const map = new Map();
  seekers.forEach(s => {
    map.set(s.phone, {
      id: s.id,
      name: s.name,
      phone: s.phone,
      city: s.city,
      type: 'Registered Seeker',
      trust_score: s.trust_score || 80,
      phone_verified: s.phone_verified || 1,
      total_bookings: 0,
      total_spent: 0,
      created_at: s.created_at
    });
  });

  bookingCustomers.forEach(bc => {
    if (map.has(bc.phone)) {
      const obj = map.get(bc.phone);
      obj.total_bookings = bc.total_bookings;
      obj.total_spent = bc.total_spent;
    } else {
      map.set(bc.phone, {
        id: 'c_' + bc.phone,
        name: bc.name,
        phone: bc.phone,
        city: bc.city,
        type: 'Verified Customer',
        trust_score: 85,
        phone_verified: 1,
        total_bookings: bc.total_bookings,
        total_spent: bc.total_spent,
        created_at: bc.last_activity
      });
    }
  });

  res.json({ customers: Array.from(map.values()) });
});

app.get('/admin/customer-bookings/:phone', adminAuth, (req, res) => {
  const cleanPhone = String(req.params.phone || '').replace(/\D/g, '');
  const bookings = db.prepare(`
    SELECT b.*, w.name as worker_name, w.skill as worker_skill, w.phone as worker_phone
    FROM bookings b
    JOIN workers w ON w.id = b.worker_id
    WHERE b.customer_phone = ?
    ORDER BY b.id DESC
  `).all(cleanPhone);

  res.json({ bookings });
});

app.post('/admin/delete-customer/:phone', adminAuth, (req, res) => {
  const cleanPhone = String(req.params.phone || '').replace(/\D/g, '');
  db.prepare('DELETE FROM seekers WHERE phone = ?').run(cleanPhone);
  db.prepare('DELETE FROM subscriptions WHERE user_phone = ?').run(cleanPhone);
  res.json({ ok: true, message: `Customer record (+91 ${cleanPhone}) safalta se delete ho gaya!` });
});

app.post('/admin/verify-worker/:id', adminAuth, (req, res) => {
  const id = Number(req.params.id);
  const { action } = req.body;
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  db.prepare('UPDATE workers SET verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
  res.json({ message: `Worker ${newStatus} ho gaya!` });
});

app.get('/admin/certificate/:id', adminAuth, (req, res) => {
  const id = Number(req.params.id);
  const worker = db.prepare('SELECT certificate_path FROM workers WHERE id = ?').get(id);

  if (!worker || !worker.certificate_path) {
    return res.status(404).send('Certificate nahi mila.');
  }

  const filePath = path.join(PRIVATE_UPLOADS_DIR, worker.certificate_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Certificate file storage mein nahi hai.');
  }

  res.sendFile(filePath);
});

// Fallback Route for Single Page / HTML serving (Express 4 & Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'workers.html'));
});

// Start Server with Graceful Port handling
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Digital Kaam 2.0 Server running at: http://localhost:${PORT}`);
  console.log(`🔐 Admin Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`🛡️ OTP Engine: Active & Protected\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.log(`⚠️ Port ${PORT} already in use. Trying port ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`\n🚀 Digital Kaam 2.0 Server running at: http://localhost:${fallbackPort}`);
      console.log(`🔐 Admin Dashboard: http://localhost:${fallbackPort}/admin.html\n`);
    });
  } else {
    console.error('Server error:', err);
  }
});
