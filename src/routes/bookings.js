const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { isValidId, isValidName, isValidPhone, isValidAddress } = require('../utils/validators');
const { signaturesMatch } = require('../utils/security');
const { ADVANCE_PERCENT, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

router.post('/create-booking-order', async (req, res) => {
  const { worker_id, customer_name, customer_phone, service_date, address, message, estimated_amount, customer_lat, customer_lng, customer_accuracy } = req.body;

  if (!isValidId(worker_id)) return res.status(400).json({ message: 'Worker chuna nahi gaya' });
  if (!db.prepare('SELECT 1 FROM workers WHERE id = ?').get(worker_id)) return res.status(404).json({ message: 'Worker nahi mila' });
  if (!isValidName(customer_name)) return res.status(400).json({ message: 'Sahi naam daalein (sirf letters, kam se kam 3 characters, genuine naam)' });
  if (!isValidPhone(customer_phone)) return res.status(400).json({ message: 'Sahi 10-digit phone number daalein (6-9 se shuru, genuine number)' });
  if (!isValidAddress(address)) return res.status(400).json({ message: 'Sahi, poora address daalein' });
  const customerLat = Number(customer_lat), customerLng = Number(customer_lng), customerAccuracy = Number(customer_accuracy);
  if (!Number.isFinite(customerLat) || !Number.isFinite(customerLng) || customerLat < -90 || customerLat > 90 || customerLng < -180 || customerLng > 180) return res.status(400).json({ message: 'Booking ke liye current location select karein' });

  const estimatedAmountNum = parseFloat(estimated_amount);
  if (!Number.isFinite(estimatedAmountNum) || estimatedAmountNum <= 0 || estimatedAmountNum > 1000000) {
    return res.status(400).json({ message: 'Sahi estimated amount daalein' });
  }

  const advanceAmount = Math.round((estimatedAmountNum * ADVANCE_PERCENT) / 100);
  if (advanceAmount < 1) {
    return res.status(400).json({ message: 'Estimated amount bahut kam hai advance calculate karne ke liye' });
  }

  let bookingId;
  try {
    const insert = db.prepare(`
      INSERT INTO bookings (worker_id, customer_name, customer_phone, service_date, address, message, status, estimated_amount, advance_amount, payment_status, customer_lat, customer_lng, customer_accuracy, location_updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'payment_pending', ?, ?, 'created', ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = insert.run(
      worker_id, customer_name.trim(), customer_phone.trim(),
      service_date || null, address.trim(), message ? message.trim() : null,
      estimatedAmountNum, advanceAmount, customerLat, customerLng, Number.isFinite(customerAccuracy) ? customerAccuracy : null
    );
    bookingId = result.lastInsertRowid;

    const order = await razorpay.orders.create({
      amount: advanceAmount * 100,
      currency: 'INR',
      receipt: `booking_${bookingId}`
    });

    db.prepare('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?').run(order.id, bookingId);

    res.json({
      bookingId,
      orderId: order.id,
      amount: advanceAmount,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    if (bookingId) db.prepare("UPDATE bookings SET payment_status = 'failed' WHERE id = ?").run(bookingId);
    res.status(500).json({ message: 'Payment order banane mein error aayi, dobara try karein' });
  }
});

router.post('/verify-payment/:bookingId', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const bookingId = req.params.bookingId;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Payment details poori nahi mili' });
  }
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili' });
  if (booking.payment_status !== 'created' || booking.razorpay_order_id !== razorpay_order_id) {
    return res.status(400).json({ message: 'Payment order match nahi karta' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!signaturesMatch(expectedSignature, razorpay_signature)) {
    db.prepare("UPDATE bookings SET payment_status = 'failed' WHERE id = ?").run(bookingId);
    return res.status(400).json({ message: 'Payment verify nahi hui. Agar paisa kata hai toh support se contact karein.' });
  }

  db.prepare(`
    UPDATE bookings
    SET payment_status = 'paid', razorpay_payment_id = ?, status = 'pending'
    WHERE id = ?
  `).run(razorpay_payment_id, bookingId);

  res.json({ message: 'Payment successful! Booking worker ko bhej di gayi hai.' });
});

router.get('/my-bookings', (req, res) => {
  const phone = (req.query.phone || '').trim();
  if (!isValidPhone(phone)) return res.status(400).json({ message: 'Sahi phone number daalein' });
  const worker = db.prepare('SELECT * FROM workers WHERE phone = ?').get(phone);

  if (!worker) {
    return res.json({ found: false });
  }

  const bookings = db.prepare(`
    SELECT * FROM bookings
    WHERE worker_id = ? AND payment_status = 'paid'
    ORDER BY created_at DESC
  `).all(worker.id);
  res.json({ found: true, worker, bookings });
});

router.get('/my-booking-status', (req, res) => {
  const phone = (req.query.phone || '').trim();
  if (!isValidPhone(phone)) return res.status(400).json({ message: 'Sahi phone number daalein' });

  const bookings = db.prepare(`
    SELECT bookings.*, workers.name as worker_name, workers.skill as worker_skill, workers.id as worker_id
    FROM bookings
    JOIN workers ON bookings.worker_id = workers.id
    WHERE bookings.customer_phone = ? AND bookings.payment_status IN ('paid', 'refunded')
    ORDER BY bookings.created_at DESC
  `).all(phone);

  res.json({ bookings });
});

router.post('/update-booking-status/:bookingId', async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Galat status' });
  }

  const bookingId = req.params.bookingId;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

  if (!booking) return res.status(404).json({ message: 'Booking nahi mili' });
  if (booking.status !== 'pending' || booking.payment_status !== 'paid') {
    return res.status(400).json({ message: 'Is booking ka status ab change nahi ho sakta' });
  }

  if (status === 'rejected' && booking.payment_status === 'paid' && booking.razorpay_payment_id) {
    try {
      await razorpay.payments.refund(booking.razorpay_payment_id, {
        amount: booking.advance_amount * 100
      });
      db.prepare("UPDATE bookings SET status = 'rejected', payment_status = 'refunded' WHERE id = ?").run(bookingId);
      return res.json({ message: 'Booking reject ho gayi. Advance refund kar diya gaya hai.' });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ message: 'Refund complete nahi hua, isliye booking abhi pending rakhi gayi hai. Dobara try karein.' });
    }
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
  res.json({ message: 'Status update ho gaya!' });
});

module.exports = router;
