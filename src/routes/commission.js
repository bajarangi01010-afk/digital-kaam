const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { signaturesMatch } = require('../utils/security');
const { COMMISSION_PERCENT, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

router.post('/create-commission-order/:bookingId', async (req, res) => {
  const { job_amount } = req.body;
  const bookingId = req.params.bookingId;

  const jobAmountNum = parseFloat(job_amount);
  if (!Number.isFinite(jobAmountNum) || jobAmountNum <= 0 || jobAmountNum > 1000000) {
    return res.status(400).json({ message: 'Sahi job amount daalein' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili' });
  if (booking.status !== 'accepted' || booking.payment_status !== 'paid') {
    return res.status(400).json({ message: 'Sirf accepted bookings ka commission liya ja sakta hai' });
  }
  if (booking.commission_status === 'created') {
    return res.status(400).json({ message: 'Commission payment pehle se pending hai' });
  }

  const commissionAmount = Math.round((jobAmountNum * COMMISSION_PERCENT) / 100);

  try {
    const order = await razorpay.orders.create({
      amount: commissionAmount * 100,
      currency: 'INR',
      receipt: `commission_${bookingId}`
    });

    db.prepare(`
      UPDATE bookings
      SET job_amount = ?, commission_amount = ?, commission_status = 'created', commission_order_id = ?
      WHERE id = ?
    `).run(jobAmountNum, commissionAmount, order.id, bookingId);

    res.json({
      bookingId,
      orderId: order.id,
      amount: commissionAmount,
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Commission order banane mein error aayi, dobara try karein' });
  }
});

router.post('/verify-commission-payment/:bookingId', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const bookingId = req.params.bookingId;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Payment details poori nahi mili' });
  }
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking nahi mili' });
  if (booking.commission_status !== 'created' || booking.commission_order_id !== razorpay_order_id) {
    return res.status(400).json({ message: 'Commission order match nahi karta' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (!signaturesMatch(expectedSignature, razorpay_signature)) {
    db.prepare("UPDATE bookings SET commission_status = 'failed' WHERE id = ?").run(bookingId);
    return res.status(400).json({ message: 'Payment verify nahi hui. Agar paisa kata hai toh support se contact karein.' });
  }

  db.prepare(`
    UPDATE bookings
    SET commission_status = 'paid', commission_payment_id = ?, status = 'completed'
    WHERE id = ?
  `).run(razorpay_payment_id, bookingId);

  res.json({ message: 'Commission payment successful!' });
});

module.exports = router;
