# 🚀 Digital Kaam — ₹0 Free Launch & Deployment Guide

Follow these quick 3 steps to take Digital Kaam live on the internet with zero spend:

---

## Step 1: Deploy Frontend on Vercel (Free 1-Click)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New Project"** and select your `digital-kaam` repository.
3. Vercel will automatically detect `Vite` framework settings (from `vercel.json`).
4. Click **Deploy**. Within 60 seconds, you will receive your live URL: `https://digital-kaam.vercel.app`!

---

## Step 2: Deploy Python Smart Brain on Render (Free 24x7)
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **"New +"** -> **"Web Service"**.
3. Connect your `digital-kaam` repository.
4. Set:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt && pip install pyjwt==2.13.0 uvicorn fastapi pydantic s2sphere`
   - **Start Command:** `python -m uvicorn smart_brain_service:app --app-dir backend --host 0.0.0.0 --port $PORT`
5. Click **"Create Web Service"** (Free Plan).
6. Your backend will be live at: `https://digital-kaam-smart-brain.onrender.com`.

---

## Step 3: Connect Frontend to Live Backend
In your Vercel project settings -> **Environment Variables**:
- Set `VITE_API_BASE_URL` = `https://digital-kaam-smart-brain.onrender.com`
- Click **Redeploy**.

---

## Step 4 (Optional): Razorpay UPI Test Mode
1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Switch toggle to **"Test Mode"** (top header).
3. Go to **Settings -> API Keys -> Generate Key**.
4. Use these test keys in Render environment variables:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
Now test UPI payments with mock ₹0 transactions!
