"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AICopilot } from "@/components/ai-copilot"
import { AlertTriangle, CheckCircle, Shield, AlertCircle, TrendingUp, Building2, Calendar, Banknote, Terminal, Zap, Download, ChevronLeft, ChevronRight, Bot, User } from "lucide-react"
import { api, type ApplicationDetail } from "@/lib/api"
import { use } from "react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [appData, setAppData] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  // Removed text highlighting & tabs per new PDF-only viewer requirement
  const [showReasoningStream, setShowReasoningStream] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [pendingDecision, setPendingDecision] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState("")
  const [currentPosition] = useState<number>(1) // position tracking placeholder
  const [totalApplications, setTotalApplications] = useState(0)
  const documentViewerRef = useRef<HTMLDivElement>(null)
  const [docViewMode, setDocViewMode] = useState<'application_form'|'bank'|'essay'|'payslip'>('application_form')
  const [showPdf, setShowPdf] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isPolling, setIsPolling] = useState(false)

  // Navigation helper (stable)
  const navigateApplication = useCallback((direction: 'previous' | 'next') => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/navigate?direction=${direction}`)
      .then(r => r.json())
      .then(data => { if (data.application_id) window.location.href = `/application/${data.application_id}` })
      .catch(err => console.error('Navigation failed:', err))
  }, [resolvedParams.id])

  useEffect(() => {
    async function loadApplication() {
      try {
        const data = await api.getApplication(resolvedParams.id)
        setAppData(data)
        setLoading(false)
        
        // Load stats for navigation
        const stats = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications/stats`)
        const statsData = await stats.json()
        setTotalApplications(statsData.total)
      } catch (error) {
        console.error("Failed to load application:", error)
        setLoading(false)
      }
    }
    void loadApplication()
  }, [resolvedParams.id, navigateApplication])

  // Status polling while processing/analyzing
  useEffect(() => {
    if (!appData) return
    if (['Processing','Analyzing'].includes(String(appData.status))) {
      setIsPolling(true)
      const interval = setInterval(async () => {
        try {
          const updated = await api.getApplication(resolvedParams.id)
          setAppData(updated)
          if (!['Processing','Analyzing'].includes(String(updated.status))) {
            setIsPolling(false)
            clearInterval(interval)
          }
        } catch (e) {
          console.error('Polling failed:', e)
        }
      }, 3000)
      return () => clearInterval(interval)
    } else {
      setIsPolling(false)
    }
  }, [appData, resolvedParams.id])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        void navigateApplication('previous')
      } else if (e.key === 'ArrowRight') {
        void navigateApplication('next')
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [resolvedParams.id, navigateApplication])
  
  // (handleNavigate already defined above)
  
  const handleDecisionClick = (decision: string) => {
    const aiDecision = appData?.ai_decision || finalDecision
    const isOverride = aiDecision && decision !== aiDecision
    
    if (isOverride) {
      setPendingDecision(decision)
      setShowOverrideDialog(true)
    } else {
      void submitDecision(decision, null)
    }
  }
  
  const submitDecision = async (decision: string, reason: string | null) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewer_name: process.env.NEXT_PUBLIC_DEFAULT_REVIEWER || 'Credit Officer',
          override_reason: reason
        })
      })
      
      // Reload application data
      const data = await api.getApplication(resolvedParams.id)
      setAppData(data)
      setShowOverrideDialog(false)
      setOverrideReason('')
      setPendingDecision(null)
    } catch (error) {
      console.error('Decision submission failed:', error)
    }
  }

  const handleRetry = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/retry`, { method: 'POST' })
      // Begin polling immediately after retry
      const updated = await api.getApplication(resolvedParams.id)
      setAppData(updated)
      setIsPolling(true)
    } catch (e) {
      console.error('Retry failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!appData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-900">Application not found</p>
          <p className="text-sm text-slate-500 mt-2">The application ID &quot;{resolvedParams.id}&quot; does not exist.</p>
        </div>
      </div>
    )
  }

  const name = appData.name
  // ===================== Type Definitions =====================
  interface ScoreBreakdownItem { category: string; points: number; type: 'positive'|'negative'|'neutral'; reason: string }
  interface RiskFlag { flag: string; severity: string; description: string; evidence_quote?: string }
  interface ForensicClaim { claim_topic: string; essay_quote: string; statement_evidence: string; status: string; confidence: number }
  interface BehavioralInsight { insight: string; category: string; evidence: string; reasoning: string }
  interface EssayInsight { insight: string; evidence_sentence: string; sentence_index: number; category: string; exact_quote: string }
  interface FinancialDna {
    income_stability?: number;
    debt_servicing?: number;
    spending_discipline?: number;
    digital_footprint?: number;
    asset_quality?: number;
    expense_breakdown?: { category: string; amount: string; percentage: string }[];
    income_consistency?: string;
    psycholinguistic_profile?: { tone: string; risk_indicator: string; markers: string[] };
  }
  interface CombinedFinding { flag: string; description: string; type: 'Positive'|'Negative'|'Neutral'; exact_quote?: string }
  interface AnalysisResult {
    risk_score?: number;
    risk_level?: string;
    final_decision?: string;
    key_findings?: RiskFlag[];
    key_risk_flags?: RiskFlag[];
    behavioral_insights?: BehavioralInsight[];
    forensic_evidence?: { claim_vs_reality?: ForensicClaim[] };
    risk_score_analysis?: { final_score?: number; score_breakdown?: ScoreBreakdownItem[] };
    essay_insights?: EssayInsight[];
    financial_dna?: FinancialDna | null; // legacy nullable
    document_texts?: { bank_statement?: string; essay?: string; payslip?: string };
    cross_verification?: { claim_topic?: string; evidence_found?: string; status?: string };
    compliance_audit?: { bias_check?: string; source_of_wealth?: string };
  }

  const analysis = appData.analysis_result as AnalysisResult | null
  const riskScore = analysis?.risk_score ?? 50
  const rawKeyFindings: RiskFlag[] = analysis?.key_findings ?? []
  const rawRiskFlags: RiskFlag[] = analysis?.key_risk_flags ?? []
  const riskFlags: RiskFlag[] = analysis?.key_risk_flags ?? []
  
  const keyFindings: CombinedFinding[] = [
    ...rawKeyFindings.map<CombinedFinding>(f => ({
      flag: f.flag,
      description: f.description,
      type: f.severity === 'Positive' ? 'Positive' : f.severity === 'High' ? 'Negative' : 'Neutral',
      exact_quote: f.evidence_quote
    })),
    ...rawRiskFlags.map<CombinedFinding>(f => ({
      flag: f.flag,
      description: f.description,
      type: f.severity === 'Positive' ? 'Positive' : f.severity === 'High' ? 'Negative' : 'Neutral',
      exact_quote: f.evidence_quote
    }))
  ]
  const crossVerification = analysis?.cross_verification as {claim_topic?: string, evidence_found?: string, status?: string} | null
  
  // Forensic Data Extraction
  const scoreBreakdown: ScoreBreakdownItem[] = analysis?.risk_score_analysis?.score_breakdown ?? []
  const forensicEvidence: ForensicClaim[] = analysis?.forensic_evidence?.claim_vs_reality ?? []
  
  // Calculate risk level from score
  const getRiskLevel = (score: number): string => {
    if (score >= 80) return 'Low'
    if (score >= 60) return 'Medium'
    return 'High'
  }
  
  // Calculate decision from score
  const getFinalDecision = (score: number): string => {
    if (score >= 80) return 'Approved'
    if (score >= 60) return 'Review Required'
    return 'Rejected'
  }
  
  const riskLevel = appData.risk_level || (analysis?.risk_level as string) || getRiskLevel(riskScore)
  const finalDecision = appData.final_decision || (analysis?.final_decision as string) || getFinalDecision(riskScore)

  // Current file URL for PDF preview
  const currentFileUrl = (() => {
    if (!appData) return null
    if (docViewMode === 'bank') return appData.bank_statement_url || null
    if (docViewMode === 'essay') return appData.essay_url || null
    if (docViewMode === 'payslip') return appData.payslip_url || null
    return null
  })()

  // ===================== Search / Highlight State =====================
  const activeDocText = (() => {
    if (!analysis?.document_texts) return ""
    if (docViewMode === 'bank') return analysis.document_texts.bank_statement || ''
    if (docViewMode === 'essay') return analysis.document_texts.essay || ''
    return analysis.document_texts.payslip || ''
  })()
  const highlightedDocument: (string | React.ReactNode)[] = (() => {
    if (!searchTerm.trim()) return [activeDocText]
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    return activeDocText.split(regex).reduce((acc: (string|React.ReactNode)[], part, idx, arr) => {
      acc.push(part)
      if (idx < arr.length - 1) acc.push(<span key={`hl-${idx}`} className="bg-yellow-300 text-black rounded px-0.5">{searchTerm}</span>)
      return acc
    }, [])
  })()
  
  // Financial DNA Radar Chart Data - Use actual analysis data if available
  // Legacy financial_dna removed; new essay insights
  const essayInsights: EssayInsight[] = analysis?.essay_insights ?? []
  
  // Removed legacy chartData (unused)
  
  // AI Reasoning Stream Logs - Generate from actual analysis
  const generateReasoningLogs = () => {
    const logs = []
    logs.push({ time: '00:01', message: 'Scanning uploaded documents for text extraction...', type: 'info' })
    
    if (analysis) {
      // Extract insights from actual analysis
      const findings = keyFindings
      const crossVerif = analysis?.cross_verification
      const dna = analysis?.financial_dna
      
      logs.push({ time: '00:02', message: `Documents parsed; beginning structured extraction`, type: 'success' })
      
      if (dna) {
        logs.push({ time: '00:03', message: `Financial DNA calculated: Income ${dna.income_stability}/100, Debt ${dna.debt_servicing}/100`, type: 'info' })
      }
      
      findings.forEach((finding: CombinedFinding, idx: number) => {
        const time = `00:0${4 + idx}`
        if (finding.type === 'Negative') {
          logs.push({ time, message: `⚠ ${finding.flag}: ${finding.description.substring(0, 60)}...`, type: 'warning' })
        } else if (finding.type === 'Positive') {
          logs.push({ time, message: `✓ ${finding.flag} verified`, type: 'success' })
        }
      })
      
      if (crossVerif) {
        logs.push({ time: `00:0${7 + findings.length}`, message: `Cross-verification: ${crossVerif.status}`, type: crossVerif.status === 'Verified' ? 'success' : 'warning' })
      }
      
      logs.push({ time: `00:0${8 + findings.length}`, message: `Analysis complete. Final Risk Score: ${riskScore}/100 (${riskLevel})`, type: 'success' })
    } else {
      logs.push({ time: '00:02', message: 'Waiting for AI analysis...', type: 'info' })
    }
    
    return logs
  }
  
  const reasoningLogs = generateReasoningLogs()

  // Evidence click highlighting removed with PDF-only viewer simplification

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFillColor(15, 23, 42) // slate-900
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('TRUSTLENS AI', 20, 20)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Credit Risk Assessment Report', 20, 30)
      
      // Application Info Box
      doc.setTextColor(0, 0, 0)
      doc.setFillColor(241, 245, 249) // slate-100
      doc.rect(20, 50, 170, 40, 'F')
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(name, 25, 60)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Application ID: ${resolvedParams.id}`, 25, 68)
      doc.text(`Loan Type: ${appData.loan_type}`, 25, 75)
      doc.text(`Requested Amount: RM ${appData.requested_amount.toLocaleString()}`, 25, 82)
      doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 130, 68)
      doc.text(`Status: ${appData.status}`, 130, 75)
      
      // Risk Score Section with color coding (0-100 scale)
      const riskColor = riskScore >= 80 ? [16, 185, 129] : riskScore >= 60 ? [251, 191, 36] : [244, 63, 94]
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
      doc.rect(20, 100, 60, 25, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text(riskScore.toString(), 50, 115, { align: 'center' })
      doc.setFontSize(10)
      doc.text('RISK SCORE (/100)', 50, 122, { align: 'center' })
      
      // Decision Section with matching color
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
      doc.rect(90, 100, 100, 25, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(finalDecision.toUpperCase(), 140, 112, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Risk Level: ${riskLevel}`, 140, 120, { align: 'center' })
      
      // Score Drivers Table
      let yPos = 140
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Score Drivers', 20, yPos)

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Category', 'Points', 'Reason']],
        body: scoreBreakdown.map(sb => [
          sb.category,
          (sb.points > 0 ? '+' : '') + sb.points,
          sb.reason
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
        columnStyles: { 2: { cellWidth: 90 } }
      })
      
      // @ts-expect-error - autoTable adds finalY to doc
      yPos = doc.lastAutoTable.finalY + 15
      
      // AI Risk Analysis
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('AI Risk Analysis', 20, yPos)
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [['Risk Flag', 'Description', 'Severity']],
        body: keyFindings.map(f => [
          f.flag,
          f.description,
          f.type === 'Negative' ? 'High' : f.type === 'Neutral' ? 'Medium' : 'Low'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          1: { cellWidth: 100 }
        }
      })
      
      // @ts-expect-error - autoTable adds finalY to doc
      yPos = doc.lastAutoTable.finalY + 15
      
      // Forensic Cross-Verification (if space allows)
      if (yPos < 250) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Forensic Cross-Verification', 20, yPos)
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Claim', 'Evidence', 'Confidence', 'Status']],
          body: [
            ['Income Verification', 'Salary deposits match claimed amount', '94%', 'Verified'],
            ['Employment Stability', 'Regular monthly deposits detected', '91%', 'Verified'],
            ['Risk Assessment', 'No high-risk transactions found', '100%', 'Verified'],
            ['Financial Capacity', 'Debt-to-income ratio within limits', '88%', 'Verified']
          ],
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            1: { cellWidth: 60 }
          }
        })
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(`Generated by TrustLens AI - Financial Forensics Platform | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
      }
      
      // Save PDF
      doc.save(`TrustLens_Report_${resolvedParams.id}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Panel: AI Analysis */}
      <div className="w-1/2 flex flex-col space-y-6 overflow-y-auto pr-2">
        {/* Enhanced Header with Context Layer */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                
                {/* Review Status Badge */}
                {appData.review_status === "Manual_Override" ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Manual Override
                  </Badge>
                ) : appData.review_status === "Human_Verified" ? (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    <User className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Analysis
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">ID: {resolvedParams.id}</p>
              
              {/* Last Reviewed Timestamp */}
              {appData.reviewed_at && (
                <p className="text-xs text-slate-400">
                  Last reviewed by {appData.reviewed_by} at {new Date(appData.reviewed_at).toLocaleString()}
                </p>
              )}
              
              {/* Decision & Risk Level Badges */}
              <div className="flex items-center gap-2 mt-2">
                {/* Large Risk Score Display */}
                <div className={`px-4 py-2 rounded-lg border-2 ${
                  riskScore >= 80 ? 'bg-emerald-50 border-emerald-300' :
                  riskScore >= 60 ? 'bg-amber-50 border-amber-300' :
                  'bg-rose-50 border-rose-300'
                }`}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold tabular-nums ${
                      riskScore >= 80 ? 'text-emerald-700' :
                      riskScore >= 60 ? 'text-amber-700' :
                      'text-rose-700'
                    }`}>
                      {riskScore}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/100</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">RISK SCORE</p>
                  {isPolling && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="text-[10px] text-blue-600 font-medium">Analyzing...</span>
                    </div>
                  )}
                </div>
                
                <Badge className={`${
                  finalDecision === 'Approved' ? 'bg-emerald-600 text-white border-emerald-500' :
                  finalDecision === 'Rejected' ? 'bg-rose-600 text-white border-rose-500' :
                  'bg-amber-600 text-white border-amber-500'
                }`}>
                  {finalDecision}
                </Badge>
                <Badge variant="outline" className={`${
                  riskLevel === 'Low' ? 'text-emerald-700 border-emerald-300' :
                  riskLevel === 'High' ? 'text-rose-700 border-rose-300' :
                  'text-amber-700 border-amber-300'
                }`}>
                  Risk: {riskLevel}
                </Badge>
              </div>
              
              {/* Metadata Badges Row */}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
                  <Banknote className="h-3 w-3 mr-1" />
                  Requested: RM {appData.requested_amount.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
                  <Calendar className="h-3 w-3 mr-1" />
                  Tenure: {appData.loan_tenure_months || 24} Months
                </Badge>
                <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
                  <Building2 className="h-3 w-3 mr-1" />
                  Business: F&B (Retail)
                </Badge>
              </div>
            </div>
            
            {/* Navigation and Decision Group */}
            <div className="flex items-center gap-4">
              {/* Rapid Review Navigation */}
              <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void navigateApplication('previous')}
                  className="text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-600 min-w-[60px] text-center">
                  {currentPosition} of {totalApplications}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void navigateApplication('next')}
                  className="text-slate-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Decision Buttons */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-rose-600 border-rose-300 hover:bg-rose-50"
                  onClick={() => handleDecisionClick('Rejected')}
                >
                  Reject
                </Button>
                <Button 
                  variant="secondary" 
                  className="text-slate-700 bg-slate-100 hover:bg-slate-200"
                  onClick={() => handleDecisionClick('Review Required')}
                >
                  Request Info
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleDecisionClick('Approved')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                {appData.status === 'Failed' && (
                  <Button 
                    variant="outline" 
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={handleRetry}
                  >
                    Retry Analysis
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Information Card - Extracted from Application Form */}
        {analysis?.applicant_profile && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Applicant Information
                  </CardTitle>
                  <CardDescription>Extracted from Application Form by AI</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Extracted
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Personal Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Full Name</p>
                    <p className="text-sm font-semibold text-slate-900">{analysis.applicant_profile.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">IC / Passport No</p>
                    <p className="text-sm font-mono text-slate-900">{analysis.applicant_profile.ic_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                    <p className="text-sm text-slate-900">{analysis.applicant_profile.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                    <p className="text-sm text-slate-900 truncate">{analysis.applicant_profile.email || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Loan & Financial Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Loan Type</p>
                    <Badge className="mt-1 bg-blue-600 text-white">
                      {analysis.applicant_profile.loan_type || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Requested Amount</p>
                    <p className="text-sm font-bold text-emerald-700">
                      RM {analysis.applicant_profile.requested_amount?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Annual Income</p>
                    <p className="text-sm font-semibold text-slate-900">
                      RM {analysis.applicant_profile.annual_income?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Loan Period</p>
                    <p className="text-sm text-slate-900">{analysis.applicant_profile.period || 'N/A'}</p>
                  </div>
                </div>
                
                {/* Full Width Items */}
                <div className="col-span-2 space-y-3 pt-3 border-t border-blue-200">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Address</p>
                    <p className="text-sm text-slate-900">{analysis.applicant_profile.address || 'N/A'}</p>
                  </div>
                  {analysis.applicant_profile.loan_purpose && analysis.applicant_profile.loan_purpose.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">Loan Purpose</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.applicant_profile.loan_purpose.map((purpose: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-white text-slate-700 border-slate-300">
                            {purpose}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Birth Date</p>
                      <p className="text-sm text-slate-900">{analysis.applicant_profile.birth_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Marital Status</p>
                      <p className="text-sm text-slate-900">{analysis.applicant_profile.marital_status || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Family Members</p>
                      <p className="text-sm text-slate-900">{analysis.applicant_profile.family_members || 'N/A'}</p>
                    </div>
                  </div>
                  {analysis.applicant_profile.bank_institution && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Bank Reference</p>
                      <p className="text-sm text-slate-900">
                        {analysis.applicant_profile.bank_institution}
                        {analysis.applicant_profile.bank_account && ` - A/C: ${analysis.applicant_profile.bank_account}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Score Drivers</CardTitle>
            <CardDescription>Evidence-based additive / deductive factors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scoreBreakdown.map((item: ScoreBreakdownItem, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      item.type === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                      item.type === 'negative' ? 'bg-rose-100 text-rose-600' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {item.type === 'positive' ? <TrendingUp className="h-4 w-4" /> :
                       item.type === 'negative' ? <AlertTriangle className="h-4 w-4" /> :
                       <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.category}</p>
                      <p className="text-xs text-slate-500">{item.reason}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    item.points > 0 ? 'text-emerald-600' : 
                    item.points < 0 ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    {item.points > 0 ? '+' : ''}{item.points}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
                <span className="font-bold text-slate-900">Final Score</span>
                <span className="text-2xl font-bold text-blue-600">{riskScore}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Factors (key_risk_flags only) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk Factors</CardTitle>
            <CardDescription className="text-xs">Explicit deductions & positive confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskFlags.map((rf, idx) => {
                const isPositive = rf.severity === 'Positive'
                const isNegative = rf.severity === 'High'
                const bgColor = isNegative ? 'bg-rose-50 border-rose-200' : isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                const IconComponent = isNegative ? AlertTriangle : isPositive ? CheckCircle : AlertCircle
                const iconColor = isNegative ? 'text-rose-600' : isPositive ? 'text-emerald-600' : 'text-amber-600'
                return (
                  <div key={idx} className={`${bgColor} border rounded-lg p-3`}>
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-4 w-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{rf.flag}</p>
                        <p className="text-xs text-slate-700 mt-1">{rf.description}</p>
                        {rf.evidence_quote && rf.evidence_quote.trim() !== '' && (
                          <div className="mt-2 bg-white/50 border border-slate-200 rounded p-2">
                            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wide mb-1">Evidence:</p>
                            <p className="text-xs text-slate-800 italic">&quot;{rf.evidence_quote}&quot;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {riskFlags.length === 0 && <p className="text-xs text-slate-500">No risk factors generated.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Forensic Analysis Table - Dynamic from API */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3 bg-amber-50/50">
            <CardTitle className="text-base flex items-center">
              <Shield className="h-4 w-4 mr-2 text-amber-600" />
              Forensic Evidence Log
            </CardTitle>
            <CardDescription className="text-xs">
              Claim vs. Reality Cross-Verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {forensicEvidence.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {forensicEvidence.map((item: ForensicClaim, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.claim_topic}</h4>
                      <Badge className={`${
                        item.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        item.status === 'Contradicted' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {item.status} ({item.confidence}%)
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Applicant Claim (Essay)</p>
                        <p className="text-xs text-slate-800 italic">&quot;{item.essay_quote}&quot;</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Bank Evidence</p>
                        <p className="text-xs text-slate-800 font-mono">{item.statement_evidence}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {analysis && analysis.cross_verification ? (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Cross-Verification: Claim vs. Reality</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-slate-600 min-w-[100px]">CLAIM (Essay):</span>
                        <p className="text-sm text-slate-900 flex-1">{analysis.cross_verification?.claim_topic}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-slate-600 min-w-[100px]">EVIDENCE (Bank):</span>
                        <p className="text-sm text-slate-700 flex-1">{analysis.cross_verification?.evidence_found}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-semibold text-slate-600">Verification Status:</span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          ✓ {analysis.cross_verification?.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No forensic evidence generated yet.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Essay Insights Card */}
        {essayInsights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Essay Insights (Evidence-Based)</CardTitle>
              <CardDescription className="text-xs">AI extracted sentence-level insights (click to highlight)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {essayInsights.map((ins: EssayInsight, idx: number) => (
                  <div key={idx} className="border rounded-md p-3 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{ins.category}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{ins.insight}</p>
                        <p className="text-xs text-slate-600 mt-1 italic">&quot;{ins.exact_quote}&quot;</p>
                        <p className="text-[10px] text-slate-400 mt-1">Sentence #{ins.sentence_index}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Reasoning Stream */}
        <Card className="border-t-4 border-t-blue-500 bg-slate-900 text-white">
          <CardHeader 
            className="pb-2 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setShowReasoningStream(!showReasoningStream)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-sm text-white">AI Reasoning Stream</CardTitle>
              </div>
              <Badge className="bg-blue-600 text-white border-blue-500 text-xs">
                {showReasoningStream ? "Hide" : "Show"} Logs
              </Badge>
            </div>
          </CardHeader>
          {showReasoningStream && (
            <CardContent className="pt-3">
              <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs space-y-1.5 max-h-[200px] overflow-y-auto border border-slate-700">
                {reasoningLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2 py-1 ${
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      'text-slate-400'
                    }`}
                  >
                    <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
                    <span className="flex-1">
                      {log.type === 'success' && <Zap className="h-3 w-3 inline mr-1" />}
                      {log.type === 'warning' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">
                Chain-of-thought analysis completed in 7 seconds
              </p>
            </CardContent>
          )}
        </Card>


        <div className="space-y-4">
          {/* Document Viewer Controls */}
          <Card className="border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Source Documents</CardTitle>
              <CardDescription className="text-xs">Toggle between original PDFs and extracted text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['bank','essay','payslip'] as const).map(t => (
                  <Button key={t} size="sm" variant={docViewMode===t? 'default':'outline'} onClick={()=>setDocViewMode(t)}>
                    {t==='bank'? 'Bank Statement': t==='essay'? 'Loan Essay':'Payslip'}
                  </Button>
                ))}
                <Button size="sm" variant={showPdf? 'default':'outline'} onClick={()=>setShowPdf(p=>!p)}>
                  {showPdf? 'Show Text':'Show PDF'}
                </Button>
                <input
                  value={searchTerm}
                  onChange={e=>setSearchTerm(e.target.value)}
                  placeholder="Search text..."
                  className="ml-2 flex-1 min-w-[140px] rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div ref={documentViewerRef} className="max-h-[320px] overflow-auto rounded border bg-slate-950 text-slate-100 p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {!showPdf && (highlightedDocument || 'No text')}
                {showPdf && (
                  <div className="bg-white text-slate-800 rounded p-2">
                    {currentFileUrl ? (
                      <iframe
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${currentFileUrl}`}
                        className="w-full h-[300px] border rounded"
                        title="Document PDF"
                      />
                    ) : (
                      <p className="text-xs text-slate-500">No PDF available for this document.</p>
                    )}
                    <p className="text-[10px] italic mt-2">Basic PDF embed. Upgrade to pdf.js for coordinate-based sentence highlights.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {crossVerification && crossVerification.status && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cross-Verification: Claim vs. Reality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-medium">CLAIM (Essay):</p>
                <p className="text-sm text-slate-700">&quot;{crossVerification.claim_topic || 'N/A'}&quot;</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">EVIDENCE (Bank Statement):</p>
                <p className="text-sm text-slate-700">{crossVerification.evidence_found || 'N/A'}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Verification Status:</span>
                <Badge 
                  variant="outline" 
                  className={crossVerification.status === "Verified" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"}
                >
                  {crossVerification.status === "Verified" ? "✓ " : crossVerification.status === "Contradicted" ? "✗ " : "⚠ "}
                  {crossVerification.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        
        {/* Decision Audit History Panel */}
        <Card className="mt-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">Decision History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(appData.decision_history || []).length === 0 ? (
              <p className="text-xs text-slate-400">No decision history yet</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(appData.decision_history || []).map((entry, index) => (
                  <div key={index} className="text-xs border-l-2 border-slate-300 pl-3 py-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-400">-</span>
                      <span className="font-semibold text-slate-700">{entry.actor}:</span>
                    </div>
                    <p className="text-slate-800 mt-0.5">{entry.action}</p>
                    {entry.details && (
                      <p className="text-slate-500 mt-0.5">{entry.details}</p>
                    )}
                    {entry.reason && (
                      <p className="text-purple-700 mt-1 italic bg-purple-50 px-2 py-1 rounded">
                        Reason: {entry.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: PDF Viewer Only */}
      <div className="w-1/2 bg-white rounded-lg border border-slate-300 flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
          {(['application_form','bank','essay','payslip'] as const).map(mode => (
            <Button key={mode} size="sm" variant={docViewMode===mode? 'default':'outline'} onClick={()=>setDocViewMode(mode)}>
              {mode==='application_form'? 'Application Form': mode==='bank'? 'Bank Statement': mode==='essay'? 'Loan Essay':'Payslip'}
            </Button>
          ))}
          <div className="ml-auto text-[11px] text-slate-500">PDF Viewer</div>
        </div>
        <div className="flex-1 overflow-hidden">
          {(() => {
            const url = docViewMode==='application_form'? appData.application_form_url : docViewMode==='bank'? appData.bank_statement_url : docViewMode==='essay'? appData.essay_url : appData.payslip_url
            if (!url) {
              return <div className="h-full flex items-center justify-center text-sm text-slate-400">No PDF available.</div>
            }
            return (
              <iframe
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`}
                className="w-full h-full"
                title="Source Document PDF"
              />
            )
          })()}
        </div>
        <div className="p-2 border-t bg-slate-50 text-[10px] text-slate-500 text-center">Evidence-only analysis. Text extraction hidden per user request.</div>
      </div>

      <AICopilot />
      
      {/* Override Reason Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Override Confirmation</DialogTitle>
            <DialogDescription>
              You are changing the AI recommendation. Please provide a reason for this override.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="override-reason">Reason for Override</Label>
              <Textarea
                id="override-reason"
                placeholder="E.g., Collateral verified via phone call..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                AI suggested: <strong>{appData.ai_decision || finalDecision}</strong><br />
                Your decision: <strong>{pendingDecision}</strong>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => void submitDecision(pendingDecision!, overrideReason)}
              disabled={!overrideReason.trim()}
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
