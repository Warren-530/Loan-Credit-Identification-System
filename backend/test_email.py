"""
测试邮件发送功能
Test the email notification system
"""
import asyncio
from email_service import EmailService
from config import Config

async def test_email():
    print("=" * 60)
    print("📧 邮件发送功能测试")
    print("=" * 60)
    
    # 配置信息
    config = Config()
    print(f"\n✓ SMTP配置:")
    print(f"  服务器: {config.SMTP_HOST}:{config.SMTP_PORT}")
    print(f"  发件人: {config.SMTP_FROM_EMAIL}")
    print(f"  用户名: {config.SMTP_USERNAME}")
    print(f"  密码: {'*' * len(config.SMTP_PASSWORD) if config.SMTP_PASSWORD else '未配置'}")
    
    # 创建邮件服务
    email_service = EmailService()
    
    # 测试邮件数据
    test_data = {
        "applicant_name": "张三测试",
        "applicant_email": "insightloan.official@gmail.com",  # 发给自己测试
        "application_id": "TEST-20251126-001",
        "decision": "approved",  # approved, rejected, review
        "loan_amount": 50000,
        "loan_purpose": "个人消费",
        "credit_score": 720,
        "risk_level": "low",
        "decision_reason": "申请人信用记录良好，收入稳定，还款能力强。综合评估符合贷款批准标准。",
        "next_steps": "请在3个工作日内联系我们的客户经理办理后续手续。"
    }
    
    print(f"\n📨 测试邮件内容:")
    print(f"  收件人: {test_data['applicant_email']}")
    print(f"  申请人: {test_data['applicant_name']}")
    print(f"  决策: {test_data['decision']}")
    print(f"  金额: RM {test_data['loan_amount']:,.2f}")
    
    print(f"\n⏳ 正在发送邮件...")
    
    # 发送邮件
    result = await email_service.send_decision_email(
        applicant_name=test_data["applicant_name"],
        applicant_email=test_data["applicant_email"],
        application_id=test_data["application_id"],
        decision=test_data["decision"],
        loan_amount=test_data["loan_amount"],
        loan_purpose=test_data["loan_purpose"],
        credit_score=test_data["credit_score"],
        risk_level=test_data["risk_level"],
        decision_reason=test_data["decision_reason"],
        next_steps=test_data["next_steps"]
    )
    
    print("\n" + "=" * 60)
    if result["status"] == "sent":
        print("✅ 邮件发送成功！")
        print(f"   收件人: {test_data['applicant_email']}")
        print(f"\n💡 请检查收件箱（可能在垃圾邮件中）")
    else:
        print("❌ 邮件发送失败！")
        print(f"   错误: {result.get('error', '未知错误')}")
    print("=" * 60)
    
    return result

if __name__ == "__main__":
    result = asyncio.run(test_email())
