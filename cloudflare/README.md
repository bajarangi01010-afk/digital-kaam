# ☁️ Digital Kaam — Cloudflare Deployment Guide

यह गाइड आपको **Digital Kaam** को Cloudflare पर डिप्लॉय करने की पूरी प्रक्रिया समझाती है।

---

## 1. Cloudflare Pages पर Flutter Web ऐप डिप्लॉय करना (100% Free & Unlimited Bandwidth)

### चरण (Steps):
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) में लॉगिन करें।
2. बायीं मेन्यू से **Compute (Workers & Pages)** ➔ **Pages** चुनें।
3. **"Create Application"** ➔ **"Pages"** ➔ **"Upload Assets"** पर क्लिक करें।
4. अपने प्रोजेक्ट का नाम दें (उदा. `digital-kaam-web`)।
5. आपके कंप्यूटर पर बना हुआ यह फ़ोल्डर अपलोड करें:
   ```
   C:\digital-kaam\flutter_client\build\web
   ```
6. **"Deploy Site"** पर क्लिक करें!
   - आपकी वेबसाइट तुरंत लाइव हो जाएगी (उदा. `https://digital-kaam-web.pages.dev`).
   - `_redirects` और `_headers` फ़ाइलें पहले से शामिल हैं, जिससे SPA रिफ्रेश करने पर कभी भी 404 नहीं आएगा।

---

## 2. Cloudflare Worker (24x7 Warmer & API Reverse Proxy) डिप्लॉय करना

यह Worker आपके Render बैकएंड को **24x7 एक्टिव** रखता है (जिससे 50 सेकंड का स्लीप / कोल्ड-स्टार्ट हमेशा के लिए खत्म हो जाता है) और सभी API रिक्वेस्ट्स पर CORS हेडर और एज-कैशिंग लगाता है।

### विकल्प A: Cloudflare Dashboard से (बिना किसी कमांड के - सबसे आसान):
1. Cloudflare Dashboard में **Workers & Pages** ➔ **"Create Application"** ➔ **"Worker"** पर क्लिक करें।
2. नाम दें: `digital-kaam-edge` ➔ **Deploy** दबाएं।
3. **"Edit Code"** पर क्लिक करें।
4. `cloudflare/worker.js` का पूरा कोड कॉपी करके वहाँ पेस्ट करें ➔ **"Deploy"** दबाएं।
5. Worker की **Settings** ➔ **Triggers** ➔ **Cron Triggers** में जाएं:
   - **"Add Cron Trigger"** दबाएं और `*/10 * * * *` (Every 10 minutes) सेट करें।
   - अब यह हर 10 मिनट में बैकएंड को पिंग करके हमेशा जगाए रखेगा!

### विकल्प B: टर्मिनल से 1-क्लिक डिप्लॉय (Wrangler CLI):
```bash
cd cloudflare
npx wrangler deploy
```

---

## 3. कस्टम डोमेन (Optional Custom Domain)

यदि आपके पास अपना डोमेन है (जैसे `digitalkaam.in`):
- **Web App:** Cloudflare Pages प्रोजेक्ट ➔ **Custom Domains** ➔ अपना डोमेन (जैसे `app.digitalkaam.in`) जोड़ें।
- **API:** Cloudflare DNS में CNAME रिकॉर्ड जोड़ें:
  `api` ➔ `digital-kaam-edge.<your-subdomain>.workers.dev` (Proxy ☁️ ON)।
