from database import get_session
from models import Application

with get_session() as session:
    apps = session.query(Application).all()
    for app in apps:
        session.delete(app)
    session.commit()
    print(f"Deleted {len(apps)} applications. Database is now empty.")
