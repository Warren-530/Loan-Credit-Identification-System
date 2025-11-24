"""
Database configuration and initialization
"""
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from contextlib import contextmanager
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trustlens.db")

# Create engine
engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    """Initialize database and create tables, then apply lightweight migrations."""
    SQLModel.metadata.create_all(engine)
    _apply_migrations()


def _apply_migrations():
    """Add newly introduced columns without destructive migrations (SQLite)."""
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(application)"))
            existing_cols = {row[1] for row in result}
        except Exception:
            return  # Table might not exist yet

        # Columns to ensure exist (name -> SQL type)
        required = {
            "payslip_path": "TEXT",
        }
        for col_name, col_type in required.items():
            if col_name not in existing_cols:
                conn.execute(text(f"ALTER TABLE application ADD COLUMN {col_name} {col_type}"))


@contextmanager
def get_session():
    """Get database session"""
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
