const path = require('path');

// Ek hi jagah se .env load hoga (project root). Purane duplicate 'bakend/.env'
// wala load hata diya gaya hai — wahi confusion ka ek source tha.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ---------- PAYMENT CONFIG ----------
const ADVANCE_PERCENT = 10;    // customer se booking ke waqt kitna % advance
const COMMISSION_PERCENT = 10; // worker se job complete hone ke baad kitna % commission

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ---------- PATHS ----------
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const WORKER_PHOTO_DIR = path.join(PUBLIC_DIR, 'uploads', 'workers');
const CERTIFICATE_DIR = path.join(ROOT_DIR, 'private_uploads', 'certificates');

// ---------- SKILLS LIST (fixed, genuine services only) ----------
const SKILLS = [
  'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason (Rajmistri)',
  'AC Repair Technician', 'Refrigerator Repair Technician', 'Washing Machine Repair Technician',
  'TV Repair Technician', 'Mobile Repair Technician', 'Computer/Laptop Repair Technician',
  'CCTV Installation Technician', 'Home Tutor', 'Music Teacher', 'Yoga Instructor',
  'Cook/Chef', 'Maid/Domestic Help', 'Baby Sitter/Nanny', 'Elderly Caretaker',
  'Nurse (Home Care)', 'Physiotherapist', 'Driver', 'Gardener/Mali',
  'Pest Control Technician', 'Water Purifier (RO) Technician', 'Solar Panel Technician',
  'Welder', 'Tailor/Darzi', 'Beautician', 'Barber/Hairdresser', 'Mehendi Artist',
  'Photographer', 'Videographer', 'Event Decorator', 'Caterer', 'Packers and Movers',
  'Interior Designer', 'Vehicle Mechanic (Car/Bike)', 'Car Washer', 'Tyre Puncture Repair',
  'Locksmith', 'Furniture Repair', 'Glass/Window Repair', 'Roofing Contractor',
  'Waterproofing Contractor', 'Pandit/Priest', 'DJ/Sound System', 'Computer Teacher'
];

// ---------- TIERS ----------
const TIERS = ['professional', 'experienced', 'new'];

module.exports = {
  PORT,
  ADMIN_PASSWORD,
  ADVANCE_PERCENT,
  COMMISSION_PERCENT,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  ROOT_DIR,
  PUBLIC_DIR,
  WORKER_PHOTO_DIR,
  CERTIFICATE_DIR,
  SKILLS,
  TIERS
};
