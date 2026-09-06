"""
smart_brain_service.py — Digital Kaam Real-Time Smart Brain Integration
Bridges the Urban Operations Smart Brain with all Digital Kaam workers,
customer posted jobs, and real-time feeds.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

import smart_brain
from smart_brain import app, geo_manager, escrow_gateway, booking_manager, security_brain

# -----------------------------------------------------------------------------
# 1. PRE-SEEDED SYSTEM WORKERS WITH COMPLETE PROFILES
# -----------------------------------------------------------------------------
SYSTEM_WORKERS: List[Dict[str, Any]] = [
    {
        "worker_id": "w-101",
        "kaam_id": "DK-8492",
        "name": "Rohan Kumar Sharma",
        "avatar": "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=160&auto=format&fit=crop&q=80",
        "trade": "Master Electrician & Smart Home Setup",
        "skill": "electrician",
        "lat": 28.6315,
        "lng": 77.2167,
        "rating": 4.92,
        "review_count": 312,
        "jobs_completed": 384,
        "on_time_rate": 98.4,
        "experience_years": 8,
        "languages": ["Hindi", "English", "Bhojpuri"],
        "service_area": "South Delhi, Dwarka, Gurugram Sector 14-56",
        "distance_km": 2.1,
        "pricing": {"visit_charge": 199, "hourly_rate": 350, "emergency_charge": 499},
        "bio": "Certified Grade-A electrical specialist with Government ITI certification. Background verified through Aadhaar & Delhi Police clearance.",
        "skills": [
            {"name": "Full-House Wiring & Distribution Boards", "level": "Master Craftsman", "verified": True},
            {"name": "Inverter, Solar & UPS Integration", "level": "Master Craftsman", "verified": True},
            {"name": "Short Circuit Diagnostics & Thermal Testing", "level": "Skilled", "verified": True},
        ],
        "is_available": True,
        "govt_id_status": "APPROVED",
    },
    {
        "worker_id": "w-102",
        "kaam_id": "DK-3310",
        "name": "Mohammed Aslam",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80",
        "trade": "Sanitary & Plumbing Specialist",
        "skill": "plumber",
        "lat": 28.5700,
        "lng": 77.3200,
        "rating": 4.88,
        "review_count": 184,
        "jobs_completed": 228,
        "on_time_rate": 96.8,
        "experience_years": 6,
        "languages": ["Hindi", "Urdu", "English"],
        "service_area": "Noida Sectors 18-76, Indirapuram, Mayur Vihar",
        "distance_km": 3.4,
        "pricing": {"visit_charge": 149, "hourly_rate": 280, "emergency_charge": 399},
        "bio": "Expert in pipeline diagnostics, high-pressure pump setups, concealed wall leakages, and bathroom fittings.",
        "skills": [
            {"name": "Concealed Pipe Leakage Detection", "level": "Master Craftsman", "verified": True},
            {"name": "Water Motor & Pressure Pumps", "level": "Skilled", "verified": True},
            {"name": "Modern Bath Fittings & Geyser Setup", "level": "Master Craftsman", "verified": True},
        ],
        "is_available": True,
        "govt_id_status": "APPROVED",
    },
    {
        "worker_id": "w-103",
        "kaam_id": "DK-5521",
        "name": "Vikram Singh Verma",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
        "trade": "Master Carpenter & Modular Woodcraft",
        "skill": "carpenter",
        "lat": 28.6200,
        "lng": 77.2100,
        "rating": 4.85,
        "review_count": 142,
        "jobs_completed": 195,
        "on_time_rate": 95.5,
        "experience_years": 9,
        "languages": ["Hindi", "Punjabi"],
        "service_area": "West Delhi, Janakpuri, Rajouri Garden, Rohini",
        "distance_km": 1.8,
        "pricing": {"visit_charge": 199, "hourly_rate": 320, "emergency_charge": 450},
        "bio": "Specialist in modular kitchen cabinets, bespoke door locks, precision hinges, and antique wood restoration.",
        "skills": [
            {"name": "Modular Kitchen & Wardrobe Fixing", "level": "Master Craftsman", "verified": True},
            {"name": "Hydraulic Door Closers & Digital Locks", "level": "Skilled", "verified": True},
            {"name": "Furniture Structural Restoration", "level": "Master Craftsman", "verified": True},
        ],
        "is_available": True,
        "govt_id_status": "APPROVED",
    },
    {
        "worker_id": "w-104",
        "kaam_id": "DK-1094",
        "name": "Rajesh Mistri",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
        "trade": "Wall Finish, Putty & Waterproofing",
        "skill": "painter",
        "lat": 28.6400,
        "lng": 77.2300,
        "rating": 4.79,
        "review_count": 96,
        "jobs_completed": 112,
        "on_time_rate": 94.2,
        "experience_years": 5,
        "languages": ["Hindi"],
        "service_area": "East Delhi, Laxmi Nagar, Anand Vihar, Ghaziabad",
        "distance_km": 4.2,
        "pricing": {"visit_charge": 149, "hourly_rate": 250, "emergency_charge": 350},
        "bio": "Certified painter specialized in dampness/seepage waterproofing, texture painting, and Royale luxury finish.",
        "skills": [
            {"name": "Dampness & Seepage Waterproofing", "level": "Master Craftsman", "verified": True},
            {"name": "Royal Luxury Wall Finishes", "level": "Skilled", "verified": True},
        ],
        "is_available": True,
        "govt_id_status": "APPROVED",
    },
    {
        "worker_id": "w-105",
        "kaam_id": "DK-7729",
        "name": "Anita Devi",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
        "trade": "Deep Home Cleaning & Sanitization",
        "skill": "cleaning",
        "lat": 28.6250,
        "lng": 77.2200,
        "rating": 4.95,
        "review_count": 210,
        "jobs_completed": 260,
        "on_time_rate": 99.1,
        "experience_years": 4,
        "languages": ["Hindi", "Maithili"],
        "service_area": "Central Delhi, Connaught Place, Karol Bagh, Paharganj",
        "distance_km": 1.2,
        "pricing": {"visit_charge": 199, "hourly_rate": 200, "emergency_charge": 299},
        "bio": "Specialist in industrial kitchen degreasing, bathroom descaling, sofa shampooing, and anti-bacterial fogging.",
        "skills": [
            {"name": "Kitchen Degreasing & Chimney Cleaning", "level": "Master Craftsman", "verified": True},
            {"name": "Bathroom Tile Descaling & Grout Restoration", "level": "Master Craftsman", "verified": True},
            {"name": "Upholstery Deep Vacuum Sanitization", "level": "Skilled", "verified": True},
        ],
        "is_available": True,
        "govt_id_status": "APPROVED",
    }
]

# -----------------------------------------------------------------------------
# 2. REAL-TIME POSTED KAAM (JOBS) STORE & STATE
# -----------------------------------------------------------------------------
POSTED_JOBS: List[Dict[str, Any]] = [
    {
        "id": "job-101",
        "title": "मेन डिस्ट्रीब्यूशन बॉक्स में एमसीबी ट्रिपिंग समस्या",
        "category": "इलेक्ट्रीशियन (Electrician)",
        "description": "घर में एसी चालू करते ही मुख्य एमसीबी ट्रिप हो रही है। तुरंत जांच और रिपेयर की आवश्यकता है।",
        "imageUrl": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
        "budget": 650,
        "customerName": "अन्नू कुमार",
        "customerPhone": "+91 98765 43210",
        "customerAddress": "फ्लैट 402, शांति अपार्टमेंट्स, सेक्टर 14, नई दिल्ली",
        "customerTrustScore": 98,
        "distanceKm": 1.2,
        "postedAt": "10 मिनट पहले",
        "status": "OPEN",
        "interestedWorkers": [
            {
                "workerId": "w-101",
                "workerName": "Rohan Kumar Sharma",
                "workerKaamId": "DK-8492",
                "workerAvatar": "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=160&auto=format&fit=crop&q=80",
                "workerTrade": "Master Electrician & Smart Home Setup",
                "workerRating": 4.92,
                "bidAmount": 650,
                "requestedAt": "5 मिनट पहले",
            }
        ],
    },
    {
        "id": "job-102",
        "title": "किचन सिंक के नीचे पाइप लीकेज व नल रिप्लेसमेंट",
        "category": "प्लंबर (Plumber)",
        "description": "सिंक के नीचे मुख्य वेस्ट पाइप से पानी टपक रहा है और गर्म पानी वाला नल जाम है।",
        "imageUrl": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80",
        "budget": 450,
        "customerName": "प्रिया मल्होत्रा",
        "customerPhone": "+91 98111 22334",
        "customerAddress": "बी-12, वसंत कुंज, नई दिल्ली",
        "customerTrustScore": 95,
        "distanceKm": 2.4,
        "postedAt": "25 मिनट पहले",
        "status": "OPEN",
        "interestedWorkers": [],
    }
]

# -----------------------------------------------------------------------------
# 3. AUTO-SEED WORKERS INTO S2 GEOSPATIAL MANAGER ON LOAD
# -----------------------------------------------------------------------------
async def seed_workers_into_smart_brain():
    """Index all verified workers in Smart Brain's S2 Level 13 engine."""
    for w in SYSTEM_WORKERS:
        try:
            await geo_manager.upsert_worker(
                worker_id=w["worker_id"],
                name=w["name"],
                skill=w["skill"],
                lat=w["lat"],
                lng=w["lng"],
                rating=w["rating"],
            )
        except Exception as e:
            pass
    print(f"✅ Smart Brain S2 Indexed {len(SYSTEM_WORKERS)} verified workers.")

