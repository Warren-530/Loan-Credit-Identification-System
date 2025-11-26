"""
Email Service for TrustLens AI
Handles sending approval/rejection notification emails to applicants
"""
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, Any
from datetime import datetime
from config import Config


class EmailService:
    """Service for sending email notifications to loan applicants"""
    
    def __init__(self):
        """Initialize email service with default config"""
        self.config = Config()
    
    def _load_smtp_config(self, db_session=None):
        """
        Load SMTP configuration from database or fallback to environment
        
        Priority:
        1. If db_session provided and smtp_enabled=True:
           - Use database fields if set, otherwise fallback to .env
           - Password always from .env (security)
        2. Otherwise use .env entirely
        
        Args:
            db_session: Optional database session to load settings from RiskPolicy
            
        Returns:
            Tuple of (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name)
        """
        # Default to environment config
        smtp_host = self.config.SMTP_HOST
        smtp_port = self.config.SMTP_PORT
        smtp_username = self.config.SMTP_USERNAME
        smtp_password = self.config.SMTP_PASSWORD
        from_email = self.config.SMTP_FROM_EMAIL or self.config.SMTP_USERNAME
        from_name = self.config.SMTP_FROM_NAME
        
        # Try to override from database if available and enabled
        if db_session:
            from models import RiskPolicy
            policy = db_session.query(RiskPolicy).first()
            if policy and policy.smtp_enabled:
                # Override only if database has non-null values
                if policy.smtp_host:
                    smtp_host = policy.smtp_host
                if policy.smtp_port:
                    smtp_port = policy.smtp_port
                if policy.smtp_username:
                    smtp_username = policy.smtp_username
                if policy.smtp_from_email:
                    from_email = policy.smtp_from_email
                # Password always from .env for security
        
        return (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name)
    
    def send_decision_email(
        self,
        to_email: str,
        applicant_name: str,
        application_id: str,
        decision: str,
        loan_type: str,
        requested_amount: float,
        risk_score: Optional[int] = None,
        pdf_path: Optional[str] = None,
        decision_justification: Optional[str] = None,
        db_session=None
    ) -> Dict[str, Any]:
        """
        Send loan decision email to applicant with attached report
        
        Args:
            to_email: Applicant's email address
            applicant_name: Applicant's full name
            application_id: Application ID
            decision: "Approved" or "Rejected" or "Review Required"
            loan_type: Type of loan (Personal, Housing, etc.)
            requested_amount: Loan amount requested
            risk_score: Risk score (0-100)
            pdf_path: Path to PDF report attachment
            decision_justification: Reason for decision
            db_session: Database session to load SMTP settings from
            
        Returns:
            Dict with status: 'sent', 'failed', and optional error message
        """
        try:
            # Load SMTP configuration (from database or environment)
            smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name = self._load_smtp_config(db_session)
            
            # Validate SMTP configuration
            if not smtp_username or not smtp_password:
                return {
                    "status": "failed",
                    "error": "SMTP credentials not configured. Please update settings."
                }
            
            if not to_email:
                return {
                    "status": "failed",
                    "error": "Applicant email address not found in application"
                }
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f'{from_name} <{from_email}>'
            msg['To'] = to_email
            
            # Set subject based on decision
            if decision == "Approved":
                msg['Subject'] = f"Your Loan Application with InsightLoan – Approved"
            elif decision == "Rejected":
                msg['Subject'] = f"Your Loan Application with InsightLoan"
            else:
                msg['Subject'] = f"Your Loan Application with InsightLoan – Update Required"
            
            # Generate email body
            if decision == "Approved":
                email_body = self._generate_approval_email(
                    applicant_name, application_id, loan_type, 
                    requested_amount, risk_score, decision_justification
                )
            elif decision == "Rejected":
                email_body = self._generate_rejection_email(
                    applicant_name, application_id, loan_type, 
                    requested_amount, decision_justification
                )
            else:
                email_body = self._generate_review_email(
                    applicant_name, application_id, loan_type, requested_amount
                )
            
            # Attach HTML body
            msg.attach(MIMEText(email_body, 'html'))
            
            # Attach PDF report if provided
            if pdf_path and os.path.exists(pdf_path):
                try:
                    with open(pdf_path, 'rb') as f:
                        pdf_part = MIMEBase('application', 'pdf')
                        pdf_part.set_payload(f.read())
                        encoders.encode_base64(pdf_part)
                        pdf_part.add_header(
                            'Content-Disposition',
                            f'attachment; filename="TrustLens_Report_{application_id}.pdf"'
                        )
                        msg.attach(pdf_part)
                except Exception as e:
                    print(f"Warning: Could not attach PDF: {e}")
            
            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
            
            return {
                "status": "sent",
                "sent_at": datetime.utcnow().isoformat(),
                "recipient": to_email
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                "status": "failed",
                "error": "SMTP authentication failed. Please check your Gmail credentials and app password."
            }
        except smtplib.SMTPException as e:
            return {
                "status": "failed",
                "error": f"SMTP error: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "failed",
                "error": f"Failed to send email: {str(e)}"
            }
    
    def _generate_approval_email(
        self, name: str, app_id: str, loan_type: str, 
        amount: float, risk_score: Optional[int], justification: Optional[str]
    ) -> str:
        """Generate HTML email for approved application"""
        # Calculate default tenure (24 months)
        tenure = 24
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff; }}
        .header {{ background: #0f172a; color: white; padding: 40px 30px; text-align: center; }}
        .logo {{ font-size: 24px; font-weight: bold; letter-spacing: 1px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; background: #ffffff; }}
        .approval-notice {{ background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 25px 0; }}
        .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; }}
        .details-table td {{ padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }}
        .details-table tr:last-child td {{ border-bottom: none; }}
        .label {{ color: #64748b; font-size: 14px; }}
        .value {{ font-weight: 600; text-align: right; color: #0f172a; }}
        .amount {{ color: #22c55e; font-size: 18px; font-weight: bold; }}
        .next-steps {{ background: #f8fafc; padding: 20px; margin: 25px 0; border-radius: 4px; }}
        .next-steps ol {{ margin: 10px 0; padding-left: 20px; }}
        .next-steps li {{ margin: 8px 0; color: #334155; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }}
        .notice {{ background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; margin: 20px 0; border-radius: 4px; color: #9a3412; font-size: 13px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">InsightLoan</div>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;">Intelligent Lending Solutions</p>
        </div>
        
        <div class="content">
            <h2 style="margin: 0 0 20px 0; color: #0f172a;">Your Loan Application with InsightLoan – Approved</h2>
            
            <p style="margin: 0 0 20px 0;">Dear <strong>{name}</strong>,</p>
            
            <div class="approval-notice">
                <p style="margin: 0; color: #166534; font-weight: 500;">
                    We are pleased to inform you that your {loan_type} application with InsightLoan has been approved.
                </p>
            </div>
            
            <h3 style="margin: 25px 0 15px 0; color: #0f172a; font-size: 16px;">Loan Details:</h3>
            <table class="details-table">
                <tr>
                    <td class="label">Loan Type:</td>
                    <td class="value">{loan_type}</td>
                </tr>
                <tr>
                    <td class="label">Approved Amount:</td>
                    <td class="value amount">RM {amount:,.2f}</td>
                </tr>
                <tr>
                    <td class="label">Tenure:</td>
                    <td class="value">{tenure} months</td>
                </tr>
                <tr>
                    <td class="label">Reference No.:</td>
                    <td class="value">{app_id}</td>
                </tr>
            </table>
            
            <div class="next-steps">
                <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px;">Next Steps:</h3>
                <p style="margin: 0 0 10px 0; color: #475569;">Our team will be in touch with you shortly to guide you through the following:</p>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Document signing and verification</li>
                    <li>Loan disbursement process</li>
                    <li>Any additional requirements or clarifications</li>
                </ol>
            </div>
            
            <div class="notice">
                <strong>Please note:</strong> A comprehensive credit assessment report is attached to this email for your reference.
            </div>
            
            <p style="margin: 25px 0 10px 0; color: #475569;">
                If you have any questions, please feel free to contact us at <strong>support@insightloan.com</strong> or call our customer service hotline.
            </p>
            
            <p style="margin: 20px 0 0 0; color: #475569;">
                Thank you for choosing InsightLoan. We look forward to supporting you in achieving your financial goals.
            </p>
            
            <p style="margin: 25px 0 0 0; color: #64748b;">
                Warm regards,<br>
                <strong style="color: #0f172a;">InsightLoan Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">InsightLoan</p>
            <p style="margin: 5px 0;">This is an automated notification. Please do not reply to this email.</p>
            <p style="margin: 15px 0 0 0; font-size: 11px; color: #94a3b8;">
                © {datetime.now().year} InsightLoan. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
    
    def _generate_rejection_email(
        self, name: str, app_id: str, loan_type: str, 
        amount: float, justification: Optional[str]
    ) -> str:
        """Generate HTML email for rejected application"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff; }}
        .header {{ background: #0f172a; color: white; padding: 40px 30px; text-align: center; }}
        .logo {{ font-size: 24px; font-weight: bold; letter-spacing: 1px; margin-bottom: 10px; }}
        .content {{ padding: 40px 30px; background: #ffffff; }}
        .decision-notice {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; }}
        .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; }}
        .details-table td {{ padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }}
        .details-table tr:last-child td {{ border-bottom: none; }}
        .label {{ color: #64748b; font-size: 14px; }}
        .value {{ font-weight: 600; text-align: right; color: #0f172a; }}
        .info-box {{ background: #f8fafc; padding: 20px; margin: 25px 0; border-radius: 4px; }}
        .info-box ul {{ margin: 10px 0; padding-left: 20px; }}
        .info-box li {{ margin: 8px 0; color: #475569; }}
        .footer {{ background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }}
        .notice {{ background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; margin: 20px 0; border-radius: 4px; color: #9a3412; font-size: 13px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">InsightLoan</div>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #94a3b8;">Intelligent Lending Solutions</p>
        </div>
        
        <div class="content">
            <h2 style="margin: 0 0 20px 0; color: #0f172a;">Your Loan Application with InsightLoan</h2>
            
            <p style="margin: 0 0 20px 0;">Dear <strong>{name}</strong>,</p>
            
            <p style="margin: 0 0 20px 0; color: #475569;">
                Thank you for submitting your {loan_type} application with InsightLoan and for your interest in our services.
            </p>
            
            <div class="decision-notice">
                <p style="margin: 0; color: #991b1b; font-weight: 500;">
                    After a careful review of your application and supporting documents, we regret to inform you that we are unable to approve your loan application at this time.
                </p>
            </div>
            
            <p style="margin: 20px 0; color: #475569;">
                This decision was made based on our current credit assessment criteria and risk evaluation policies, and does not prevent you from reapplying in the future. You may consider reapplying if there are material changes to your financial circumstances.
            </p>
            
            <h3 style="margin: 25px 0 15px 0; color: #0f172a; font-size: 16px;">Application Details:</h3>
            <table class="details-table">
                <tr>
                    <td class="label">Loan Type:</td>
                    <td class="value">{loan_type}</td>
                </tr>
                <tr>
                    <td class="label">Requested Amount:</td>
                    <td class="value">RM {amount:,.2f}</td>
                </tr>
                <tr>
                    <td class="label">Reference No.:</td>
                    <td class="value">{app_id}</td>
                </tr>
            </table>
            
            <div class="info-box">
                <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px;">Recommendations for Future Applications:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Review and strengthen your financial standing</li>
                    <li>Reduce existing debt obligations to improve debt service ratio</li>
                    <li>Build a consistent savings and income history</li>
                    <li>Consider applying for a more suitable loan amount</li>
                    <li>Consult the attached assessment report for detailed insights</li>
                </ul>
            </div>
            
            <div class="notice">
                <strong>Please note:</strong> A comprehensive credit assessment report is attached to this email. This report provides detailed analysis that may help you understand our decision and improve future applications.
            </div>
            
            <p style="margin: 25px 0 10px 0; color: #475569;">
                If you have any questions or require clarification regarding this decision, please feel free to contact us at <strong>support@insightloan.com</strong> or call our customer service hotline.
            </p>
            
            <p style="margin: 20px 0 0 0; color: #475569;">
                We appreciate your interest in InsightLoan and wish you the best in your financial endeavors.
            </p>
            
            <p style="margin: 25px 0 0 0; color: #64748b;">
                Best regards,<br>
                <strong style="color: #0f172a;">InsightLoan Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #0f172a;">InsightLoan</p>
            <p style="margin: 5px 0;">This is an automated notification. Please do not reply to this email.</p>
            <p style="margin: 15px 0 0 0; font-size: 11px; color: #94a3b8;">
                © {datetime.now().year} InsightLoan. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
"""
    
    def _generate_review_email(
        self, name: str, app_id: str, loan_type: str, amount: float
    ) -> str:
        """Generate HTML email for applications requiring review"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                   color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
        .decision-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; 
                         padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .details {{ background: white; padding: 20px; margin: 15px 0; border-radius: 8px; 
                   box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
        .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        h1 {{ margin: 0; font-size: 28px; }}
        h2 {{ color: #0f172a; margin-top: 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Under Review</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Application ID: {app_id}</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>{name}</strong>,</p>
            
            <div class="decision-box">
                <h2 style="margin: 0; color: #d97706;">⚠ Additional Review Required</h2>
                <p style="margin: 10px 0 0 0;">
                    Your loan application requires additional review by our credit team.
                </p>
            </div>
            
            <div class="details">
                <h3 style="margin-top: 0; color: #0f172a;">Application Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Application ID:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right;">{app_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Loan Type:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right;">{loan_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Requested Amount:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right;">RM {amount:,.2f}</td>
                    </tr>
                </table>
            </div>
            
            <div class="details">
                <h3 style="margin-top: 0; color: #0f172a;">What Happens Next?</h3>
                <ol style="margin: 0; padding-left: 20px; color: #334155;">
                    <li>Our senior credit analyst will review your application in detail</li>
                    <li>We may contact you for additional documentation or clarification</li>
                    <li>You will receive a final decision within 5-7 business days</li>
                    <li>Review the attached assessment report for current analysis</li>
                </ol>
            </div>
            
            <p style="margin-top: 25px;">
                Thank you for your patience during this review process.
            </p>
            
            <div class="footer">
                <p><strong>TrustLens AI</strong> - Intelligent Credit Risk Assessment</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p style="margin-top: 15px; font-size: 11px;">
                    © {datetime.now().year} TrustLens AI. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
"""


# Singleton instance
email_service = EmailService()
