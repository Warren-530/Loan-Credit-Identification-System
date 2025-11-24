// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  ENDPOINTS: {
    APPLICATIONS: '/api/applications',
    UPLOAD: '/api/upload',
    ANALYSIS: '/api/analysis'
  }
};

// App Configuration
export const APP_CONFIG = {
  DEFAULT_REVIEWER: process.env.NEXT_PUBLIC_DEFAULT_REVIEWER || 'Credit Officer',
  CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || 'RM',
  DEFAULT_TENURE: parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENURE || '24'),
  
  LOAN_TYPES: [
    'Micro-Business Loan',
    'Personal Loan', 
    'Car Loan',
    'Housing Loan'
  ] as const
};

export type LoanType = typeof APP_CONFIG.LOAN_TYPES[number];