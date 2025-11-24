import requests, os

API = 'http://localhost:8000/api/upload'

def main():
    bank = 'test_docs/bank.pdf'
    essay = 'test_docs/essay.pdf'
    payslip = 'test_docs/payslip.pdf'
    assert all(os.path.exists(p) for p in [bank, essay, payslip]), 'Missing generated PDFs'

    files = {
        'bank_statement': open(bank, 'rb'),
        'essay': open(essay, 'rb'),
        'payslip': open(payslip, 'rb')
    }
    data = {
        'loan_type': 'PERSONAL',
        'ic_number': '900101-01-1234',
        'applicant_name': 'Test User',
        'requested_amount': '50000'
    }
    r = requests.post(API, files=files, data=data)
    for f in files.values():
        f.close()
    print('Upload status:', r.status_code)
    print(r.json())

if __name__ == '__main__':
    main()
