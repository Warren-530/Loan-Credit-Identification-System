"""
AI Engine for document analysis using Google Gemini
"""
import json
import re
from typing import Dict, Any
import google.generativeai as genai
from prompts import build_prompt


class AIEngine:
    def __init__(self, api_key: str):
        """Initialize Gemini AI with API key"""
        genai.configure(api_key=api_key)
        self.model_name = "gemini-2.0-flash-exp"
    
    def analyze_application(self, loan_type: str, raw_text: str, bank_text: str = "", essay_text: str = "", payslip_text: str = "", application_id: str = "") -> Dict[str, Any]:
        """
        Analyze loan application using Gemini AI
        
        Args:
            loan_type: Type of loan (Micro-Business, Personal, Housing, Car)
            raw_text: Extracted text from documents
            bank_text: Extracted bank statement text for display
            essay_text: Extracted essay text for display
            payslip_text: Extracted payslip text for display
            application_id: Unique application ID for context isolation
            
        Returns:
            Analysis result as dictionary with document_texts attached
        """
        try:
            # Build the prompt with application ID for context
            prompt = build_prompt(loan_type, raw_text, application_id)
            
            # Call Gemini API
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            
            # Extract JSON from response
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            result_text = re.sub(r'^```json\s*', '', result_text)
            result_text = re.sub(r'\s*```$', '', result_text)
            
            # Parse JSON
            result = json.loads(result_text)
            
            # Attach original document texts for frontend display
            result['document_texts'] = {
                'bank_statement': bank_text,
                'essay': essay_text,
                'payslip': payslip_text
            }
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Raw response: {result_text}")
            # Return a fallback structure
            return {
                "applicant_summary": "Error parsing AI response",
                "risk_score": 50,
                "risk_level": "Medium",
                "final_decision": "Review Required",
                "key_findings": [
                    {
                        "type": "Neutral",
                        "flag": "Processing Error",
                        "description": "Unable to complete AI analysis. Manual review required.",
                        "exact_quote": ""
                    }
                ],
                "cross_verification": {
                    "claim_topic": "N/A",
                    "evidence_found": "N/A",
                    "status": "Inconclusive"
                },
                "compliance_audit": {
                    "bias_check": "N/A",
                    "source_of_wealth": "N/A",
                    "aml_screening": "N/A"
                },
                "financial_dna": {
                    "income_stability": 50,
                    "debt_servicing": 50,
                    "spending_discipline": 50,
                    "digital_footprint": 50,
                    "asset_quality": 50
                },
                "document_texts": {
                    "bank_statement": bank_text,
                    "essay": essay_text
                }
            }
        except Exception as e:
            print(f"AI Engine Error: {e}")
            raise
