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

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'backup':
        backup_db()
    else:
        get_stats()
