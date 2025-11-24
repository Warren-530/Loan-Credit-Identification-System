import asyncio
from sqlmodel import create_engine, Session
from models import Application
from main import process_application_background, LoanType

DB_URL = 'sqlite:///trustlens.db'
engine = create_engine(DB_URL, echo=False)

def get_app(app_id: str):
    with Session(engine) as session:
        return session.query(Application).filter(Application.application_id == app_id).first()

def main(app_id: str):
    app = get_app(app_id)
    if not app:
        print('Application not found:', app_id); return
    print('Reprocessing', app.application_id)
    asyncio.run(process_application_background(
        app.application_id,
        app.loan_type.value if hasattr(app.loan_type,'value') else app.loan_type,
        app.bank_statement_path or '',
        app.essay_path,
        app.payslip_path
    ))

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage: python reprocess_app.py <APPLICATION_ID>'); raise SystemExit(1)
    main(sys.argv[1])
