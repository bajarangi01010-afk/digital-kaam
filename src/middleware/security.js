// ---------- BASIC SECURITY HEADERS ----------
// Helmet jaisa package install nahi hai (offline/local setup), isliye zaroori
// security headers khud set kar rahe hain. Yeh clickjacking, MIME-sniffing,
// aur kuch common attacks se basic bachaav deta hai.
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0'); // legacy header off, modern browsers CSP use karte hain
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  next();
}

// ---------- SIMPLE IN-MEMORY RATE LIMITER ----------
// Ground-level app ke liye lightweight rate limiting: same IP se ek route par
// bahut zyada requests aayein toh block kar do. Production mein multiple
// servers hone par ek shared store (Redis) chahiye hoga, lekin single-server
// local/ground deployment ke liye yeh kaafi hai.
function rateLimit({ windowMs = 60_000, max = 20, message = 'Bahut zyada requests aa gayi hain. Thodi der baad try karein.' } = {}) {
  const hits = new Map(); // key -> [timestamps]

  // Purani entries periodically clean karte rahein taaki memory na badhe
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter(t => t > cutoff);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return function (req, res, next) {
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(key) || []).filter(t => t > cutoff);
    timestamps.push(now);
    hits.set(key, timestamps);

    if (timestamps.length > max) {
      return res.status(429).json({ message });
    }
    next();
  };
}

module.exports = { securityHeaders, rateLimit };