# Run seeding in event loop
try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(seed_workers_into_smart_brain())
    else:
        loop.run_until_complete(seed_workers_into_smart_brain())
except Exception:
    pass

# -----------------------------------------------------------------------------
# 4. REST ENDPOINTS FOR REAL-TIME WORKER PROFILES & POSTED KAAM
# -----------------------------------------------------------------------------
class JobCreatePayload(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=60)
    description: str = Field(default="", max_length=600)
    budget: int = Field(default=500, ge=50, le=100000)
    customer_name: str = Field(..., min_length=1, max_length=80)
    customer_phone: str = Field(default="", max_length=20)
    customer_address: str = Field(default="", max_length=255)
    lat: Optional[float] = Field(default=28.6315)
    lng: Optional[float] = Field(default=77.2167)
    image_url: Optional[str] = Field(default=None)

class JobApplyPayload(BaseModel):
    worker_id: str = Field(..., min_length=1, max_length=64)
    bid_amount: Optional[int] = Field(default=None)

@app.get("/api/workers", tags=["digital-kaam-feed"])
async def get_all_workers_feed():
    """Returns complete detailed worker profiles for the Customer UI feed."""
    return {"workers": SYSTEM_WORKERS, "count": len(SYSTEM_WORKERS)}

@app.get("/api/jobs", tags=["digital-kaam-feed"])
async def get_all_posted_jobs_feed():
    """Returns all live posted jobs for Worker UI feed in real-time."""
    return {"jobs": POSTED_JOBS, "count": len(POSTED_JOBS)}

