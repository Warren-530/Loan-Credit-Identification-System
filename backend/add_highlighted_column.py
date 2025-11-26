"""
Database migration script to add highlighted column to Application table
Run this script to update existing database with the new highlighted field
"""
import sqlite3
import os

def migrate():
    db_path = "trustlens.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(application)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "highlighted" in columns:
            print("✓ Column 'highlighted' already exists in application table")
        else:
            # Add highlighted column with default value False
            cursor.execute("""
                ALTER TABLE application 
                ADD COLUMN highlighted INTEGER DEFAULT 0
            """)
            conn.commit()
            print("✓ Successfully added 'highlighted' column to application table")
        
        # Verify the migration
        cursor.execute("SELECT COUNT(*) FROM application")
        count = cursor.fetchone()[0]
        print(f"✓ Migration complete. Total applications: {count}")
        
    except sqlite3.Error as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting database migration...")
    migrate()
    print("Migration finished.")
