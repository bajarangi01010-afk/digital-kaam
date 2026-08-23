# -*- coding: utf-8 -*-
import sys
import json
import re

DIGITAL_KAAM_KNOWLEDGE = {
    "platform_name": "Digital Kaam 2.0",
    "official_helpline": "+91 6205399450, +91 9065064475, +91 8603766262",
    "whatsapp_community": "https://chat.whatsapp.com/L94CfvZd4DGFzJMjhktaDh",
    "max_service_radius_km": 15,
    "advance_token_percent": 10,
    "warranty_days": 30,
    
    "pricing_rules": {
        "advance_token": "Customer ko booking confirm karne ke liye 10% advance token online dena hota hai jo escrow mein safe rehta hai.",
        "balance_payment": "Baqi 90% payment kaam poora hone par direct worker ko cash ya UPI se dena hota hai.",
        "worker_payout": "Worker ko har job ka net 90% payout milta hai aur 10% platform commission lagta hai."
    },
    
    "refund_policy": {
        "rule": "Agar worker 15 minute se zyada late ho jaye ya customer booking cancel kare, toh 100% Advance Token turant direct source UPI/Card mein wapas mil jata hai.",
        "process_time": "10-15 minute ke andar 100% refund process ho jata hai.",
        "guarantee": "100% Escrow Money-Back Trust Shield."
    },
    
    "safety_and_kyc": {
        "point_1": "Government Photo ID (Aadhaar, Voter ID, DL, Passport ya PAN) mandatory hai.",
        "point_2": "Live Camera Face Liveness Match fake documents ko rokne ke liye mandatory hai.",
        "point_3": "2-Step Mobile OTP Shield dono worker aur customer ke liye zaroori hai."
    },
    
    "monetization_plans": {
        "plus_amc": {
            "name": "Digital Kaam Plus AMC",
            "price": "Rs 999 / Year",
            "benefits": "2 Free Home AC Services, Zero Visiting Charge, Priority Booking, 30-Day Coverage."
        },
        "pro_pass": {
            "name": "Worker Pro Pass",
            "price": "Rs 299 / Month",
            "benefits": "Golden Crown Badge, Search results mein Top 1 Rank Boost, Unlimited Free Leads."
        }
    },
    
    "allowed_tabs": {
        "workers": {"url": "/workers.html", "title": "Worker Search & Directory", "allowed": True},
        "register": {"url": "/index.html", "title": "Worker Registration", "allowed": True},
        "customer": {"url": "/customer.html", "title": "Customer Hub & KYC", "allowed": True},
        "tracking": {"url": "/booking-status.html", "title": "Live Tracking & Refund Status", "allowed": True},
        "worker_panel": {"url": "/my-bookings.html", "title": "Worker Job Panel & Wallet", "allowed": True},
        "verify_worker": {"url": "/verify-worker.html", "title": "Public Worker QR ID Check", "allowed": True},
        "admin": {"url": "/admin.html", "title": "Admin Security Portal", "allowed": False, "reason": "Admin portal confidential hai, voice shortcut se open nahi hoga."}
    }
}