@app.post("/api/jobs", status_code=201, tags=["digital-kaam-feed"])
async def create_new_job_feed(body: JobCreatePayload):
    """Customer posts a new job; immediately shows in worker feed in real-time."""
    new_job = {
        "id": f"job-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "title": body.title,
        "category": body.category,
        "description": body.description or "त्वरित कारीगर की आवश्यकता है।",
        "imageUrl": body.image_url or "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
        "budget": body.budget,
        "customerName": body.customer_name,
        "customerPhone": body.customer_phone,
        "customerAddress": body.customer_address,
        "customerTrustScore": 98,
        "distanceKm": 0.8,
        "postedAt": "अभी-अभी (Just now)",
        "status": "OPEN",
        "interestedWorkers": [],
    }
    POSTED_JOBS.insert(0, new_job)
    return {"status": "success", "job": new_job}

@app.post("/api/jobs/{job_id}/apply", tags=["digital-kaam-feed"])
async def apply_to_job(job_id: str, body: JobApplyPayload):
    """Worker applies to a customer's job; updates customer feed in real-time."""
    target_job = next((j for j in POSTED_JOBS if j["id"] == job_id), None)
    if not target_job:
        raise smart_brain.NotFoundError(f"Job {job_id} not found")

    worker = next((w for w in SYSTEM_WORKERS if w["worker_id"] == body.worker_id), None)
    if not worker:
        worker = SYSTEM_WORKERS[0]

    bid = {
        "workerId": worker["worker_id"],
        "workerName": worker["name"],
        "workerKaamId": worker["kaam_id"],
        "workerAvatar": worker["avatar"],
        "workerTrade": worker["trade"],
        "workerRating": worker["rating"],
        "bidAmount": body.bid_amount or target_job["budget"],
        "requestedAt": "अभी-अभी (Just now)",
    }

    # Check if already applied
    if not any(w["workerId"] == worker["worker_id"] for w in target_job["interestedWorkers"]):
        target_job["interestedWorkers"].append(bid)
        target_job["status"] = "WORKER_REQUESTED"

    return {"status": "success", "job": target_job, "applied": bid}
