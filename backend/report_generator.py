"""
PDF Report Generator for Loan Applications
Generates comprehensive assessment reports to be attached to decision emails
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os


class ReportGenerator:
    """Generate PDF reports for loan applications"""
    
    def __init__(self, output_dir: str = "./uploads"):
        self.output_dir = output_dir
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Create custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=12,
            spaceBefore=20,
            borderPadding=5
        ))
        
        self.styles.add(ParagraphStyle(
            name='DecisionApproved',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=colors.green,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=20
        ))
        
        self.styles.add(ParagraphStyle(
            name='DecisionRejected',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=colors.red,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=20
        ))
    
    def generate_decision_report(
        self,
        application_id: str,
        applicant_name: str,
        decision: str,
        loan_type: str,
        requested_amount: float,
        risk_score: int,
        analysis_result: dict,
        final_dsr: float = None
    ) -> str:
        """
        Generate comprehensive PDF report
        
        Returns:
            str: Path to generated PDF file
        """
        # Create application folder if needed
        app_folder = os.path.join(self.output_dir, application_id)
        os.makedirs(app_folder, exist_ok=True)
        
        # Output PDF path
        pdf_filename = f"Assessment_Report_{application_id}.pdf"
        pdf_path = os.path.join(app_folder, pdf_filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                               topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        
        # Title
        story.append(Paragraph("InsightLoan", self.styles['CustomTitle']))
        story.append(Paragraph("Credit Assessment Report", self.styles['Heading2']))
        story.append(Spacer(1, 0.3*inch))
        
        # Application Details
        story.append(Paragraph("Application Information", self.styles['SectionHeader']))
        
        app_data = [
            ['Application ID:', application_id],
            ['Applicant Name:', applicant_name],
            ['Loan Type:', loan_type],
            ['Requested Amount:', f"RM {requested_amount:,.2f}"],
            ['Assessment Date:', datetime.now().strftime("%Y-%m-%d %H:%M")],
        ]
        
        app_table = Table(app_data, colWidths=[2*inch, 4*inch])
        app_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(app_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Final Decision
        story.append(Paragraph("Final Decision", self.styles['SectionHeader']))
        decision_style = self.styles['DecisionApproved'] if decision == "Approved" else self.styles['DecisionRejected']
        story.append(Paragraph(f"<b>{decision.upper()}</b>", decision_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Risk Assessment
        story.append(Paragraph("Risk Assessment", self.styles['SectionHeader']))
        
        risk_data = [
            ['Risk Score:', f"{risk_score}/100", self._get_risk_level(risk_score)],
        ]
        
        if final_dsr:
            risk_data.append(['Debt Service Ratio:', f"{final_dsr:.1f}%", self._get_dsr_level(final_dsr)])
        
        risk_table = Table(risk_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(risk_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Decision Justification
        if analysis_result and isinstance(analysis_result, dict):
            decision_just = analysis_result.get("decision_justification", {})
            if isinstance(decision_just, dict):
                story.append(Paragraph("Decision Justification", self.styles['SectionHeader']))
                
                assessment = decision_just.get("overall_assessment", "No assessment available")
                story.append(Paragraph(assessment, self.styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
        
        # Financial Analysis
        if analysis_result and isinstance(analysis_result, dict):
            financial = analysis_result.get("financial_analysis", {})
            if isinstance(financial, dict):
                story.append(Paragraph("Financial Analysis", self.styles['SectionHeader']))
                
                fin_data = []
                if financial.get("monthly_income"):
                    fin_data.append(['Monthly Income:', f"RM {financial['monthly_income']:,.2f}"])
                if financial.get("total_monthly_commitments"):
                    fin_data.append(['Monthly Commitments:', f"RM {financial['total_monthly_commitments']:,.2f}"])
                if financial.get("dsr_percentage"):
                    fin_data.append(['DSR:', f"{financial['dsr_percentage']:.1f}%"])
                if financial.get("savings_rate"):
                    fin_data.append(['Savings Rate:', f"{financial['savings_rate']:.1f}%"])
                
                if fin_data:
                    fin_table = Table(fin_data, colWidths=[2.5*inch, 3.5*inch])
                    fin_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('LEFTPADDING', (0, 0), (-1, -1), 10),
                        ('TOPPADDING', (0, 0), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ]))
                    story.append(fin_table)
                    story.append(Spacer(1, 0.3*inch))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("_" * 80, self.styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(
            f"<i>This report is generated by InsightLoan AI Credit Assessment System</i><br/>"
            f"<i>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i><br/>"
            f"<i>© {datetime.now().year} InsightLoan. All rights reserved.</i>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        return pdf_path
    
    def _get_risk_level(self, score: int) -> str:
        """Get risk level description from score"""
        if score >= 80:
            return "Low Risk"
        elif score >= 60:
            return "Medium Risk"
        elif score >= 40:
            return "High Risk"
        else:
            return "Very High Risk"
    
    def _get_dsr_level(self, dsr: float) -> str:
        """Get DSR level description"""
        if dsr < 40:
            return "Healthy"
        elif dsr < 60:
            return "Moderate"
        else:
            return "High"
