import requests
import zipfile
import os
import io

# Create a dummy ZIP file in memory
zip_buffer = io.BytesIO()
with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
    # Applicant 1
    zip_file.writestr('Applicant_John/application_form.pdf', b'dummy content')
    zip_file.writestr('Applicant_John/bank_statement.pdf', b'dummy content')
    zip_file.writestr('Applicant_John/essay.pdf', b'dummy content')
    zip_file.writestr('Applicant_John/payslip.pdf', b'dummy content')
    
    # Applicant 2
    zip_file.writestr('Applicant_Jane/borang.pdf', b'dummy content')
    zip_file.writestr('Applicant_Jane/penyata_bank.pdf', b'dummy content')
    zip_file.writestr('Applicant_Jane/tujuan_pinjaman.pdf', b'dummy content')
    zip_file.writestr('Applicant_Jane/gaji_slip.pdf', b'dummy content')

zip_buffer.seek(0)

# Upload
url = 'http://127.0.0.1:8000/api/upload/batch'
files = {'file': ('test_batch.zip', zip_buffer, 'application/zip')}

try:
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
except Exception as e:
    print(f"Error: {e}")
