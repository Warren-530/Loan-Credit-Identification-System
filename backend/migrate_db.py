import sqlite3
import os

DB_PATH = "trustlens.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(application)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_columns = [
        ("supporting_doc_1_path", "VARCHAR"),
        ("supporting_doc_2_path", "VARCHAR"),
        ("supporting_doc_3_path", "VARCHAR"),
        ("comment", "TEXT")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"Adding missing column: {col_name}")
            try:
                cursor.execute(f"ALTER TABLE application ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added {col_name}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Migration check complete.")

if __name__ == "__main__":
    migrate()
