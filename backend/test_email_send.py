"""
测试邮件发送功能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

from email_service import EmailService
from config import Config
from datetime import datetime

def test_email():
    print("=" * 60)
    print("📧 TrustLens AI - 邮件发送测试")
    print("=" * 60)
    
    # 检查配置
    config = Config()
    print(f"\n✓ SMTP配置:")
    print(f"  Host: {config.SMTP_HOST}:{config.SMTP_PORT}")
    print(f"  Username: {config.SMTP_USERNAME}")
    print(f"  From: {config.SMTP_FROM_EMAIL} ({config.SMTP_FROM_NAME})")
    print(f"  Password: {'***' + config.SMTP_PASSWORD[-4:] if config.SMTP_PASSWORD else '未设置'}")
    
    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        print("\n❌ 错误: SMTP凭证未配置")
        print("请在 backend/.env 文件中设置:")
        print("  SMTP_USERNAME=your-email@gmail.com")
        print("  SMTP_PASSWORD=your-app-password")
        return
    
    # 初始化邮件服务
    email_service = EmailService()
    
    # 测试数据
    test_recipient = config.SMTP_USERNAME  # 发给自己
    
    print(f"\n✓ 测试邮件:")
    print(f"  收件人: {test_recipient}")
    print(f"  决策: Approved")
    print(f"  贷款金额: RM 50,000")
    
    # 生成PDF报告
    print(f"\n📄 生成PDF报告...")
    from report_generator import ReportGenerator
    report_gen = ReportGenerator()
    
    pdf_path = report_gen.generate_decision_report(
        application_id="TEST-001",
        applicant_name="Test Applicant",
        decision="Approved",
        loan_type="Personal Loan",
        requested_amount=50000,
        risk_score=750,
        analysis_result={
            "financial_analysis": {
                "monthly_income": 5000,
                "total_monthly_commitments": 1200,
                "dsr_percentage": 24.0,
                "savings_rate": 15.5
            },
            "decision_justification": {
                "overall_assessment": "Applicant demonstrates strong financial stability with healthy DSR and consistent income."
            }
        },
        final_dsr=24.0
    )
    print(f"  ✓ PDF生成: {pdf_path}")
    
    # 发送测试邮件
    print(f"\n⏳ 发送中...")
    
    result = email_service.send_decision_email(
        to_email=test_recipient,
        applicant_name="Test Applicant",
        application_id="TEST-001",
        decision="Approved",
        loan_type="Personal Loan",
        requested_amount=50000,
        risk_score=750,
        pdf_path=pdf_path,
        decision_justification="Test email from InsightLoan AI system - all criteria met with comprehensive PDF report attached"
    )
    
    print("\n" + "=" * 60)
    if result['status'] == 'sent':
        print("✅ 邮件发送成功!")
        print(f"   收件人: {test_recipient}")
        print(f"   请检查收件箱 (可能在垃圾邮件中)")
    else:
        print("❌ 邮件发送失败!")
        print(f"   错误: {result.get('error', 'Unknown error')}")
    print("=" * 60)
    
    return result

if __name__ == "__main__":
    test_email()
