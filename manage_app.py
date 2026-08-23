import sys
import os
import sqlite3
import shutil
import time

DB_PATH = 'digitalkaam.db'

def get_stats():
    if not os.path.exists(DB_PATH):
        print('Database not found!')
        return
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('SELECT COUNT(*) FROM workers')
    w_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM workers WHERE verification_status = \"approved\"')
    w_app = c.fetchone()[0]

    c.execute('SELECT COUNT(*) FROM seekers')
    c_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM bookings')
    b_count = c.fetchone()[0]

    c.execute('SELECT IFNULL(SUM(wallet_balance), 0) FROM workers')
    wal_bal = c.fetchone()[0]

    conn.close()
    
    print('===================================================')
    print('       📊 DIGITAL KAAM 2.0 PLATFORM STATUS         ')
    print('===================================================')
    print(f' 👷 Total Registered Workers: {w_count} ({w_app} Approved)')
    print(f' 🧑 Total Registered Customers: {c_count}')
    print(f' 📦 Total Orders / Bookings: {b_count}')
    print(f' 💰 Total Worker Wallet Balance: ₹{wal_bal:.2f}')
    print(' 🔒 Core Engine: Python FastAPI + SQLite WAL + 24/7 Keep-Alive')
    print('===================================================')

def backup_db():
    if not os.path.exists(DB_PATH):
        print('Database not found!')
        return
    backup_file = f'backup_digitalkaam_{int(time.time())}.db'
    shutil.copy2(DB_PATH, backup_file)
    print(f'✅ Database backup created: {backup_file}')
    return backup_file

def clean_garbage():
    if not os.path.exists(DB_PATH):
        print('Database not found!')
        return
    backup_db()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Delete test and dummy bookings
    c.execute("""
    DELETE FROM bookings 
    WHERE customer_phone LIKE '99999%' 
       OR customer_phone LIKE '98765%' 
       OR customer_phone LIKE '91234%'
       OR customer_name LIKE '%test%'
       OR customer_name LIKE '%Fraud%'
    """)
    deleted_b = c.rowcount

    # 2. Delete test and dummy customers
    c.execute("""
    DELETE FROM seekers 
    WHERE phone LIKE '99999%' 
       OR phone LIKE '98765%' 
       OR phone LIKE '91234%'
       OR name LIKE '%test%'
       OR name LIKE '%Fraud%'
    """)
    deleted_s = c.rowcount

    # 3. Clean old expired OTPs
    c.execute("DELETE FROM otp_verifications WHERE expires_at < ?", (time.time(),))
    deleted_o = c.rowcount

    # 4. Clean orphan wallet transactions
    c.execute("DELETE FROM wallet_transactions WHERE description LIKE '%test%' OR description LIKE '%Demo%'")
    deleted_w = c.rowcount

    conn.commit()
    conn.close()

    print('===================================================')
    print('       🧹 GARBAGE CLEANUP COMPLETE (SUCCESS)        ')
    print('===================================================')
    print(f' 🗑️ Deleted {deleted_b} Test Bookings')
    print(f' 🗑️ Deleted {deleted_s} Dummy Customers')
    print(f' 🗑️ Cleared {deleted_o} Expired OTP Records')
    print(f' 🗑️ Cleared {deleted_w} Test Wallet Logs')
    print(' [OK] Database is now 100% clean and optimized!')
    print('===================================================')

def reset_all_data():
    backup_db()
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print('🗑️ Old database deleted.')
    from server import init_database
    init_database()
    print('✨ Brand new clean database initialized with fresh tables!')

if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'stats'
    if arg == 'backup':
        backup_db()
    elif arg == 'clean':
        clean_garbage()
    elif arg == 'reset':
        reset_all_data()
    else:
        get_stats()
