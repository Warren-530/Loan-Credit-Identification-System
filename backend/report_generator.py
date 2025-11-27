"""
PDF Report Generator for Loan Applications
Generates comprehensive assessment reports matching frontend format
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime
import os


class ReportGenerator:
    """Generate PDF reports for loan applications matching frontend format"""
    
    def __init__(self, output_dir: str = "./uploads"):
        self.output_dir = output_dir
        # Create paragraph styles for table cells
        self.styles = getSampleStyleSheet()
        self.cell_style = ParagraphStyle(
            'CellStyle',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10,
            alignment=TA_LEFT,
        )
        self.cell_style_bold = ParagraphStyle(
            'CellStyleBold',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
        )
    
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
        Generate comprehensive PDF report matching frontend format
        
        Returns:
            str: Path to generated PDF file
        """
        # Create application folder if needed
        app_folder = os.path.join(self.output_dir, application_id)
        os.makedirs(app_folder, exist_ok=True)
        
        # Output PDF path
        pdf_filename = f"Assessment_Report_{application_id}.pdf"
        pdf_path = os.path.join(app_folder, pdf_filename)
        
        # Create PDF with custom canvas
        c = canvas.Canvas(pdf_path, pagesize=letter)
        page_width, page_height = letter
        
        # ==================== PAGE 1: EXECUTIVE SUMMARY ====================
        # Header with lines (professional black)
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.5)
        c.line(20*mm, page_height - 15*mm, 190*mm, page_height - 15*mm)
        
        # Title
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(colors.black)
        c.drawCentredString(page_width/2, page_height - 23*mm, "INSIGHTLOAN")
        
        c.setFont("Helvetica", 11)
        c.drawCentredString(page_width/2, page_height - 31*mm, "Credit Risk Assessment Report")
        
        c.line(20*mm, page_height - 35*mm, 190*mm, page_height - 35*mm)
        
        # Application Info Box (bordered rectangle)
        box_y = page_height - 85*mm
        c.setLineWidth(0.3)
        c.rect(20*mm, box_y, 170*mm, 40*mm, stroke=1, fill=0)
        
        # Info content
        c.setFont("Helvetica-Bold", 14)
        c.drawString(25*mm, box_y + 31*mm, applicant_name or "Unknown")
        
        c.setFont("Helvetica", 9)
        c.drawString(25*mm, box_y + 24*mm, f"Application ID: {application_id}")
        c.drawString(25*mm, box_y + 18*mm, f"Loan Type: {loan_type}")
        c.drawString(25*mm, box_y + 12*mm, f"Requested Amount: RM {requested_amount:,.2f}")
        c.drawString(25*mm, box_y + 6*mm, f"Assessment Date: {datetime.now().strftime('%Y-%m-%d')}")
        
        # Risk level
        risk_level = "Low" if risk_score >= 80 else "Medium" if risk_score >= 60 else "High"
        c.drawString(130*mm, box_y + 24*mm, f"Status: {decision} ({risk_level} Risk)")
        
        # Risk Score Box (professional bordered)
        score_y = box_y - 30*mm
        c.setLineWidth(0.8)
        c.rect(20*mm, score_y, 60*mm, 25*mm, stroke=1, fill=0)
        
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(50*mm, score_y + 15*mm, str(risk_score))
        
        c.setFont("Helvetica", 9)
        c.drawCentredString(50*mm, score_y + 8*mm, "RISK SCORE (/100)")
        
        # Decision Box (professional bordered)
        c.rect(90*mm, score_y, 100*mm, 25*mm, stroke=1, fill=0)
        
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(140*mm, score_y + 14*mm, decision.upper())
        
        c.setFont("Helvetica", 9)
        c.drawCentredString(140*mm, score_y + 7*mm, f"Risk Level: {risk_level}")
        
        # Tables for detailed analysis
        y_pos = score_y - 10*mm
        
        # Get score breakdown if available
        score_breakdown = []
        if analysis_result and isinstance(analysis_result, dict):
            risk_analysis = analysis_result.get("risk_score_analysis", {})
            if isinstance(risk_analysis, dict):
                score_breakdown = risk_analysis.get("score_breakdown", [])
        
        # Score Breakdown Table
        if score_breakdown:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(20*mm, y_pos, "Risk Score Calculation Breakdown")
            y_pos -= 5*mm
            
            # Create table data with Paragraph for text wrapping
            header_style = ParagraphStyle('Header', fontSize=8, fontName='Helvetica-Bold', leading=10)
            cell_style = ParagraphStyle('Cell', fontSize=8, fontName='Helvetica', leading=10)
            
            table_data = [[
                Paragraph("Category", header_style),
                Paragraph("Points", header_style),
                Paragraph("Reason", header_style)
            ]]
            for sb in score_breakdown[:8]:  # Show up to 8 rows
                points_str = f"+{sb['points']}" if sb['points'] > 0 else str(sb['points'])
                reason = sb.get('reason', '')
                table_data.append([
                    Paragraph(sb.get('category', ''), cell_style),
                    Paragraph(points_str, cell_style),
                    Paragraph(reason, cell_style)  # Full text with auto-wrap
                ])
            
            # Draw table with better column widths for text wrapping
            table = Table(table_data, colWidths=[42*mm, 15*mm, 103*mm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.Color(245/255, 245/255, 245/255)),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.black),
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(250/255, 250/255, 250/255)]),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            
            # Calculate actual table height
            table_width, table_height = table.wrap(page_width, page_height)
            table.drawOn(c, 20*mm, y_pos - table_height)
            y_pos -= (table_height + 10*mm)
        
        # Risk Flags
        risk_flags = []
        if analysis_result and isinstance(analysis_result, dict):
            risk_flags = analysis_result.get("key_risk_flags", [])
        
        if risk_flags and y_pos > 60*mm:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(20*mm, y_pos, "Key Risk Flags & Findings")
            y_pos -= 5*mm
            
            # Create table with Paragraph for text wrapping
            header_style = ParagraphStyle('Header', fontSize=8, fontName='Helvetica-Bold', leading=10)
            cell_style = ParagraphStyle('Cell', fontSize=8, fontName='Helvetica', leading=10)
            
            # Calculate available space for risk flags
            available_height = y_pos - 25*mm  # Leave margin at bottom
            
            # Limit flags to fit on page
            flags_to_show = risk_flags[:6]  # Show up to 6 flags
            table_data = [[
                Paragraph("Risk Flag", header_style),
                Paragraph("Severity", header_style),
                Paragraph("Description", header_style)
            ]]
            for flag in flags_to_show:
                desc = flag.get('description', '')
                table_data.append([
                    Paragraph(flag.get('flag', ''), cell_style),
                    Paragraph(flag.get('severity', 'Medium'), cell_style),
                    Paragraph(desc, cell_style)  # Full description with auto-wrap
                ])
            
            table = Table(table_data, colWidths=[42*mm, 20*mm, 98*mm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.Color(245/255, 245/255, 245/255)),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.black),
                ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(250/255, 250/255, 250/255)]),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            
            # Calculate actual table height
            table_width, table_height = table.wrap(page_width, page_height)
            table.drawOn(c, 20*mm, y_pos - table_height)
        
        # Footer
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.Color(100/255, 116/255, 139/255))
        c.drawCentredString(page_width/2, 10*mm, "Page 1 of 2")
        
        # ==================== PAGE 2: DECISION JUSTIFICATION ====================
        c.showPage()
        y_pos = page_height - 20*mm
        
        # Section header with lines
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.5)
        c.line(20*mm, y_pos, 190*mm, y_pos)
        
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(colors.black)
        c.drawCentredString(page_width/2, y_pos - 8*mm, "DECISION JUSTIFICATION")
        
        c.line(20*mm, y_pos - 12*mm, 190*mm, y_pos - 12*mm)
        y_pos -= 20*mm
        
        # Recommendation box
        c.setLineWidth(0.8)
        rec_box_y = y_pos
        c.rect(20*mm, rec_box_y - 15*mm, 170*mm, 15*mm, stroke=1, fill=0)
        
        c.setFont("Helvetica-Bold", 16)
        recommendation = decision
        if analysis_result and isinstance(analysis_result, dict):
            dec_just = analysis_result.get("decision_justification", {})
            if isinstance(dec_just, dict):
                recommendation = dec_just.get("recommendation", decision)
        
        c.drawCentredString(page_width/2, rec_box_y - 10*mm, f"RECOMMENDATION: {recommendation.upper()}")
        y_pos -= 25*mm
        
        # Overall Assessment
        if analysis_result and isinstance(analysis_result, dict):
            dec_just = analysis_result.get("decision_justification", {})
            if isinstance(dec_just, dict):
                overall_assessment = dec_just.get("overall_assessment", "")
                if overall_assessment:
                    c.setFont("Helvetica-Bold", 12)
                    c.drawString(20*mm, y_pos, "Overall Assessment:")
                    y_pos -= 7*mm
                    
                    c.setFont("Helvetica", 10)
                    # Wrap text
                    from reportlab.pdfbase.pdfmetrics import stringWidth
                    max_width = 170*mm
                    words = overall_assessment.split()
                    lines = []
                    current_line = []
                    
                    for word in words:
                        test_line = ' '.join(current_line + [word])
                        if stringWidth(test_line, "Helvetica", 10) <= max_width:
                            current_line.append(word)
                        else:
                            if current_line:
                                lines.append(' '.join(current_line))
                            current_line = [word]
                    
                    if current_line:
                        lines.append(' '.join(current_line))
                    
                    for line in lines[:10]:  # Limit lines
                        c.drawString(20*mm, y_pos, line)
                        y_pos -= 5*mm
                    
                    y_pos -= 5*mm
                
                # Strengths and Concerns
                strengths = dec_just.get("strengths", [])
                concerns = dec_just.get("concerns", [])
                
                if strengths or concerns:
                    col_y = y_pos
                    
                    # Strengths (left column)
                    if strengths:
                        c.setFont("Helvetica-Bold", 11)
                        c.drawString(20*mm, col_y, "STRENGTHS")
                        col_y -= 7*mm
                        
                        c.setFont("Helvetica", 9)
                        for idx, strength in enumerate(strengths[:5], 1):  # Limit to 5
                            text = f"{idx}. {strength[:60]}"
                            c.drawString(22*mm, col_y, text)
                            col_y -= 5*mm
                    
                    # Concerns (right column)
                    col_y = y_pos
                    if concerns:
                        c.setFont("Helvetica-Bold", 11)
                        c.drawString(110*mm, col_y, "CONCERNS")
                        col_y -= 7*mm
                        
                        c.setFont("Helvetica", 9)
                        for idx, concern in enumerate(concerns[:5], 1):  # Limit to 5
                            text = f"{idx}. {concern[:50]}"
                            c.drawString(112*mm, col_y, text)
                            col_y -= 5*mm
        
        # Footer
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.Color(100/255, 116/255, 139/255))
        c.drawCentredString(page_width/2, 10*mm, "Page 2 of 2")
        
        # Build PDF
        c.save()
        
        return pdf_path