def process_voice_query(query_text):
    text = (query_text or "").strip()
    lower = text.lower()
    
    res = {
        "query": text,
        "spoken_response": "",
        "action": "none",
        "target_url": None,
        "field_auto_fill": {},
        "suggestions": []
    }
    
    if not text:
        res["spoken_response"] = "Namaste! Main Digital Kaam Awaaz Saathi hoon. Aap kya madad chahte hain?"
        res["suggestions"] = ["📜 Niyam Samjhao", "📝 Form Bharo", "🔍 Worker Dhundo"]
        return res

    # 1. Navigation & Tab Switching
    if any(k in lower for k in ["worker dhundo", "mistri chahiye", "kaam karwana hai", "search worker", "plumber chahiye", "electrician chahiye"]):
        skill_param = ""
        if "electrician" in lower or "bijli" in lower: skill_param = "Electrician"
        elif "plumber" in lower or "nal" in lower: skill_param = "Plumber"
        elif "painter" in lower or "rangai" in lower: skill_param = "Painter"
        elif "driver" in lower: skill_param = "Driver"
        elif "cook" in lower or "khana" in lower: skill_param = "Cook"
        elif "carpenter" in lower or "badhai" in lower: skill_param = "Carpenter"
        elif "mazdoor" in lower or "labor" in lower: skill_param = "Labor"
        
        target = "/workers.html" + (f"?skill={skill_param}" if skill_param else "")
        res["action"] = "navigate"
        res["target_url"] = target
        res["spoken_response"] = f"Worker search page khol rahe hain{' jisme ' + skill_param + ' filter laga hai' if skill_param else ''}."
        res["suggestions"] = ["🔍 Patna ke worker", "📅 Direct Book", "🪪 ID Check"]
        return res

    if any(k in lower for k in ["booking status", "order kahan hai", "mera worker kahan hai", "tracking dikhao", "live location"]):
        res["action"] = "navigate"
        res["target_url"] = "/booking-status.html"
        res["spoken_response"] = "Aapki live order tracking khol rahe hain."
        res["suggestions"] = ["⚡ Late Alert", "💰 100% Refund", "🔁 Reassign"]
        return res

    if any(k in lower for k in ["worker registration", "worker banna hai", "kaam dhoondhna hai", "register karna hai", "naya khata"]):
        res["action"] = "navigate"
        res["target_url"] = "/index.html"
        res["spoken_response"] = "Worker registration page khol rahe hain. Aaiye aapka free account banayein."
        res["suggestions"] = ["📝 Form Bharo", "📜 Niyam Samjhao", "📸 Selfie Lo"]
        return res

    if any(k in lower for k in ["customer hub", "customer login", "mera profile", "grahak account"]):
        res["action"] = "navigate"
        res["target_url"] = "/customer.html"
        res["spoken_response"] = "Customer portal khol rahe hain jahan aap apni KYC aur bookings dekh sakte hain."
        res["suggestions"] = ["🪪 Customer KYC", "🏡 Plus AMC", "📞 Support"]
        return res

    if any(k in lower for k in ["my bookings", "worker panel", "mera kaam", "wallet", "kamai", "earning"]):
        res["action"] = "navigate"
        res["target_url"] = "/my-bookings.html"
        res["spoken_response"] = "Worker dashboard khol rahe hain jahan aap apna wallet aur naye jobs dekh sakte hain."
        res["suggestions"] = ["💰 Wallet Balance", "👑 Pro Pass", "🟢 Available Now"]
        return res

    if "admin" in lower:
        res["spoken_response"] = "Security karan se Admin Portal aawaz se open nahi ho sakta. Admin password se hi khulega."
        res["suggestions"] = ["🔍 Worker Dhundo", "📦 Booking Status", "🧑 Customer Hub"]
        return res

    # 2. Platform Knowledge Q&A
    if any(k in lower for k in ["refund", "paisa wapas", "cancel policy", "paise kab milenge"]):
        res["spoken_response"] = "Digital Kaam par 100% Money-Back Escrow Guarantee hai! Agar worker 15 minute se late ho ya aap booking cancel karein, toh poora advance token turant 10-15 minute mein aapke account mein transfer ho jata hai."
        res["suggestions"] = ["📦 Booking Cancel & Refund", "🔁 Doosra Worker Bhejo", "📞 Helpline Call"]
        return res

    if any(k in lower for k in ["niyam", "terms", "rule", "shart", "conditions"]):
        res["spoken_response"] = "Digital Kaam ke 4 mukhya niyam hain: 1. Asali Photo Aadhar ID dena zaroori hai. 2. Fixed aur transparent rate lena hai. 3. 15 minute ke andar time par pahuchna hai. 4. 100% Advance refund protection milta hai."
        res["action"] = "explain_terms"
        res["suggestions"] = ["✅ Haan Main Sahmat Hoon", "📝 Direct Form Bharo", "📜 Poori Policy"]
        return res

    if any(k in lower for k in ["plus amc", "amc kya hai", "annual maintenance", "free ac"]):
        res["spoken_response"] = "Digital Kaam Plus AMC Rs 999 saalana mein milta hai jisme 2 Free Home AC Services, Zero Visiting Charge aur 30-day complete repair warranty shamil hai."
        res["suggestions"] = ["🏡 Plus AMC Join Karein", "❄️ AC Mistri Dhundo"]
        return res

    if any(k in lower for k in ["pro pass", "worker pro", "top rank", "crown"]):
        res["spoken_response"] = "Worker Pro Pass Rs 299 mahine ka plan hai jisse worker ko Golden Crown badge aur search results mein Top 1 Rank boost milta hai."
        res["suggestions"] = ["👑 Pro Pass Buy Karein", "🧰 Worker Panel"]
        return res

    if any(k in lower for k in ["helpline", "contact", "support", "madad", "number", "safety"]):
        res["spoken_response"] = f"Aap 24/7 helpline number {DIGITAL_KAAM_KNOWLEDGE['official_helpline']} par call kar sakte hain ya hamare official WhatsApp community se jud sakte hain."
        res["suggestions"] = ["💬 WhatsApp Community", "📞 Direct Call Support"]
        return res

    if any(k in lower for k in ["radius", "kitni door", "service area", "15 km", "distance"]):
        res["spoken_response"] = "Digital Kaam ka maximum service area 15 Kilometer hyperlocal radius hai. Worker 15km ke andar aapke ghar par aate hain."
        res["suggestions"] = ["📍 GPS Location Set", "🔍 Worker Dhundo"]
        return res

    # 3. Form Auto-Fill Extraction
    name_match = re.search(r'(?:mera naam|naam|name is|i am|main)s+([a-zA-Zऀ-ॿs]+?)(?:s+hai|s+hoon|.|$)', text, re.I)
    if name_match:
        p_name = name_match.group(1).strip()
        if len(p_name) >= 2 and not any(c.isdigit() for c in p_name):
            res["action"] = "auto_fill"
            res["field_auto_fill"]["name"] = p_name
            res["spoken_response"] = f"Aapka naam {p_name} note kar liya hai. Ab apna 10 digit ka mobile number boliye..."
            res["suggestions"] = ["🗣️ 'Mera number 9876543210'", "⚡ Bijli Mistri", "📍 Patna"]
            return res

    digits = re.sub(r'\D', '', text)
    if len(digits) >= 10:
        phone10 = digits[-10:]
        if phone10[0] in '6789':
            res["action"] = "auto_fill"
            res["field_auto_fill"]["phone"] = phone10
            res["spoken_response"] = f"Mobile number {' '.join(phone10)} darj ho gaya hai. Aap kaun sa kaam karte hain?"
            res["suggestions"] = ["⚡ Bijli Mistri", "🔧 Plumber", "🎨 Painter", "🚗 Driver"]
            return res

    # 4. Default Fallback
    res["spoken_response"] = "Main samajh raha hoon. Digital Kaam par aap worker dhund sakte hain, naya register kar sakte hain ya live booking track kar sakte hain."
    res["suggestions"] = ["🔍 Worker Dhundo", "📝 Registration Karo", "📦 Booking Status", "📜 Niyam Samjhao"]
    return res

if __name__ == '__main__':
    if len(sys.argv) > 1:
        raw_input = ' '.join(sys.argv[1:])
        result = process_voice_query(raw_input)
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(json.dumps({"status": "ready", "message": "Digital Kaam Python AI Voice Brain is Active."}))
