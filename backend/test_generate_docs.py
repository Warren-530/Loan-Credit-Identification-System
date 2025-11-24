import os, textwrap
import fitz

def make_bank_pdf(path):
    doc = fitz.open()
    page = doc.new_page()
    text = textwrap.dedent("""DATE DESC AMOUNT
2025-11-01 Salary Payment +RM 4,800.00
2025-11-02 GrabFood -RM 28.50
2025-11-05 Deposit +RM 1,200.00
2025-11-07 Luno Exchange -RM 500.00
2025-11-09 Toto -RM 100.00
2025-11-12 Deposit +RM 2,000.00
2025-11-18 Deposit +RM 2,000.00
2025-11-23 Rent -RM 1,300.00
2025-11-24 Utilities -RM 350.00
2025-11-24 Transfer +RM 300.00
""")
    page.insert_text((50,50), text)
    doc.save(path); doc.close()

def make_essay_pdf(path):
    doc = fitz.open(); page = doc.new_page()
    essay = ("I will repay the loan through stable salary and growing business revenue. "
             "My plan is to expand operations and increase sales. Despite recent challenges "
             "I remain consistent and compliant with tax and license requirements.")
    page.insert_text((50,50), essay)
    doc.save(path); doc.close()

def make_payslip_pdf(path):
    doc = fitz.open(); page = doc.new_page()
    payslip = textwrap.dedent("""Basic Salary: RM 4800.00
Allowance: RM 300.00
Deductions: RM 250.00
Net Pay: RM 4850.00""")
    page.insert_text((50,50), payslip)
    doc.save(path); doc.close()

def main():
    os.makedirs('test_docs', exist_ok=True)
    bank = 'test_docs/bank.pdf'
    essay = 'test_docs/essay.pdf'
    payslip = 'test_docs/payslip.pdf'
    make_bank_pdf(bank); make_essay_pdf(essay); make_payslip_pdf(payslip)
    print('Generated:', bank, essay, payslip)

if __name__ == '__main__':
    main()
