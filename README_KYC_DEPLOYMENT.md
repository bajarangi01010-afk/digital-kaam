# Digital Kaam (काम आसान) — Multi-Platform Cross-Platform Architecture & Deployment Guide

**Digital Kaam** is an India-first, Dual-Trust verified local services platform connecting skilled service workers with verified customers through an auditable, controlled transaction lifecycle.

---

## 🚀 Core Platform Architecture

1. **Animated Landing Page**:
   - Branding: **Digital Kaam** (डिजिटल काम)
   - Slogan: **"Kaam Aasan"** (काम आसान)
   - Purpose: Direct connection between local skilled workers and verified customers.
   - Dual-Trust security badge & bilingual toggle (हिंदी / English).

2. **Role Selection**:
   - **Continue as Worker** (कारीगर के रूप में जारी रखें)
   - **Continue as Customer** (ग्राहक के रूप में जारी रखें)

3. **Worker 10-Step Journey**:
   - **Step 1: Registration Form**: Full Name (Aadhaar), Mobile Phone with OTP verification, GPS current address auto-detection, Clean profile photo.
   - **Step 2: Live Face Verification**: Native camera stream with centered oval guide overlay. Live snapshot matched against profile photo via Python FastAPI `/api/verify-face` (tolerance $\le 0.50$).
   - **Step 3: Mandatory Aadhaar OCR Match**: EasyOCR + OpenCV image enhancement with FuzzyWuzzy token sort ratio ($\ge 85\%$) via `/api/verify-aadhar`. Strict form lock until both verifications pass.
   - **Step 4: Skill & Experience Setup**: Local categories (Electrician, Plumber, Carpenter, Painter, Mason, Cleaner, Appliance Repair, Welder) and Experience level (Beginner, Certified, Experienced).
   - **Step 5: Worker UI/UX Dashboard**: Availability toggle (Online / Offline), Daily Attendance scheduler.
   - **Step 6: Location Radar**: When active, nearby customer posted jobs are shown with distance and Customer Trust details (Aadhaar verified, ratings, completed jobs).
   - **Step 7: Request to Work**: Worker bids/applies, sending real-time notification to customer.
   - **Step 8: Identity & QR Verification**: Customer verifies arriving worker using Digital Kaam ID scanner.
   - **Step 9: Handshake Dual-OTP**: Customer gives **Start OTP** $\rightarrow$ Work moves to `IN_PROGRESS`. Customer inspects finished work and gives **Completion OTP** $\rightarrow$ Job marked `COMPLETED`.
   - **Step 10: Settlement & Review**: Instant escrow payout & mutual rating.

4. **Customer Journey**:
   - **Trusted Registration**: Name, phone OTP verification, GPS address auto-detection, photo and Aadhaar verification.
   - **Location Radar**: Shows nearby verified workers with **Direct Call** and **Direct Book** options.
   - **Post Work**: Post job with detailed text description and work site photo.
   - **Booking & Auto-Refund**: Advance booking fee with 100% automated refund guarantee if worker fails to arrive (No-Show).
   - **Handshake OTP Viewer**: Generates Start OTP & Completion OTP, scans worker ID.

---

## 🐍 1. Python FastAPI Backend (`backend/` & `backend_ai_service/`)

### Dependencies
- `fastapi`, `uvicorn`, `python-multipart`
- `opencv-python-headless`, `numpy`
- `face_recognition` (dlib)
- `easyocr`, `fuzzywuzzy`, `python-Levenshtein`

### Dlib Native Compilation Safeguards
- **On Windows**:
  - Install **CMake** (`winget install Kitware.CMake`)
  - Install **Visual Studio C++ Desktop Development Tools** via Visual Studio Installer
  - *Fast Pre-compiled Wheel*: Install matching `.whl` from [dlib-wheels](https://github.com/z-mahmud22/Dlib_Windows_Python3.x) via `pip install dlib-*.whl`.
- **On macOS**:
  ```bash
  brew install cmake dlib
  ```
- **On Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y cmake build-essential libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
  ```

### Start the Server
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
API runs on `http://0.0.0.0:8000` with Swagger UI at `http://localhost:8000/docs`.

---

## 📱 2. Cross-Platform Flutter App (`flutter_client/` & `flutter/`)

### Smart Base URL Routing
In `lib/config/api_config.dart`:
- **Android Emulator**: `http://10.0.2.2:8000`
- **macOS / Windows Desktop**: `http://127.0.0.1:8000`
- **Physical Device (Wi-Fi)**: Set `physicalDeviceLanIp` (e.g. `192.168.1.100`).

### Native Permissions
- **Android**: `android/app/src/main/AndroidManifest.xml` includes `CAMERA`, `INTERNET`, `READ_MEDIA_IMAGES`.
- **macOS**: `macos/Runner/Info.plist` includes `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`. `DebugProfile.entitlements` and `Release.entitlements` enable camera and network client access.

### Terminal Commands to Run
```bash
cd flutter_client

# Fetch packages
flutter pub get

# Run on Windows Desktop
flutter run -d windows

# Run on macOS Desktop
flutter run -d macos

# Run on Android Emulator or Device
flutter run -d android
```

---

## 🌐 3. Interactive Web Client (`src/`)
```bash
# Start Vite development server
npm install
npm run dev
```
Available at `http://localhost:5173`.
