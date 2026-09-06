# Digital Kaam - Biometric Face & Aadhaar OCR Verification Backend

Production-grade Python/FastAPI microservice implementing:
1. **Biometric Live Face Verification**: Compares uploaded profile photo with real-time camera snapshot using OpenCV & `face_recognition` with strict **0.50 tolerance threshold**.
2. **Aadhaar Card OCR Name Matching**: Extracts Aadhaar card text using OpenCV preprocessing & `easyocr`, performing line-by-line fuzzy token matching via `fuzzywuzzy` with strict **>= 85% score threshold**.

---

## 🚀 Quick Start (Local Setup)

### 1. Python Environment Setup
```bash
# Navigate to backend directory
cd backend_ai_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows (cmd):
venv\Scripts\activate.bat
# On Windows (PowerShell):
venv\Scripts\Activate.ps1
```

---

## 🛠️ Dlib & Native Compilation Safeguards (Critical)

`face_recognition` depends on `dlib`, which contains native C++ code. Follow platform-specific steps:

### On macOS:
```bash
# 1. Install CMake and dlib via Homebrew:
brew install cmake dlib

# 2. Install requirements:
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### On Windows:
Option A (Easiest - Pre-compiled wheel):
```bash
# Download pre-built dlib wheel for your Python version (e.g. Python 3.10 / 3.11)
# Example for Python 3.11:
pip install https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.1-cp311-cp311-win_amd64.whl
pip install -r requirements.txt
```
Option B (Compile from source):
1. Install **Visual Studio Community** with "Desktop development with C++" workload selected.
2. Install CMake: `pip install cmake`
3. Run `pip install -r requirements.txt`

### On Linux (Ubuntu / Debian):
```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
pip install -r requirements.txt
```

---

## 🏃 Launching the Server

```bash
# Start FastAPI development server with hot-reloading on port 8000
python main.py
# Or using uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger Documentation: `http://localhost:8000/docs`

---

## 📡 API Endpoints

### 1. `POST /api/verify-face`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `uploaded_photo`: Binary file (JPEG/PNG) of chosen profile photo
  - `live_snapshot`: Binary file (JPEG/PNG) captured from live camera preview
- **Response**:
```json
{
  "status": "success",
  "match": true,
  "distance": 0.3842,
  "tolerance_threshold": 0.5,
  "confidence_percentage": 94.25,
  "message": "बायोमेट्रिक लाइव फेस सत्यापन सफल! दोनों तस्वीरें एक ही व्यक्ति की हैं।"
}
```

### 2. `POST /api/verify-aadhar`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `aadhar_image`: Binary file of the Aadhaar card
  - `user_name`: Text string of user's entered full name
- **Response**:
```json
{
  "status": "success",
  "is_approved": true,
  "score": 95,
  "threshold": 85,
  "user_name": "Ram Kumar",
  "matched_text": "RAM KUMAR",
  "message": "आधार कार्ड पर नाम सफलतापूर्वक सत्यापित हुआ! (मिलान स्कोर: 95% ≥ 85%)"
}
```
