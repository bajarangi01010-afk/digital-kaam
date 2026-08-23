# 🚀 Digital Kaam 2.0 — Zero-Cost (₹0) Free Cloud Deployment Guide

Ye guide aapko apna **Digital Kaam 2.0** platform internet par **24/7 LIVE** chalane ke liye hai (Bilkul **₹0** kharche me).

---

## 🌟 Method 1: Render.com Par 1-Click Free Hosting (Recommended)

Render.com Python FastAPI aur Web apps ko **Free Tier** me 24/7 host karta hai.

### Steps:
1. **GitHub Par Code Upload Karein:**
   - [GitHub.com](https://github.com) par free account banayein.
   - Ek naya repository banayein (jaise: digital-kaam).
   - Apne computer ke c:\digital-kaam folder ka saara code GitHub repository me push karein.

2. **Render.com Account Banayein:**
   - [Render.com](https://render.com) par jayein aur **Sign Up with GitHub** karein.

3. **New Web Service Create Karein:**
   - **Dashboard** -> **New +** -> **Web Service** -> Apni GitHub repository select karein.
   - **Environment:** Python 3
   - **Build Command:** pip install -r requirements.txt
   - **Start Command:** uvicorn server:app --host 0.0.0.0 --port 
   - **Plan:** Free (/month)

4. **Environment Variables (Optional):**
   - **Environment** tab me ja kar ye keys add karein:
     - FAST2SMS_API_KEY = (Aapka Fast2SMS API key)
     - ADMIN_PASSWORD = password@123#
     - RAZORPAY_KEY_ID = (Aapka Razorpay Key)

5. **Deploy Par Click Karein:**
   - 2 minute me aapka live URL ban jayega (Jaise: https://digital-kaam.onrender.com).
   - Ab koi bhi poore Bharat se aapke app ko access aur use kar sakta hai! 🎉

---

## 🌟 Method 2: Apne Phone Par Local Wi-Fi Se Test Karna

Bina internet upload kiye, apne ghar ke Wi-Fi se apne mobile phone me chalayein:

1. Computer me terminal kholein aur run karein:
   `ash
   python server.py
   `
2. Terminal me aapka IP address dikhega (Jaise http://192.168.1.5:3000).
3. Apne mobile ke Chrome browser me wahi address daalein — poora app aapke phone me live chalega! 📱

---

## 🛡️ Key Features Included (100% Free):
- 🤖 **Python AI Aadhaar OCR Scanner:** ₹0 per scan.
- 📱 **Multi-Channel Real SMS & WhatsApp OTP:** Free/Low-cost pluggable gateway.
- 💳 **Infallible Escrow & UPI Payments:** Instant token checkout.
- 🗺️ **Live GPS Map & Turn-by-Turn Tracking:** OpenStreetMap unlimited free.
