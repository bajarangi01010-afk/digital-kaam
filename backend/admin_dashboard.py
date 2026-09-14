"""
Digital Kaam — Master Platform Web Admin Dashboard
===================================================
A production-grade, responsive, dark-mode web console for the platform founder.
Enables real-time monitoring of verified workers, bookings, escrow funds, and S2 location radar.
"""

from fastapi.responses import HTMLResponse
import database
import time
from master_platform_brain import master_platform_brain

def get_admin_dashboard_html() -> str:
    workers = database.get_all_workers()
    bookings = database.get_all_bookings()
    kpis = database.get_platform_kpis()
    logged_out_accounts = database.get_all_logged_out_accounts()
    escrow_txs = database.get_all_escrow_transactions()
    master_tel = master_platform_brain.get_master_telemetry()
    circuit_badge_color = "#10b981" if master_tel["resilience_watchdog"]["master_status"] == "NORMAL_HEALTHY" else "#ef4444"
    circuit_status_text = master_tel["resilience_watchdog"]["master_status"]

    # Generate Escrow Ledger Table Rows (SHA-256 Chained)
    escrow_rows = ""
    for tx in escrow_txs:
        t_type = tx.get("tx_type", "HOLD")
        if "HOLD" in t_type:
            type_badge = '<span class="badge badge-warning">🔒 एस्क्रो जमा (HOLD)</span>'
        elif "RELEASE" in t_type:
            type_badge = '<span class="badge badge-success">✓ पेआउट रिलीज (PAID)</span>'
        elif "REFUND" in t_type:
            type_badge = '<span class="badge badge-danger">↩ 100% रिफंड (REFUND)</span>'
        else:
            type_badge = '<span class="badge badge-secondary">' + t_type + '</span>'

        date_str = time.strftime("%d %b %Y, %I:%M %p", time.localtime(tx.get("created_at", time.time())))
        short_curr_hash = (tx.get("curr_hash") or "")[:12] + "..."
        short_prev_hash = (tx.get("prev_hash") or "")[:12] + "..." if tx.get("prev_hash") != "GENESIS" else "GENESIS"

        escrow_rows += f"""
        <tr>
            <td style="font-family:monospace;font-weight:bold;color:#38bdf8;">{tx.get("tx_id")}</td>
            <td style="font-family:monospace;color:#e2e8f0;">{tx.get("booking_id")}</td>
            <td>{type_badge}</td>
            <td style="font-weight:bold;color:#10b981;font-size:15px;">₹{tx.get("amount")}</td>
            <td style="color:#c084fc;font-weight:bold;">₹{tx.get("fee", 0.0)}</td>
            <td><code style="background:#0f172a;padding:3px 6px;border-radius:4px;color:#94a3b8;font-size:10px;">{short_prev_hash}</code></td>
            <td><code style="background:#0f172a;padding:3px 6px;border-radius:4px;color:#34d399;font-size:10px;">{short_curr_hash}</code></td>
            <td style="font-size:11px;color:#94a3b8;">{date_str}</td>
        </tr>
        """

    # Generate Logged-out Accounts Table Rows
    logged_out_rows = ""
    for a in logged_out_accounts:
        photo_html = f'<img src="{a["photo_url"]}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #60a5fa;">' if a.get("photo_url") else '<div style="width:38px;height:38px;border-radius:50%;background:#1e293b;border:2px solid #475569;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:bold;font-size:14px;">👤</div>'
        role_label = "👷 कारीगर (Worker)" if a.get("role") == "WORKER" else "🛒 ग्राहक (Customer)"
        role_badge = '<span class="badge badge-info">' + role_label + '</span>'
        aid = a.get("account_id") or ""
        aname = (a.get("name") or "User").replace("'", "\\'")

        logged_out_rows += f"""
        <tr id="account-row-{aid}">
            <td style="font-family:monospace;font-weight:bold;color:#60a5fa;">{aid}</td>
            <td>{role_badge}</td>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    {photo_html}
                    <div>
                        <div style="font-weight:bold;color:#fff;">{a.get("name")}</div>
                        <div style="font-size:12px;color:#94a3b8;">{a.get("phone")}</div>
                    </div>
                </div>
            </td>
            <td><span class="skill-tag">{a.get("skill") or 'N/A'}</span></td>
            <td style="font-size:12px;color:#cbd5e1;max-width:200px;word-break:break-word;">{a.get("address") or 'N/A'}</td>
            <td style="font-weight:bold;color:#10b981;font-size:15px;">₹{a.get("visiting_fee", 350)}</td>
            <td><span style="color:#fbbf24;font-weight:bold;">{a.get("rating", 4.9)} ★</span> <span style="font-size:11px;color:#64748b;">({a.get("total_jobs", 14)} काम)</span></td>
            <td style="font-size:12px;color:#94a3b8;font-family:monospace;">{a.get("logout_time") or 'हाल ही में'}</td>
            <td><span class="badge badge-secondary" style="border:1px solid #475569;background:#1e293b;color:#94a3b8;">💾 आर्काइव</span></td>
            <td>
                <button onclick="deleteAccount('{aid}', '{aname}')" style="background:#475569;color:#f87171;border:1px solid #64748b;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;" onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='#475569';this.style.color='#f87171'">
                    🗑️ हटाएं
                </button>
            </td>
        </tr>
        """

    # Generate Workers Table Rows
    worker_rows = ""
    for w in workers:
        photo_html = f'<img src="{w["photo_url"]}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid #38bdf8;">' if w.get("photo_url") else '<div style="width:38px;height:38px;border-radius:50%;background:#1e293b;border:2px solid #475569;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:bold;font-size:14px;">👷</div>'
        verified_badge = '<span class="badge badge-success">✓ आधार व फेस सत्यापित</span>' if w.get("is_verified") else '<span class="badge badge-warning">लंबित (Pending)</span>'
        status_badge = '<span class="badge badge-active">🟢 ऑनलाइन (उपलब्ध)</span>' if w.get("is_available") else '<span class="badge badge-offline">व्यस्त / ऑफलाइन</span>'
        wid = w.get("worker_id") or ""
        wname = (w.get("name") or "Worker").replace("'", "\\'")

        worker_rows += f"""
        <tr id="worker-row-{wid}">
            <td style="font-family:monospace;font-weight:bold;color:#38bdf8;">{wid}</td>
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    {photo_html}
                    <div>
                        <div style="font-weight:bold;color:#fff;">{w.get("name")}</div>
                        <div style="font-size:12px;color:#94a3b8;">{w.get("phone")}</div>
                    </div>
                </div>
            </td>
            <td><span class="skill-tag">{w.get("skill")}</span></td>
            <td>{verified_badge}</td>
            <td style="font-weight:bold;color:#10b981;font-size:15px;">₹{w.get("visiting_fee")}</td>
            <td><span style="color:#fbbf24;font-weight:bold;">{w.get("rating")} ★</span> <span style="font-size:11px;color:#64748b;">({w.get("total_jobs")} काम)</span></td>
            <td><code style="background:#0f172a;padding:3px 6px;border-radius:4px;color:#38bdf8;font-size:11px;">{w.get("s2_token") or '390ce2b4'}</code></td>
            <td style="font-size:12px;color:#cbd5e1;">
                <div><strong>{w.get("bank_name", "SBI")}</strong></div>
                <div style="color:#94a3b8;font-family:monospace;">{w.get("account_no", "N/A")} • {w.get("ifsc", "N/A")}</div>
            </td>
            <td>{status_badge}</td>
            <td>
                <button onclick="deleteWorker('{wid}', '{wname}')" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;box-shadow:0 2px 6px rgba(239,68,68,0.3);transition:background 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                    🗑️ डिलीट करें
                </button>
            </td>
        </tr>
        """

    # Generate Bookings Table Rows
    booking_rows = ""
    for b in bookings:
        status = b.get("tracking_status", "ON_THE_WAY")
        if status == "ON_THE_WAY":
            st_html = '<span class="badge badge-info">🛵 कारीगर रास्ते में है</span>'
        elif status == "REACHED":
            st_html = '<span class="badge badge-warning">📍 द्वार पर पहुंचा</span>'
        elif status == "STARTED":
            st_html = '<span class="badge badge-active">⚙️ काम चालू है</span>'
        elif status == "COMPLETED":
            st_html = '<span class="badge badge-success">✓ संपन्न (Completed)</span>'
        else:
            st_html = f'<span class="badge badge-secondary">{status}</span>'

        escrow_badge = '<span class="badge badge-success">🔒 सुरक्षित (Locked)</span>' if b.get("escrow_status") == "LOCKED" else '<span class="badge badge-released">✓ बैंक में ट्रांसफर्ड</span>'

        booking_rows += f"""
        <tr>
            <td style="font-family:monospace;font-weight:bold;color:#38bdf8;">{b.get("booking_id")}</td>
            <td>
                <div style="font-weight:bold;color:#fff;">{b.get("customer_name")}</div>
                <div style="font-size:12px;color:#94a3b8;">{b.get("customer_phone")}</div>
                <div style="font-size:11px;color:#64748b;">{b.get("customer_address", "")}</div>
            </td>
            <td>
                <div style="font-weight:bold;color:#e2e8f0;">{b.get("worker_name", b.get("worker_id"))}</div>
                <div style="font-size:12px;color:#38bdf8;">{b.get("service_name")}</div>
            </td>
            <td style="font-weight:bold;color:#10b981;font-size:15px;">₹{b.get("visiting_fee")}</td>
            <td>{escrow_badge}</td>
            <td>{st_html}</td>
            <td>
                <span style="font-weight:bold;color:#fff;">{b.get("distance_km", 1.0)} km</span>
                <div style="font-size:11px;color:#fbbf24;">{b.get("eta_minutes", 5)} मिनट आगमन</div>
            </td>
            <td>
                <div style="display:flex;gap:6px;">
                    <div style="background:#0f172a;border:1px solid #f59e0b;padding:4px 8px;border-radius:6px;text-align:center;">
                        <div style="font-size:9px;color:#f59e0b;font-weight:bold;">START OTP</div>
                        <div style="font-family:monospace;color:#fbbf24;font-weight:bold;font-size:14px;letter-spacing:1px;">{b.get("start_otp")}</div>
                    </div>
                    <div style="background:#0f172a;border:1px solid #10b981;padding:4px 8px;border-radius:6px;text-align:center;">
                        <div style="font-size:9px;color:#10b981;font-weight:bold;">END OTP</div>
                        <div style="font-family:monospace;color:#34d399;font-weight:bold;font-size:14px;letter-spacing:1px;">{b.get("end_otp")}</div>
                    </div>
                </div>
            </td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Kaam — Master Platform Control Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #090d16;
            color: #f1f5f9;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }}
        /* Top Navigation */
        .navbar {{
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #1e293b;
            padding: 16px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }}
        .brand {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .brand-logo {{
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #0284c7, #2563eb);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        }}
        .brand-text h1 {{
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #fff;
        }}
        .brand-text p {{
            font-size: 11px;
            color: #38bdf8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }}
        .nav-status {{
            display: flex;
            align-items: center;
            gap: 16px;
        }}
        .status-pill {{
            display: flex;
            align-items: center;
            gap: 8px;
            background: #0f172a;
            border: 1px solid #334155;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            color: #cbd5e1;
        }}
        .status-indicator {{
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.4; transform: scale(1.2); }}
            100% {{ opacity: 1; transform: scale(1); }}
        }}
        .refresh-btn {{
            background: #1e293b;
            border: 1px solid #475569;
            color: #fff;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }}
        .refresh-btn:hover {{
            background: #0284c7;
            border-color: #38bdf8;
        }}

        /* Container */
        .container {{
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
            padding: 28px 24px;
            display: flex;
            flex-direction: column;
            gap: 28px;
        }}

        /* KPI Cards Grid */
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
        }}
        .kpi-card {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 18px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            transition: transform 0.2s, border-color 0.2s;
        }}
        .kpi-card:hover {{
            transform: translateY(-2px);
            border-color: #38bdf8;
        }}
        .kpi-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }}
        .kpi-title {{
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .kpi-icon {{
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }}
        .kpi-value {{
            font-size: 30px;
            font-weight: 800;
            color: #fff;
            line-height: 1;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }}
        .kpi-subtitle {{
            font-size: 11px;
            color: #64748b;
        }}

        /* Section Container */
        .section-card {{
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 25px rgba(0,0,0,0.3);
        }}
        .section-header {{
            padding: 20px 24px;
            border-bottom: 1px solid #1e293b;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 14px;
        }}
        .section-title-wrap {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .section-title {{
            font-size: 16px;
            font-weight: 700;
            color: #fff;
        }}
        .count-badge {{
            background: #1e293b;
            color: #38bdf8;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid #334155;
        }}
        .search-box {{
            background: #090d16;
            border: 1px solid #334155;
            color: #fff;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 13px;
            outline: none;
            width: 260px;
            transition: border-color 0.2s;
        }}
        .search-box:focus {{
            border-color: #38bdf8;
        }}

        /* Table Styling */
        .table-responsive {{
            overflow-x: auto;
            width: 100%;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }}
        th {{
            background: #0b1120;
            padding: 14px 18px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #94a3b8;
            font-weight: 700;
            border-bottom: 1px solid #1e293b;
        }}
        td {{
            padding: 16px 18px;
            border-bottom: 1px solid #1e293b;
            font-size: 13px;
            color: #cbd5e1;
            vertical-align: middle;
        }}
        tr:hover td {{
            background: #131d31;
        }}

        /* Badges */
        .badge {{
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
        }}
        .badge-success {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }}
        .badge-warning {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }}
        .badge-info {{ background: rgba(2, 132, 199, 0.15); color: #38bdf8; border: 1px solid rgba(2, 132, 199, 0.4); }}
        .badge-active {{ background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #059669; }}
        .badge-offline {{ background: #1e293b; color: #94a3b8; border: 1px solid #334155; }}
        .badge-released {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #2563eb; }}

        .skill-tag {{
            background: #1e293b;
            color: #38bdf8;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #334155;
        }}

        /* Tech Footer */
        .footer {{
            margin-top: auto;
            background: #0b1120;
            border-top: 1px solid #1e293b;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            flex-wrap: wrap;
            gap: 12px;
        }}
        .footer a {{
            color: #38bdf8;
            text-decoration: none;
        }}
    </style>
</head>
<body>

    <!-- Top Navigation -->
    <header class="navbar">
        <div class="brand">
            <div class="brand-logo">🛠️</div>
            <div class="brand-text">
                <h1>Digital Kaam — संस्थापक कंट्रोल पैनल</h1>
                <p>Master Platform Operations & Verification Hub</p>
            </div>
        </div>
        <div class="nav-status">
            <div class="status-pill">
                <span class="status-indicator"></span>
                <span>FastAPI Backend <strong>Online (Port 8000)</strong></span>
            </div>
            <div class="status-pill">
                <span>🌐 Google S2 Level 13</span>
            </div>
            <div class="status-pill">
                <span>📁 SQLite: <code>digital_kaam.db</code></span>
            </div>
            <button class="refresh-btn" onclick="location.reload();">
                <span>↻</span> रीफ्रेश करें
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container">

        <!-- Master Neural Brain & 3-Tier Enterprise Server Architecture Live Radar Banner -->
        <div style="background:linear-gradient(135deg, #090e1a, #0f172a);border:1px solid #1e293b;border-radius:20px;padding:22px 26px;box-shadow:0 8px 32px rgba(0,0,0,0.35);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:26px;">👑</span>
                    <div>
                        <h2 style="font-size:16px;font-weight:800;color:#fff;letter-spacing:-0.3px;">Master Neural Orchestrator Brain — Central Resilience & Self-Learning Radar</h2>
                        <p style="font-size:12px;color:#94a3b8;margin-top:2px;">अभेद्य त्रि-स्तरीय ऑटोनॉमस सुरक्षा: Brain 1 (Client) ➔ Brain 2 (Core Dispatch) ➔ Brain 3 (Ledger Vault)</p>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="background:#090d16;border:1px solid #334155;padding:4px 12px;border-radius:20px;font-size:11px;color:#cbd5e1;">
                        <span style="color:#64748b;">सर्किट स्थिति:</span> <strong style="color:{circuit_badge_color};">{circuit_status_text}</strong>
                    </div>
                    <div style="background:#090d16;border:1px solid #334155;padding:4px 12px;border-radius:20px;font-size:11px;color:#cbd5e1;">
                        <span style="color:#64748b;">सेल्फ-लर्निंग गति:</span> <strong style="color:#38bdf8;">{master_tel["self_training_parameters"]["calibrated_urban_speed_kmh"]} km/h ({master_tel["self_training_parameters"]["total_learned_trips"]} ट्रिप्स)</strong>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="width:10px;height:10px;background:#10b981;border-radius:50%;box-shadow:0 0 10px #10b981;display:inline-block;"></span>
                        <span style="font-size:11px;font-weight:700;color:#34d399;background:rgba(16,185,129,0.15);padding:4px 10px;border-radius:20px;border:1px solid rgba(16,185,129,0.3);">MASTER + 3 BRAINS ACTIVE</span>
                    </div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
                <!-- Layer 1: Presentation Tier -->
                <div style="background:#090d16;border:1px solid #334155;border-radius:14px;padding:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">TIER 1: PRESENTATION LAYER</span>
                        <span style="font-size:10px;background:rgba(56,189,248,0.2);color:#38bdf8;padding:2px 8px;border-radius:6px;font-weight:700;">UI & CLIENTS</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">Flutter Native + React Vite Web</div>
                    <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
                        • <strong>Clients:</strong> Android APK, iOS, Windows Native & Web<br>
                        • <strong>Security:</strong> Client-Side Sanitization, Biometric Face Guide<br>
                        • <strong>Access:</strong> Zero Direct DB Access (Restricted via REST APIs)
                    </div>
                </div>

                <!-- Layer 2: Application Tier -->
                <div style="background:#090d16;border:1px solid #334155;border-radius:14px;padding:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:11px;font-weight:800;color:#a855f7;text-transform:uppercase;letter-spacing:0.5px;">TIER 2: APPLICATION LAYER</span>
                        <span style="font-size:10px;background:rgba(168,85,247,0.2);color:#c084fc;padding:2px 8px;border-radius:6px;font-weight:700;">SMART BRAIN</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">FastAPI + S2 Radar + Escrow Engine</div>
                    <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
                        • <strong>Shield:</strong> Anti-SQLi & XSS Regex Filter, Sliding-Window Rate Limit<br>
                        • <strong>Intelligence:</strong> Google S2 L13 Radar, Live Aadhaar OCR, Dual OTP<br>
                        • <strong>Auth:</strong> JWT Bearer HS256 Authentication Guard
                    </div>
                </div>

                <!-- Layer 3: Data Tier -->
                <div style="background:#090d16;border:1px solid #334155;border-radius:14px;padding:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:11px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:0.5px;">TIER 3: DATA & PERSISTENCE</span>
                        <span style="font-size:10px;background:rgba(16,185,129,0.2);color:#34d399;padding:2px 8px;border-radius:6px;font-weight:700;">IMMUTABLE</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">SQLite (digital_kaam.db) / Cloud Postgres</div>
                    <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
                        • <strong>Tables:</strong> workers, bookings, posted_jobs, escrow_transactions<br>
                        • <strong>Ledger:</strong> Cryptographic SHA-256 Hash Chain (Tamper-Proof)<br>
                        • <strong>Portability:</strong> 100% Offline SQLite + Render/PostgreSQL Ready
                    </div>
                </div>

                <!-- Tri-Layer In-Memory Redis Engine -->
                <div style="background:#090d16;border:1px solid #dc2626;border-radius:14px;padding:16px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="font-size:11px;font-weight:800;color:#f87171;text-transform:uppercase;letter-spacing:0.5px;">TRI-LAYER REDIS ENGINE</span>
                        <span style="font-size:10px;background:rgba(239,68,68,0.2);color:#f87171;padding:2px 8px;border-radius:6px;font-weight:700;">&lt; 0.5ms SPEED</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">In-Memory Sharded Cache & Mutex</div>
                    <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
                        • <strong>L1 Edge:</strong> Live Worker Heartbeat & Profile Cards<br>
                        • <strong>L2 Radar:</strong> Sub-ms Dual-OTP & S2 Proximity Cache<br>
                        • <strong>L3 Locks:</strong> Distributed Mutex (Zero Double-Booking)
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Metrics Grid -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">कुल पंजीकृत कारीगर</span>
                    <div class="kpi-icon" style="background:rgba(56, 189, 248, 0.15);color:#38bdf8;">👷</div>
                </div>
                <div class="kpi-value">{kpis["total_workers"]}</div>
                <div class="kpi-subtitle">✓ {kpis["verified_workers"]} आधार व फेस सत्यापित कारीगर</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">सक्रिय बुकिंग्स व काम</span>
                    <div class="kpi-icon" style="background:rgba(16, 185, 129, 0.15);color:#10b981;">⚡</div>
                </div>
                <div class="kpi-value">{kpis["active_bookings"]}</div>
                <div class="kpi-subtitle">कुल संपन्न बुकिंग्स: {kpis["total_bookings"]}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">एस्क्रो में सुरक्षित राशि</span>
                    <div class="kpi-icon" style="background:rgba(245, 158, 11, 0.15);color:#f59e0b;">🔒</div>
                </div>
                <div class="kpi-value" style="color:#fbbf24;">₹{kpis["escrow_locked_amount"]}</div>
                <div class="kpi-subtitle">ग्राहक द्वारा भुगतान किया गया, काम पूरा होने तक सुरक्षित</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">प्लेटफॉर्म कमीशन आय</span>
                    <div class="kpi-icon" style="background:rgba(168, 85, 247, 0.15);color:#c084fc;">📈</div>
                </div>
                <div class="kpi-value" style="color:#c084fc;">₹{kpis["platform_commission_earned"]}</div>
                <div class="kpi-subtitle">सफल राजस्व पर 10% शुद्ध कमाई</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">सुरक्षित लॉगआउट खाते</span>
                    <div class="kpi-icon" style="background:rgba(59, 130, 246, 0.15);color:#60a5fa;">💾</div>
                </div>
                <div class="kpi-value" style="color:#60a5fa;">{len(logged_out_accounts)}</div>
                <div class="kpi-subtitle">पंजीकृत व लॉगआउट डेटा सुरक्षित आर्काइव</div>
            </div>
        </div>

        <!-- Section 1: Live Bookings & Real-Time Tracking Radar -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title-wrap">
                    <span style="font-size:20px;">🛵</span>
                    <h2 class="section-title">लाइव बुकिंग्स व रियल-टाइम ट्रैकिंग रडार</h2>
                    <span class="count-badge">{len(bookings)} सक्रिय ऑर्डर्स</span>
                </div>
                <input type="text" class="search-box" id="bookingSearch" placeholder="बुकिंग ID या ग्राहक खोजें..." onkeyup="filterTable('bookingSearch', 'bookingsTable')">
            </div>
            <div class="table-responsive">
                <table id="bookingsTable">
                    <thead>
                        <tr>
                            <th>बुकिंग ID</th>
                            <th>ग्राहक का विवरण</th>
                            <th>कारीगर व सेवा</th>
                            <th>विजिट फीस</th>
                            <th>एस्क्रो स्टेटस</th>
                            <th>लाइव ट्रैकिंग स्थिति</th>
                            <th>दूरी व ETA</th>
                            <th>हैंडशेक Dual-OTP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {booking_rows if booking_rows else '<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">फिलहाल कोई सक्रिय बुकिंग नहीं है</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section 2: Verified Workers Directory -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title-wrap">
                    <span style="font-size:20px;">📋</span>
                    <h2 class="section-title">पंजीकृत कारीगरों की पूरी डायरेक्टरी (Verified Workers)</h2>
                    <span class="count-badge">{len(workers)} कारीगर</span>
                </div>
                <input type="text" class="search-box" id="workerSearch" placeholder="नाम, हुनर, या फोन नंबर खोजें..." onkeyup="filterTable('workerSearch', 'workersTable')">
            </div>
            <div class="table-responsive">
                <table id="workersTable">
                    <thead>
                        <tr>
                            <th>कारीगर ID</th>
                            <th>नाम व मोबाइल</th>
                            <th>हुनर (Skill)</th>
                            <th>केवाईसी स्टेटस</th>
                            <th>विजिट फीस</th>
                            <th>रेटिंग व कार्य</th>
                            <th>S2 सेल टोकन</th>
                            <th>बैंक व भुगतान विवरण</th>
                            <th>उपलब्धता</th>
                            <th>कार्रवाई (Action)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {worker_rows if worker_rows else '<tr><td colspan="10" style="text-align:center;padding:24px;color:#64748b;">कोई कारीगर डेटाबेस में नहीं मिला</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section 3: Registered & Logged-Out Accounts Archive -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title-wrap">
                    <span style="font-size:20px;">💾</span>
                    <h2 class="section-title">पंजीकृत एवं लॉगआउट उपयोगकर्ता आर्काइव (Registered & Logged-Out Accounts)</h2>
                    <span class="count-badge" style="background:rgba(59, 130, 246, 0.2);color:#60a5fa;border:1px solid #3b82f6;">{len(logged_out_accounts)} सुरक्षित खाते</span>
                </div>
                <input type="text" class="search-box" id="logoutSearch" placeholder="अकाउंट ID, नाम या फोन खोजें..." onkeyup="filterTable('logoutSearch', 'logoutTable')">
            </div>
            <div class="table-responsive">
                <table id="logoutTable">
                    <thead>
                        <tr>
                            <th>अकाउंट ID</th>
                            <th>रोल (Role)</th>
                            <th>नाम व मोबाइल</th>
                            <th>हुनर / विवरण</th>
                            <th>सत्यापित पता</th>
                            <th>विजिट फीस</th>
                            <th>रेटिंग व कार्य</th>
                            <th>लॉगआउट समय</th>
                            <th>आर्काइव स्थिति</th>
                            <th>कार्रवाई (Action)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logged_out_rows if logged_out_rows else '<tr><td colspan="10" style="text-align:center;padding:24px;color:#64748b;">कोई लॉगआउट खाता नहीं है (सभी डेटा सुरक्षित हैं)</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section 4: Cryptographic Escrow Transactions Ledger (SHA-256) -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title-wrap">
                    <span style="font-size:20px;">🔒</span>
                    <h2 class="section-title">क्रिप्टोग्राफिक एस्क्रो लेज़र बहीखाता (SHA-256 Hash-Chained Escrow Ledger)</h2>
                    <span class="count-badge" style="background:rgba(16, 185, 129, 0.2);color:#10b981;border:1px solid #10b981;">{len(escrow_txs)} लेन-देन</span>
                </div>
                <input type="text" class="search-box" id="escrowSearch" placeholder="ट्रांजेक्शन ID या बुकिंग खोजें..." onkeyup="filterTable('escrowSearch', 'escrowTable')">
            </div>
            <div class="table-responsive">
                <table id="escrowTable">
                    <thead>
                        <tr>
                            <th>ट्रांजेक्शन ID</th>
                            <th>बुकिंग ID</th>
                            <th>प्रकार (Event)</th>
                            <th>राशि (₹)</th>
                            <th>10% प्लेटफॉर्म कमीशन</th>
                            <th>Previous Hash (SHA-256)</th>
                            <th>Current Hash (SHA-256)</th>
                            <th>समय व दिनांक</th>
                        </tr>
                    </thead>
                    <tbody>
                        {escrow_rows if escrow_rows else '<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">फिलहाल कोई एस्क्रो ट्रांजेक्शन दर्ज नहीं है</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section 5: Portability & Server Information -->
        <div class="section-card" style="padding:22px;">
            <h3 style="color:#38bdf8;font-size:15px;margin-bottom:12px;font-weight:700;">🚀 क्लाउड व मोबाइल सर्वर (Termux) पोर्टेबिलिटी स्टेटस</h3>
            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:16px;">
                यह प्लेटफॉर्म पूरी तरह <strong>पोर्टेबल (Portable Architecture)</strong> पर तैयार है। सारा डेटा <code>backend/digital_kaam.db</code> में सुरक्षित सेव हो रहा है। 
                आप इसे बिना किसी डेटा नुकसान के <strong>Render.com</strong> पर 24 घंटे ऑनलाइन चला सकते हैं या बाद में अपने पुराने <strong>Android फोन (Termux)</strong> पर केवल 1 कमांड में माइग्रेट कर सकते हैं।
            </p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <div style="background:#090d16;border:1px solid #334155;padding:12px 16px;border-radius:12px;font-size:12px;">
                    <span style="color:#64748b;">SQLite फाइल:</span> <strong style="color:#fff;">backend/digital_kaam.db</strong>
                </div>
                <div style="background:#090d16;border:1px solid #334155;padding:12px 16px;border-radius:12px;font-size:12px;">
                    <span style="color:#64748b;">क्लाउड मेनिफेस्ट:</span> <strong style="color:#34d399;">render.yaml & Procfile Ready</strong>
                </div>
                <div style="background:#090d16;border:1px solid #334155;padding:12px 16px;border-radius:12px;font-size:12px;">
                    <span style="color:#64748b;">रडार इंडेक्स:</span> <strong style="color:#38bdf8;">Google S2 Sphere 64-bit Hierarchical</strong>
                </div>
            </div>
        </div>

    </main>

    <!-- Footer -->
    <footer class="footer">
        <div>© 2026 <strong>Digital Kaam Platform</strong> — आत्मनिर्भर कारीगर व ग्राहक सुरक्षा तंत्र।</div>
        <div>
            API Docs: <a href="/docs" target="_blank">FastAPI Interactive Swagger (/docs)</a> | 
            Redoc: <a href="/redoc" target="_blank">(/redoc)</a>
        </div>
    </footer>

    <script>
        function filterTable(inputId, tableId) {{
            var input = document.getElementById(inputId);
            var filter = input.value.toLowerCase();
            var table = document.getElementById(tableId);
            var tr = table.getElementsByTagName("tr");

            for (var i = 1; i < tr.length; i++) {{
                var text = tr[i].textContent || tr[i].innerText;
                if (text.toLowerCase().indexOf(filter) > -1) {{
                    tr[i].style.display = "";
                }} else {{
                    tr[i].style.display = "none";
                }}
            }}
        }}

        async function deleteWorker(workerId, workerName) {{
            if (!confirm('क्या आप सचमुच कारीगर "' + workerName + '" (ID: ' + workerId + ') का खाता डिजिटल काम से हमेशा के लिए डिलीट करना चाहते हैं?')) {{
                return;
            }}
            try {{
                const res = await fetch('/api/admin/workers/' + encodeURIComponent(workerId) + '/delete', {{
                    method: 'POST'
                }});
                const data = await res.json();
                if (data.status === 'success') {{
                    const row = document.getElementById('worker-row-' + workerId);
                    if (row) {{
                        row.style.transition = 'opacity 0.3s';
                        row.style.opacity = '0';
                        setTimeout(function() {{ row.remove(); }}, 300);
                    }}
                    alert('✓ कारीगर "' + workerName + '" का खाता सफलतापूर्वक डिलीट कर दिया गया है।');
                }} else {{
                    alert('डिलीट करने में त्रुटि: ' + (data.message || 'Unknown error'));
                }}
            }} catch (err) {{
                alert('सर्वर से संपर्क करने में त्रुटि: ' + err.message);
            }}
        }}

        async function deleteAccount(accountId, accountName) {{
            if (!confirm('क्या आप आर्काइव खाता "' + accountName + '" (ID: ' + accountId + ') हटाना चाहते हैं?')) {{
                return;
            }}
            try {{
                const res = await fetch('/api/admin/accounts/' + encodeURIComponent(accountId) + '/delete', {{
                    method: 'POST'
                }});
                const data = await res.json();
                if (data.status === 'success') {{
                    const row = document.getElementById('account-row-' + accountId);
                    if (row) {{
                        row.style.transition = 'opacity 0.3s';
                        row.style.opacity = '0';
                        setTimeout(function() {{ row.remove(); }}, 300);
                    }}
                    alert('✓ आर्काइव खाता सफलतापूर्वक हटा दिया गया है।');
                }} else {{
                    alert('त्रुटि: ' + (data.message || 'Unknown error'));
                }}
            }} catch (err) {{
                alert('सर्वर त्रुटि: ' + err.message);
            }}
        }}

        // Auto-refresh data every 60 seconds
        setTimeout(function() {{
            location.reload();
        }}, 60000);
    </script>
</body>
</html>
"""
    return html
