#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick script to view SQLite database contents
"""
import sqlite3
import sys
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Connect to database
conn = sqlite3.connect('trustlens.db')
cursor = conn.cursor()

# Show tables
print("=" * 60)
print("DATABASE TABLES")
print("=" * 60)
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table in tables:
    print(f"  📊 {table[0]}")

print("\n" + "=" * 60)
print("APPLICATIONS")
print("=" * 60)

# Show applications
cursor.execute("SELECT COUNT(*) FROM application")
count = cursor.fetchone()[0]
print(f"\nTotal Applications: {count}")

if count > 0:
    cursor.execute("""
        SELECT application_id, applicant_name, loan_type, requested_amount, 
               status, risk_score, risk_level, created_at 
        FROM application 
        ORDER BY created_at DESC
    """)
    
    applications = cursor.fetchall()
    print("\n" + "-" * 60)
    for app in applications:
        print(f"\n🆔 App ID: {app[0]}")
        print(f"👤 Name: {app[1]}")
        print(f"💰 Loan: {app[2]} - RM{app[3]:,.2f}")
        print(f"📊 Status: {app[4]}")
        print(f"📈 Risk Score: {app[5] or 'N/A'}")
        print(f"⚠️  Risk Level: {app[6] or 'N/A'}")
        print(f"📅 Created: {app[7]}")
    print("\n" + "-" * 60)
else:
    print("\n📭 No applications yet. Submit one from the web interface!")

conn.close()
print("\n✅ Database query complete!\n")
