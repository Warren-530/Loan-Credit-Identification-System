from sqlmodel import create_engine, inspect
import sys

sqlite_file_name = "trustlens.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('application')]
print(f"Columns: {columns}")

required = ['supporting_doc_1_path', 'supporting_doc_2_path', 'supporting_doc_3_path']
missing = [c for c in required if c not in columns]

if missing:
    print(f"Missing columns: {missing}")
    sys.exit(1)
else:
    print("All columns present")
    sys.exit(0)
