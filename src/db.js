const path = require('path');
const Database = require('better-sqlite3');

// Single source of truth: project root database (src/ ke ek level upar).
const db = new Database(path.join(__dirname, '..', 'digitalkaam.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    skill TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    contact_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_lat REAL,
    current_lng REAL,
    current_accuracy REAL,
    current_heading REAL,
    current_speed REAL,
    location_updated_at DATETIME,
    photo_path TEXT,
    tier TEXT DEFAULT 'new',
    certificate_path TEXT,
    verification_status TEXT DEFAULT 'not_applicable',
    starting_price INTEGER
  );

  CREATE TABLE IF NOT EXISTS seekers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    current_lat REAL,
    current_lng REAL,
    current_accuracy REAL,
    location_updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_date TEXT,
    address TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_amount REAL,
    advance_amount REAL,
    payment_status TEXT DEFAULT 'created',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    job_amount REAL,
    commission_amount REAL,
    commission_status TEXT DEFAULT 'not_started',
    commission_order_id TEXT,
    commission_payment_id TEXT,
    customer_lat REAL,
    customer_lng REAL,
    customer_accuracy REAL,
    location_updated_at DATETIME,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
  );
`);

function addColumn(table, column, definition) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    if (!String(err.message).toLowerCase().includes('duplicate column')) throw err;
  }
}

[
  ['workers','contact_count','INTEGER DEFAULT 0'],
  ['workers','current_lat','REAL'],
  ['workers','current_lng','REAL'],
  ['workers','current_accuracy','REAL'],
  ['workers','current_heading','REAL'],
  ['workers','current_speed','REAL'],
  ['workers','location_updated_at','DATETIME'],
  ['workers','photo_path','TEXT'],
  ['workers','tier',"TEXT DEFAULT 'new'"],
  ['workers','certificate_path','TEXT'],
  ['workers','verification_status',"TEXT DEFAULT 'not_applicable'"],
  ['workers','starting_price','INTEGER'],
  ['workers','profile_photo_status',"TEXT DEFAULT 'pending'"],
  ['seekers','current_lat','REAL'],
  ['seekers','current_lng','REAL'],
  ['seekers','current_accuracy','REAL'],
  ['seekers','location_updated_at','DATETIME'],
  ['bookings','estimated_amount','REAL'],
  ['bookings','advance_amount','REAL'],
  ['bookings','payment_status',"TEXT DEFAULT 'created'"],
  ['bookings','razorpay_order_id','TEXT'],
  ['bookings','razorpay_payment_id','TEXT'],
  ['bookings','job_amount','REAL'],
  ['bookings','commission_amount','REAL'],
  ['bookings','commission_status',"TEXT DEFAULT 'not_started'"],
  ['bookings','commission_order_id','TEXT'],
  ['bookings','commission_payment_id','TEXT'],
  ['bookings','customer_lat','REAL'],
  ['bookings','customer_lng','REAL'],
  ['bookings','customer_accuracy','REAL'],
  ['bookings','location_updated_at','DATETIME']
].forEach(([t,c,d]) => addColumn(t,c,d));

module.exports = db;
