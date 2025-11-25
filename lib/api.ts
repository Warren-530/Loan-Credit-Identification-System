import { API_CONFIG } from "@/lib/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface Application {
  id: string;
  name: string;
  type: string;
  amount: string;
  score: number;
  status: string;
  date: string;
  review_status?: string;
  ai_decision?: string;
  human_decision?: string;
  requested_amount?: number;
  loan_type?: string;
  applicant_name?: string;
  applicant_ic?: string;
  application_id?: string;
  created_at?: string;
}

export interface ApplicationDetail {
  id: string;
  name: string;
  ic: string;
  loan_type: string;
  requested_amount: number;
  loan_tenure_months?: number;
  status: string;
  risk_score: number;
  risk_level: string;
  final_decision: string;
  ai_decision?: string;
  review_status?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  decision_history?: Array<{
    timestamp: string;
    actor: string;
    action: string;
    details?: string;
    reason?: string;
  }>;
  created_at: string;
  analysis_result: Record<string, unknown> | null;
  document_texts?: {
    bank_statement?: string;
    essay?: string;
    payslip?: string;
  };
  application_form_url?: string;
  bank_statement_url?: string;
  essay_url?: string;
  payslip_url?: string;
  file_metadata?: {
    application_form?: { filename: string; size_bytes: number; mime_type: string } | null;
    bank_statement?: { filename: string; size_bytes: number; mime_type: string } | null;
    loan_essay?: { filename: string; size_bytes: number; mime_type: string } | null;
    payslip?: { filename: string; size_bytes: number; mime_type: string } | null;
  };
}

export const api = {
  async getApplications(): Promise<Application[]> {
    const response = await fetch(`${API_BASE_URL}/api/applications`);
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  },

  async getApplication(id: string): Promise<ApplicationDetail> {
    const response = await fetch(`${API_BASE_URL}/api/application/${id}`);
    if (!response.ok) throw new Error('Failed to fetch application');
    return response.json();
  },

  async uploadApplication(formData: FormData): Promise<{ success: boolean; application_id: string; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("API Upload Error:", error);
      throw error;
    }
  },

  async getStatus(applicationId: string): Promise<{ application_id: string; status: string; risk_score: number; final_decision: string }> {
    const response = await fetch(`${API_BASE_URL}/api/status/${applicationId}`);
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  },

  async deleteApplication(applicationId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/application/${applicationId}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Delete failed", e);
    }
  },
};
