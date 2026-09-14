"""
Digital Kaam — Production SaaS Admin Console
=============================================
A modern, dark-mode, responsive Web Admin Console for the platform founder.
Allows managing workers, customer posted jobs, live bookings, OTPs, and escrow ledger.
Features instant worker/job deletion, live search, tabbed navigation, and KPI telemetry.
"""

from fastapi.responses import HTMLResponse
import database
import time
from typing import List, Dict, Any

def get_admin_dashboard_html() -> str:
    workers = database.get_all_workers()
    bookings = database.get_all_bookings()
    posted_jobs = database.get_all_posted_jobs()
    kpis = database.get_platform_kpis()
    logged_out_accounts = database.get_all_logged_out_accounts()
    escrow_txs = database.get_all_escrow_transactions()

    # Worker Rows
    worker_rows = ""
    for w in workers:
        wid = w.get("worker_id") or ""
        wname = (w.get("name") or "Worker").replace("'", "\\'")
        photo = w.get("photo_url")
        photo_html = f'<img src="{photo}" class="avatar" alt="{wname}">' if photo else '<div class="avatar-placeholder">👷</div>'
        verified_badge = '<span class="badge badge-success">✓ सत्यापित</span>' if w.get("is_verified") else '<span class="badge badge-warning">लंबित</span>'
        status_badge = '<span class="badge badge-active">🟢 ऑनलाइन</span>' if w.get("is_available") else '<span class="badge badge-offline">ऑफ़लाइन</span>'
        fee = w.get("visiting_fee", 299)
        rating = w.get("rating", 4.9)
        jobs = w.get("total_jobs", 12)
        addr = w.get("address") or "स्थान दर्ज नहीं"

        worker_rows += f"""
        <tr id="worker-row-{wid}" class="data-row">
            <td class="mono font-bold text-sky">{wid}</td>
            <td>
                <div class="user-cell">
                    {photo_html}
                    <div>
                        <div class="user-name">{w.get("name")}</div>
                        <div class="user-sub"><a href="tel:{w.get("phone")}" class="phone-link">📞 {w.get("phone")}</a></div>
                    </div>
                </div>
            </td>
            <td><span class="skill-pill">{w.get("skill")}</span></td>
            <td>{verified_badge}</td>
            <td class="font-bold text-emerald">₹{fee}</td>
            <td><span class="text-amber font-bold">★ {rating}</span> <span class="text-muted">({jobs})</span></td>
            <td class="text-sub text-truncate" title="{addr}">📍 {addr}</td>
            <td>{status_badge}</td>
            <td>
                <button onclick="deleteWorker('{wid}', '{wname}')" class="btn-delete" title="कारीगर खाता हमेशा के लिए डिलीट करें">
                    🗑️ डिलीट
                </button>
            </td>
        </tr>
        """

    # Posted Jobs Rows
    job_rows = ""
    for j in posted_jobs:
        jid = j.get("id") or j.get("job_id") or ""
        jtitle = (j.get("title") or "काम").replace("'", "\\'")
        cname = j.get("customerName") or j.get("customer_name") or "ग्राहक"
        cphone = j.get("customerPhone") or j.get("customer_phone") or ""
        budget = j.get("budget", 500)
        cat = j.get("category") or "सामान्य"
        status = j.get("status") or "OPEN"
        status_badge = '<span class="badge badge-success">खुला है (OPEN)</span>' if status == "OPEN" else f'<span class="badge badge-info">{status}</span>'
        posted_time = j.get("postedAt") or "हाल ही में"
        addr = j.get("customerAddress") or j.get("customer_address") or "स्थान उपलब्ध नहीं"

        job_rows += f"""
        <tr id="job-row-{jid}" class="data-row">
            <td class="mono font-bold text-sky">{jid}</td>
            <td>
                <div class="font-bold text-white">{j.get("title")}</div>
                <div class="text-muted text-xs">{j.get("description") or ''}</div>
            </td>
            <td>
                <div class="text-white font-medium">{cname}</div>
                <div class="text-muted text-xs">{cphone}</div>
            </td>
            <td><span class="skill-pill">{cat}</span></td>
            <td class="font-bold text-emerald">₹{budget}</td>
            <td class="text-sub text-truncate" title="{addr}">📍 {addr}</td>
            <td>{status_badge}</td>
            <td class="text-muted text-xs">{posted_time}</td>
            <td>
                <button onclick="deleteJob('{jid}', '{jtitle}')" class="btn-delete" title="यह काम हटाएं">
                    🗑️ हटाएं
                </button>
            </td>
        </tr>
        """

    # Bookings Rows
    booking_rows = ""
    for b in bookings:
        bid = b.get("booking_id") or ""
        status = b.get("tracking_status", "ON_THE_WAY")
        if status == "ON_THE_WAY":
            st_html = '<span class="badge badge-info">🛵 रास्ते में है</span>'
        elif status == "REACHED":
            st_html = '<span class="badge badge-warning">📍 द्वार पर पहुंचा</span>'
        elif status == "STARTED":
            st_html = '<span class="badge badge-active">⚙️ काम चालू है</span>'
        elif status == "COMPLETED":
            st_html = '<span class="badge badge-success">✓ संपन्न</span>'
        else:
            st_html = f'<span class="badge badge-secondary">{status}</span>'

        escrow_badge = '<span class="badge badge-success">🔒 सुरक्षित</span>' if b.get("escrow_status") == "LOCKED" else '<span class="badge badge-info">✓ ट्रांसफर्ड</span>'

        booking_rows += f"""
        <tr class="data-row">
            <td class="mono font-bold text-sky">{bid}</td>
            <td>
                <div class="font-bold text-white">{b.get("customer_name")}</div>
                <div class="text-muted text-xs">{b.get("customer_phone")}</div>
            </td>
            <td>
                <div class="font-bold text-white">{b.get("worker_name", b.get("worker_id"))}</div>
                <div class="text-sky text-xs">{b.get("service_name")}</div>
            </td>
            <td class="font-bold text-emerald">₹{b.get("visiting_fee")}</td>
            <td>{escrow_badge}</td>
            <td>{st_html}</td>
            <td>
                <div class="otp-box-wrap">
                    <div class="otp-pill otp-start">
                        <span class="otp-lbl">START</span>
                        <span class="otp-val">{b.get("start_otp")}</span>
                    </div>
                    <div class="otp-pill otp-end">
                        <span class="otp-lbl">END</span>
                        <span class="otp-val">{b.get("end_otp")}</span>
                    </div>
                </div>
            </td>
        </tr>
        """

    # Escrow Rows
    escrow_rows = ""
    for tx in escrow_txs:
        t_type = tx.get("tx_type", "HOLD")
        if "HOLD" in t_type:
            type_badge = '<span class="badge badge-warning">🔒 एस्क्रो जमा (HOLD)</span>'
        elif "RELEASE" in t_type:
            type_badge = '<span class="badge badge-success">✓ पेआउट रिलीज</span>'
        elif "REFUND" in t_type:
            type_badge = '<span class="badge badge-danger">↩ 100% रिफंड</span>'
        else:
            type_badge = f'<span class="badge badge-secondary">{t_type}</span>'

        date_str = time.strftime("%d %b %Y, %I:%M %p", time.localtime(tx.get("created_at", time.time())))
        short_curr = (tx.get("curr_hash") or "")[:12] + "..."
        short_prev = (tx.get("prev_hash") or "")[:12] + "..." if tx.get("prev_hash") != "GENESIS" else "GENESIS"

        escrow_rows += f"""
        <tr class="data-row">
            <td class="mono font-bold text-sky">{tx.get("tx_id")}</td>
            <td class="mono text-muted">{tx.get("booking_id")}</td>
            <td>{type_badge}</td>
            <td class="font-bold text-emerald">₹{tx.get("amount")}</td>
            <td class="font-bold text-purple">₹{tx.get("fee", 0.0)}</td>
            <td><code class="hash-code">{short_prev}</code></td>
            <td><code class="hash-code hash-curr">{short_curr}</code></td>
            <td class="text-muted text-xs">{date_str}</td>
        </tr>
        """

    # Archive Rows
    archive_rows = ""
    for a in logged_out_accounts:
        aid = a.get("account_id") or ""
        aname = (a.get("name") or "User").replace("'", "\\'")
        role = a.get("role", "WORKER")
        role_badge = '<span class="badge badge-info">👷 कारीगर</span>' if role == "WORKER" else '<span class="badge badge-purple">🛒 ग्राहक</span>'

        archive_rows += f"""
        <tr id="account-row-{aid}" class="data-row">
            <td class="mono font-bold text-muted">{aid}</td>
            <td>{role_badge}</td>
            <td>
                <div class="font-bold text-white">{a.get("name")}</div>
                <div class="text-muted text-xs">{a.get("phone")}</div>
            </td>
            <td><span class="skill-pill">{a.get("skill") or 'N/A'}</span></td>
            <td class="text-sub text-truncate" title="{a.get('address') or ''}">📍 {a.get("address") or 'N/A'}</td>
            <td class="font-bold text-emerald">₹{a.get("visiting_fee", 350)}</td>
            <td class="text-muted text-xs">{a.get("logout_time") or 'हाल ही में'}</td>
            <td>
                <button onclick="deleteAccount('{aid}', '{aname}')" class="btn-delete" title="आर्काइव से हटाएं">
                    🗑️ हटाएं
                </button>
            </td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Kaam — Admin Console</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-body: #090d16;
            --bg-card: #0f172a;
            --bg-card-hover: #131d34;
            --border: #1e293b;
            --border-hover: #334155;
            --primary: #0284c7;
            --primary-light: #38bdf8;
            --accent: #6366f1;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --danger-hover: #dc2626;
            --text-main: #f8fafc;
            --text-sub: #cbd5e1;
            --text-muted: #64748b;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.5;
        }}

        /* Navbar */
        .navbar {{
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            padding: 14px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 50;
        }}
        .brand {{
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
        }}
        .brand-logo {{
            width: 42px;
            height: 42px;
            background: linear-gradient(135deg, #0284c7, #2563eb);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        }}
        .brand-title {{
            font-size: 18px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.3px;
        }}
        .brand-subtitle {{
            font-size: 11px;
            color: var(--primary-light);
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
        }}
        .nav-actions {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .status-pill {{
            display: flex;
            align-items: center;
            gap: 8px;
            background: #090d16;
            border: 1px solid var(--border);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            color: var(--text-sub);
        }}
        .status-dot {{
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--success);
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; transform: scale(1); }}
            50% {{ opacity: 0.4; transform: scale(1.2); }}
        }}
        .btn {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            border: none;
        }}
        .btn-outline {{
            background: transparent;
            border: 1px solid var(--border-hover);
            color: var(--text-sub);
        }}
        .btn-outline:hover {{
            background: var(--border);
            color: #fff;
        }}
        .btn-primary {{
            background: linear-gradient(135deg, #0284c7, #2563eb);
            color: #fff;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }}
        .btn-primary:hover {{
            opacity: 0.9;
            transform: translateY(-1px);
        }}

        /* Container */
        .container {{
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
            padding: 24px 28px;
            flex: 1;
        }}

        /* KPI Cards Grid */
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .kpi-card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s, border-color 0.2s;
        }}
        .kpi-card:hover {{
            transform: translateY(-2px);
            border-color: var(--border-hover);
        }}
        .kpi-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }}
        .kpi-title {{
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 700;
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
            font-size: 28px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
            line-height: 1.1;
            margin-bottom: 4px;
        }}
        .kpi-sub {{
            font-size: 12px;
            color: var(--text-sub);
        }}

        /* Tabs Navigation */
        .tabs-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }}
        .tabs-nav {{
            display: flex;
            gap: 8px;
            background: #070a12;
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--border);
            overflow-x: auto;
        }}
        .tab-btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: var(--text-sub);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }}
        .tab-btn:hover {{
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }}
        .tab-btn.active {{
            background: linear-gradient(135deg, #0284c7, #2563eb);
            color: #fff;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }}
        .tab-count {{
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 7px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
        }}

        /* Search Bar */
        .search-box {{
            position: relative;
            min-width: 260px;
        }}
        .search-input {{
            width: 100%;
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: #fff;
            padding: 10px 14px 10px 38px;
            border-radius: 10px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }}
        .search-input:focus {{
            border-color: var(--primary-light);
        }}
        .search-icon {{
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 14px;
            pointer-events: none;
        }}

        /* Content Card / Table */
        .card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }}
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
            background: #090d16;
            padding: 14px 18px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: var(--text-muted);
            font-weight: 700;
            border-bottom: 1px solid var(--border);
            white-space: nowrap;
        }}
        td {{
            padding: 16px 18px;
            border-bottom: 1px solid var(--border);
            font-size: 13px;
            color: var(--text-sub);
            vertical-align: middle;
        }}
        tr:hover td {{
            background: var(--bg-card-hover);
        }}
        .empty-row td {{
            text-align: center;
            padding: 40px 20px;
            color: var(--text-muted);
            font-size: 14px;
        }}

        /* Cells & Badges */
        .user-cell {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .avatar {{
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--primary-light);
        }}
        .avatar-placeholder {{
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #1e293b;
            border: 2px solid #334155;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }}
        .user-name {{
            font-weight: 700;
            color: #fff;
            font-size: 14px;
        }}
        .user-sub {{
            font-size: 12px;
            color: var(--text-muted);
        }}
        .phone-link {{
            color: var(--primary-light);
            text-decoration: none;
        }}
        .phone-link:hover {{
            text-decoration: underline;
        }}
        .skill-pill {{
            background: #1e293b;
            color: var(--primary-light);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #334155;
            display: inline-block;
        }}
        .badge {{
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
            white-space: nowrap;
        }}
        .badge-success {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }}
        .badge-warning {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }}
        .badge-info {{ background: rgba(2, 132, 199, 0.15); color: #38bdf8; border: 1px solid rgba(2, 132, 199, 0.4); }}
        .badge-purple {{ background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }}
        .badge-active {{ background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #059669; }}
        .badge-offline {{ background: #1e293b; color: #94a3b8; border: 1px solid #334155; }}
        .badge-danger {{ background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }}
        
        .mono {{ font-family: 'JetBrains Mono', monospace; font-size: 12px; }}
        .font-bold {{ font-weight: 700; }}
        .font-medium {{ font-weight: 500; }}
        .text-white {{ color: #fff; }}
        .text-sky {{ color: #38bdf8; }}
        .text-emerald {{ color: #10b981; }}
        .text-amber {{ color: #fbbf24; }}
        .text-purple {{ color: #c084fc; }}
        .text-muted {{ color: #64748b; }}
        .text-sub {{ color: #cbd5e1; font-size: 12px; }}
        .text-xs {{ font-size: 11px; }}
        .text-truncate {{
            max-width: 220px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}

        /* Action Buttons */
        .btn-delete {{
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }}
        .btn-delete:hover {{
            background: var(--danger);
            color: #fff;
            border-color: var(--danger);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
            transform: scale(1.02);
        }}

        /* OTP Displays */
        .otp-box-wrap {{
            display: flex;
            gap: 8px;
        }}
        .otp-pill {{
            background: #090d16;
            border-radius: 6px;
            padding: 4px 8px;
            text-align: center;
            min-width: 60px;
        }}
        .otp-start {{ border: 1px solid #f59e0b; }}
        .otp-end {{ border: 1px solid #10b981; }}
        .otp-lbl {{
            display: block;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }}
        .otp-start .otp-lbl {{ color: #f59e0b; }}
        .otp-end .otp-lbl {{ color: #10b981; }}
        .otp-val {{
            font-family: 'JetBrains Mono', monospace;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 1px;
        }}
        .otp-start .otp-val {{ color: #fbbf24; }}
        .otp-end .otp-val {{ color: #34d399; }}

        .hash-code {{
            background: #090d16;
            padding: 3px 6px;
            border-radius: 4px;
            color: #94a3b8;
            font-size: 11px;
            font-family: 'JetBrains Mono', monospace;
        }}
        .hash-curr {{ color: #34d399; }}

        /* Toast Notifications */
        .toast-container {{
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}
        .toast {{
            background: #0f172a;
            border: 1px solid var(--border);
            padding: 12px 18px;
            border-radius: 10px;
            color: #fff;
            font-size: 13px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideUp 0.3s ease;
        }}
        .toast-success {{ border-left: 4px solid var(--success); }}
        .toast-error {{ border-left: 4px solid var(--danger); }}
        @keyframes slideUp {{
            from {{ transform: translateY(20px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}

        /* Footer */
        .footer {{
            margin-top: auto;
            background: #090d16;
            border-top: 1px solid var(--border);
            padding: 18px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: var(--text-muted);
            flex-wrap: wrap;
            gap: 12px;
        }}
        .footer a {{
            color: var(--primary-light);
            text-decoration: none;
        }}
        .footer a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>

    <!-- Navigation Header -->
    <header class="navbar">
        <a href="/admin" class="brand">
            <div class="brand-logo">🛠️</div>
            <div>
                <div class="brand-title">Digital Kaam</div>
                <div class="brand-subtitle">Founder Admin Console</div>
            </div>
        </a>
        <div class="nav-actions">
            <div class="status-pill">
                <span class="status-dot"></span>
                <span>FastAPI Cloud Live</span>
            </div>
            <a href="/docs" target="_blank" class="btn btn-outline" title="Interactive API Documentation">
                📄 API Docs
            </a>
            <button onclick="location.reload()" class="btn btn-primary" title="रिफ्रेश करें">
                ↻ रीफ्रेश
            </button>
        </div>
    </header>

    <main class="container">

        <!-- Top KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">कुल पंजीकृत कारीगर</span>
                    <div class="kpi-icon" style="background:rgba(56, 189, 248, 0.15);color:#38bdf8;">👷</div>
                </div>
                <div class="kpi-value" id="kpi-workers">{len(workers)}</div>
                <div class="kpi-sub">✓ {kpis.get("verified_workers", len(workers))} आधार व फेस सत्यापित</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">ग्राहकों के पोस्टेड काम</span>
                    <div class="kpi-icon" style="background:rgba(168, 85, 247, 0.15);color:#c084fc;">📢</div>
                </div>
                <div class="kpi-value" id="kpi-jobs">{len(posted_jobs)}</div>
                <div class="kpi-sub">लाइव कस्टमर जॉब्स फीड</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">सक्रिय बुकिंग्स</span>
                    <div class="kpi-icon" style="background:rgba(16, 185, 129, 0.15);color:#10b981;">🛵</div>
                </div>
                <div class="kpi-value">{kpis.get("active_bookings", len(bookings))}</div>
                <div class="kpi-sub">कुल बुकिंग्स: {kpis.get("total_bookings", len(bookings))}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">एस्क्रो सुरक्षित फंड्स</span>
                    <div class="kpi-icon" style="background:rgba(245, 158, 11, 0.15);color:#f59e0b;">🔒</div>
                </div>
                <div class="kpi-value" style="color:#fbbf24;">₹{kpis.get("escrow_locked_amount", 0)}</div>
                <div class="kpi-sub">काम पूरा होने तक सुरक्षित लॉक</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-header">
                    <span class="kpi-title">प्लेटफॉर्म कमीशन</span>
                    <div class="kpi-icon" style="background:rgba(59, 130, 246, 0.15);color:#60a5fa;">💰</div>
                </div>
                <div class="kpi-value" style="color:#60a5fa;">₹{kpis.get("platform_commission_earned", 0)}</div>
                <div class="kpi-sub">10% सफल राजस्व कमीशन</div>
            </div>
        </div>

        <!-- Tabs Header & Search -->
        <div class="tabs-header">
            <div class="tabs-nav">
                <button class="tab-btn active" onclick="switchTab('workersTab', this)">
                    <span>👷 कारीगर सूची</span>
                    <span class="tab-count" id="tab-count-workers">{len(workers)}</span>
                </button>
                <button class="tab-btn" onclick="switchTab('jobsTab', this)">
                    <span>📢 पोस्ट किए गए काम</span>
                    <span class="tab-count" id="tab-count-jobs">{len(posted_jobs)}</span>
                </button>
                <button class="tab-btn" onclick="switchTab('bookingsTab', this)">
                    <span>🛵 लाइव बुकिंग्स & OTP</span>
                    <span class="tab-count">{len(bookings)}</span>
                </button>
                <button class="tab-btn" onclick="switchTab('escrowTab', this)">
                    <span>🔒 एस्क्रो लेज़र</span>
                    <span class="tab-count">{len(escrow_txs)}</span>
                </button>
                <button class="tab-btn" onclick="switchTab('archiveTab', this)">
                    <span>💾 आर्काइव खाते</span>
                    <span class="tab-count" id="tab-count-archive">{len(logged_out_accounts)}</span>
                </button>
            </div>

            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="globalSearch" class="search-input" placeholder="नाम, फोन, हुनर, या ID खोजें..." onkeyup="filterActiveTab()">
            </div>
        </div>

        <!-- Tab 1: Workers Management -->
        <div id="workersTab" class="tab-pane">
            <div class="card">
                <div class="table-responsive">
                    <table id="workersTable">
                        <thead>
                            <tr>
                                <th>कारीगर ID</th>
                                <th>नाम व मोबाइल</th>
                                <th>हुनर (Skill)</th>
                                <th>केवाईसी स्थिति</th>
                                <th>विजिट चार्ज</th>
                                <th>रेटिंग (कार्य)</th>
                                <th>पता / स्थान</th>
                                <th>उपलब्धता</th>
                                <th>कार्रवाई</th>
                            </tr>
                        </thead>
                        <tbody>
                            {worker_rows if worker_rows else '<tr class="empty-row"><td colspan="9">डेटाबेस में कोई कारीगर नहीं मिला</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 2: Customer Posted Jobs -->
        <div id="jobsTab" class="tab-pane" style="display:none;">
            <div class="card">
                <div class="table-responsive">
                    <table id="jobsTable">
                        <thead>
                            <tr>
                                <th>जॉब ID</th>
                                <th>काम का शीर्षक</th>
                                <th>ग्राहक का नाम व फोन</th>
                                <th>कैटेगरी</th>
                                <th>बजट</th>
                                <th>कस्टमर का पता</th>
                                <th>स्टेटस</th>
                                <th>पोस्ट का समय</th>
                                <th>कार्रवाई</th>
                            </tr>
                        </thead>
                        <tbody>
                            {job_rows if job_rows else '<tr class="empty-row"><td colspan="9">फिलहाल कोई काम पोस्ट नहीं किया गया है</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 3: Live Bookings & Dual OTP -->
        <div id="bookingsTab" class="tab-pane" style="display:none;">
            <div class="card">
                <div class="table-responsive">
                    <table id="bookingsTable">
                        <thead>
                            <tr>
                                <th>बुकिंग ID</th>
                                <th>ग्राहक का विवरण</th>
                                <th>कारीगर व सेवा</th>
                                <th>विजिट फीस</th>
                                <th>एस्क्रो स्थिति</th>
                                <th>लाइव ट्रैकिंग स्थिति</th>
                                <th>हैंडशेक Dual-OTP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {booking_rows if booking_rows else '<tr class="empty-row"><td colspan="7">फिलहाल कोई सक्रिय बुकिंग नहीं है</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 4: Escrow Transactions Ledger -->
        <div id="escrowTab" class="tab-pane" style="display:none;">
            <div class="card">
                <div class="table-responsive">
                    <table id="escrowTable">
                        <thead>
                            <tr>
                                <th>ट्रांजेक्शन ID</th>
                                <th>बुकिंग ID</th>
                                <th>इवेंट प्रकार</th>
                                <th>राशि (₹)</th>
                                <th>10% प्लेटफॉर्म कमीशन</th>
                                <th>Previous Hash (SHA-256)</th>
                                <th>Current Hash (SHA-256)</th>
                                <th>दिनांक व समय</th>
                            </tr>
                        </thead>
                        <tbody>
                            {escrow_rows if escrow_rows else '<tr class="empty-row"><td colspan="8">फिलहाल कोई एस्क्रो ट्रांजेक्शन दर्ज नहीं है</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Tab 5: Archived Accounts -->
        <div id="archiveTab" class="tab-pane" style="display:none;">
            <div class="card">
                <div class="table-responsive">
                    <table id="archiveTable">
                        <thead>
                            <tr>
                                <th>आर्काइव ID</th>
                                <th>रोल</th>
                                <th>नाम व मोबाइल</th>
                                <th>हुनर</th>
                                <th>दर्ज पता</th>
                                <th>विजिट फीस</th>
                                <th>लॉगआउट समय</th>
                                <th>कार्रवाई</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archive_rows if archive_rows else '<tr class="empty-row"><td colspan="8">कोई आर्काइव खाता उपलब्ध नहीं है</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </main>

    <!-- Toast Notifications Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Footer -->
    <footer class="footer">
        <div>© 2026 <strong>Digital Kaam Platform</strong> — आत्मनिर्भर कारीगर व ग्राहक सुरक्षा तंत्र।</div>
        <div>
            FastAPI: <a href="/docs" target="_blank">Swagger Docs</a> | 
            Database: <code>digital_kaam.db (SQLite)</code>
        </div>
    </footer>

    <script>
        // Tab Switching Logic
        function switchTab(tabId, btn) {{
            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            const target = document.getElementById(tabId);
            if (target) target.style.display = 'block';
            if (btn) btn.classList.add('active');

            // Re-apply search filter
            filterActiveTab();
        }}

        // Toast Helper
        function showToast(message, isError = false) {{
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'toast ' + (isError ? 'toast-error' : 'toast-success');
            toast.innerHTML = (isError ? '⚠️ ' : '✓ ') + message;
            container.appendChild(toast);
            setTimeout(() => {{
                toast.style.transition = 'opacity 0.4s ease';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }}, 3500);
        }}

        // Search Filter for Active Tab
        function filterActiveTab() {{
            const filter = document.getElementById('globalSearch').value.toLowerCase();
            const activePane = document.querySelector('.tab-pane:not([style*="display: none"])');
            if (!activePane) return;

            const rows = activePane.querySelectorAll('tbody tr.data-row');
            rows.forEach(row => {{
                const text = row.textContent || row.innerText;
                row.style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
            }});
        }}

        // Delete Worker Function
        async function deleteWorker(workerId, workerName) {{
            if (!confirm(`क्या आप सचमुच कारीगर "${{workerName}}" (ID: ${{workerId}}) का खाता हमेशा के लिए डिलीट करना चाहते हैं?\\n\\nयह खाता डेटाबेस और रडार से तुरंत हटा दिया जाएगा।`)) {{
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
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '0';
                        row.style.transform = 'scale(0.95)';
                        setTimeout(() => row.remove(), 300);
                    }}
                    showToast(`कारीगर "${{workerName}}" का खाता सफलतापूर्वक डिलीट कर दिया गया`);
                    
                    // Update counter
                    const countBadge = document.getElementById('tab-count-workers');
                    if (countBadge) {{
                        let c = parseInt(countBadge.textContent) || 1;
                        countBadge.textContent = Math.max(0, c - 1);
                    }}
                    const kpi = document.getElementById('kpi-workers');
                    if (kpi) {{
                        let c = parseInt(kpi.textContent) || 1;
                        kpi.textContent = Math.max(0, c - 1);
                    }}
                }} else {{
                    showToast('डिलीट करने में त्रुटि: ' + (data.message || 'त्रुटि'), true);
                }}
            }} catch (err) {{
                showToast('सर्वर से संपर्क नहीं हो सका: ' + err.message, true);
            }}
        }}

        // Delete Posted Job Function
        async function deleteJob(jobId, jobTitle) {{
            if (!confirm(`क्या आप इस काम "${{jobTitle}}" (ID: ${{jobId}}) को हटाना चाहते हैं?`)) {{
                return;
            }}
            try {{
                const res = await fetch('/api/admin/jobs/' + encodeURIComponent(jobId) + '/delete', {{
                    method: 'POST'
                }});
                const data = await res.json();
                if (data.status === 'success') {{
                    const row = document.getElementById('job-row-' + jobId);
                    if (row) {{
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '0';
                        row.style.transform = 'scale(0.95)';
                        setTimeout(() => row.remove(), 300);
                    }}
                    showToast(`काम "${{jobTitle}}" सफलतापूर्वक हटा दिया गया`);

                    // Update counter
                    const countBadge = document.getElementById('tab-count-jobs');
                    if (countBadge) {{
                        let c = parseInt(countBadge.textContent) || 1;
                        countBadge.textContent = Math.max(0, c - 1);
                    }}
                    const kpi = document.getElementById('kpi-jobs');
                    if (kpi) {{
                        let c = parseInt(kpi.textContent) || 1;
                        kpi.textContent = Math.max(0, c - 1);
                    }}
                }} else {{
                    showToast('त्रुटि: ' + (data.message || 'हटा नहीं सके'), true);
                }}
            }} catch (err) {{
                showToast('सर्वर त्रुटि: ' + err.message, true);
            }}
        }}

        // Delete Archived Account Function
        async function deleteAccount(accountId, accountName) {{
            if (!confirm(`क्या आप आर्काइव खाता "${{accountName}}" हटाना चाहते हैं?`)) {{
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
                        row.style.transition = 'all 0.3s ease';
                        row.style.opacity = '0';
                        setTimeout(() => row.remove(), 300);
                    }}
                    showToast('आर्काइव खाता सफलतापूर्वक हटा दिया गया');
                    const countBadge = document.getElementById('tab-count-archive');
                    if (countBadge) {{
                        let c = parseInt(countBadge.textContent) || 1;
                        countBadge.textContent = Math.max(0, c - 1);
                    }}
                }} else {{
                    showToast('त्रुटि: ' + (data.message || 'हटा नहीं सके'), true);
                }}
            }} catch (err) {{
                showToast('सर्वर त्रुटि: ' + err.message, true);
            }}
        }}
    </script>
</body>
</html>
"""
    return html
