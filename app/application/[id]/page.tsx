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
import { AlertTriangle, CheckCircle, Shield, AlertCircle, TrendingUp, Building2, Calendar, Banknote, Terminal, Zap, Download, ChevronLeft, ChevronRight, Bot, User, MessageSquare, FileText, ArrowLeft } from "lucide-react"
import { api, type ApplicationDetail } from "@/lib/api"
import { use } from "react"
import Link from "next/link"
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
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showLockConfirmDialog, setShowLockConfirmDialog] = useState(false)
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [emailResult, setEmailResult] = useState<{success: boolean; message: string} | null>(null)
  const [commentText, setCommentText] = useState("")
  const [pendingDecision, setPendingDecision] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState("")
  const [currentPosition] = useState<number>(1) // position tracking placeholder
  const [totalApplications, setTotalApplications] = useState(0)
  const documentViewerRef = useRef<HTMLDivElement>(null)
  const [docViewMode, setDocViewMode] = useState<'application_form'|'bank'|'essay'|'payslip'|'supporting_1'|'supporting_2'|'supporting_3'>('application_form')
  const [showPdf, setShowPdf] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isPolling, setIsPolling] = useState(false)
  
  // Resizable Split View State
  const [leftPanelWidth, setLeftPanelWidth] = useState(50) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    
    // Limit width between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftPanelWidth(newLeftWidth)
    }
  }, [])

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [onMouseMove, onMouseUp])

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
    // Check if decision is already locked
    if (appData?.decision_locked) {
      alert('Decision is locked and cannot be changed.')
      return
    }
    
    const aiDecision = appData?.ai_decision || finalDecision
    const isOverride = aiDecision && decision !== aiDecision
    
    setPendingDecision(decision)
    
    if (isOverride) {
      // Override case: show override reason dialog
      setShowOverrideDialog(true)
    } else {
      // Same as AI: directly submit verify then show lock dialog
      submitDecisionAndShowLock(decision, null)
    }
  }
  
  const submitDecisionAndShowLock = async (decision: string, reason: string | null) => {
    try {
      // Submit decision (verify)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewer_name: process.env.NEXT_PUBLIC_DEFAULT_REVIEWER || 'Credit Officer',
          override_reason: reason
        })
      })
      
      const result = await response.json()
      console.log('Decision verified, response:', result)
      
      // Reload application data to update review_status
      const data = await api.getApplication(resolvedParams.id)
      console.log('Reloaded app data after verify, review_status:', data.review_status)
      setAppData(data)
      
      // Show lock confirmation dialog
      setShowOverrideDialog(false)
      setOverrideReason('')
      setShowLockConfirmDialog(true)
      
    } catch (error) {
      console.error('Decision submission failed:', error)
    }
  }
  
  const submitDecision = async (decision: string, reason: string | null) => {
    // This is called from the override dialog
    await submitDecisionAndShowLock(decision, reason)
  }
  
  const handleLockDecision = async () => {
    setIsLocking(true)
    try {
      // Lock the decision
      const lockResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/lock-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: process.env.NEXT_PUBLIC_DEFAULT_REVIEWER || 'Credit Officer'
        })
      })
      
      const lockResult = await lockResponse.json()
      console.log('Decision locked, response:', lockResult)
      
      // Reload application data
      const data = await api.getApplication(resolvedParams.id)
      console.log('Reloaded app data after lock:', {
        decision_locked: data.decision_locked,
        email_sent: data.email_sent,
        email_status: data.email_status,
        review_status: data.review_status
      })
      setAppData(data)
      setShowLockConfirmDialog(false)
      setPendingDecision(null)
      
      // If auto mode and email was sent, show notification
      if (lockResult.email_sent) {
        setEmailResult({ success: true, message: 'Email notification sent automatically' })
        setTimeout(() => setEmailResult(null), 5000)
      } else if (lockResult.email_mode === 'manual') {
        // In manual mode, show send email dialog
        setShowSendEmailDialog(true)
      }
      
    } catch (error) {
      console.error('Lock decision failed:', error)
    } finally {
      setIsLocking(false)
    }
  }
  
  const handleSendEmail = async () => {
    setEmailSending(true)
    setEmailResult(null)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: process.env.NEXT_PUBLIC_DEFAULT_REVIEWER || 'Credit Officer'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setEmailResult({ success: true, message: `Email sent successfully to ${result.recipient}` })
        // Reload data to update email status
        const data = await api.getApplication(resolvedParams.id)
        setAppData(data)
      } else {
        setEmailResult({ success: false, message: result.error || 'Failed to send email' })
      }
      
    } catch (error) {
      setEmailResult({ success: false, message: 'Network error: Could not send email' })
    } finally {
      setEmailSending(false)
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

  useEffect(() => {
    if (appData?.comment) {
      setCommentText(appData.comment)
    }
  }, [appData])

  const handleSaveComment = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${resolvedParams.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText })
      })
      
      if (response.ok) {
        const updated = await api.getApplication(resolvedParams.id)
        setAppData(updated)
        setShowCommentDialog(false)
      }
    } catch (error) {
      console.error('Failed to save comment:', error)
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
  interface FinancialMetric {
    value: number;
    percentage?: string;
    calculation: Record<string, number | string>;
    assessment: string;
    evidence?: string;
    applicable?: boolean;
    risk_flag?: string;
    after_living_costs?: number;
  }
  interface FinancialMetrics {
    debt_service_ratio?: FinancialMetric;
    net_disposable_income?: FinancialMetric;
    loan_to_value_ratio?: FinancialMetric;
    per_capita_income?: FinancialMetric;
    savings_rate?: FinancialMetric;
    cost_of_living_ratio?: FinancialMetric;
  }
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
  interface ApplicantProfile {
    name?: string;
    ic_number?: string;
    loan_type?: string;
    requested_amount?: number;
    annual_income?: number;
    period?: string;
    loan_purpose?: string[];
    phone?: string;
    email?: string;
    address?: string;
    birth_date?: string;
    marital_status?: string;
    family_members?: number;
    bank_institution?: string;
    bank_account?: string;
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
    financial_dna?: FinancialDna | null;
    financial_metrics?: FinancialMetrics;
    applicant_profile?: ApplicantProfile;
    ai_summary?: string;
    document_texts?: { bank_statement?: string; essay?: string; payslip?: string };
    cross_verification?: { claim_topic?: string; evidence_found?: string; status?: string };
    compliance_audit?: { bias_check?: string; source_of_wealth?: string };
    decision_justification?: {
      recommendation: string;
      overall_assessment: string;
      strengths: string[];
      concerns: string[];
      key_reasons: string[];
    };
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
      
      logs.push({ time: `00:0${8 + findings.length}`, message: `Analysis complete. Final Credit Score: ${riskScore}/100 (${riskLevel})`, type: 'success' })
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
      
      // ==================== PAGE 1: EXECUTIVE SUMMARY ====================
      // Header with Brand - Professional Black
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(20, 15, 190, 15)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('INSIGHTLOAN', 105, 23, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Credit Risk Assessment Report', 105, 31, { align: 'center' })
      doc.line(20, 35, 190, 35)
      
      // Application Info Box - Black Border
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.rect(20, 45, 170, 40)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(analysis?.applicant_profile?.name || name, 25, 54)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Application ID: ${resolvedParams.id}`, 25, 61)
      doc.text(`Loan Type: ${analysis?.applicant_profile?.loan_type || appData.loan_type || 'Personal Loan'}`, 25, 67)
      doc.text(`Requested Amount: ${analysis?.applicant_profile?.requested_amount ? `RM ${analysis.applicant_profile.requested_amount.toLocaleString()}` : (appData.requested_amount ? `RM ${appData.requested_amount.toLocaleString()}` : 'Not Specified')}`, 25, 73)
      doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 25, 79)
      doc.text(`Status: ${finalDecision} (${riskLevel} Risk)`, 130, 61)
      
      // Credit Score - Professional Box
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.8)
      doc.rect(20, 95, 60, 25)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(26)
      doc.setFont('helvetica', 'bold')
      doc.text(riskScore.toString(), 50, 110, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('CREDIT SCORE (/100)', 50, 117, { align: 'center' })
      
      // Decision Box - Professional Format
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.8)
      doc.rect(90, 95, 100, 25)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(finalDecision.toUpperCase(), 140, 106, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Risk Level: ${riskLevel}`, 140, 114, { align: 'center' })
      
      // Score Calculation Breakdown Table
      let yPos = 140
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Credit Score Calculation Breakdown', 20, yPos)

      if (scoreBreakdown && scoreBreakdown.length > 0) {
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Category', 'Points', 'Reason']],
          body: scoreBreakdown.map(sb => [
            sb.category,
            (sb.points > 0 ? '+' : '') + sb.points,
            sb.reason
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { lineWidth: 0.1, lineColor: [100, 100, 100] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 20, right: 20 },
          columnStyles: { 2: { cellWidth: 90 } }
        })
        
        // @ts-expect-error - autoTable adds finalY to doc
        yPos = doc.lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Score breakdown not available for this analysis.', 25, yPos + 10)
        yPos += 20
      }
      
      // AI Risk Flags Analysis
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Risk Flags & Findings', 20, yPos)
      
      if (riskFlags && riskFlags.length > 0) {
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Risk Flag', 'Severity', 'Description']],
          body: riskFlags.slice(0, 10).map(f => [
            f.flag,
            f.severity || 'Medium',
            f.description || 'See detailed analysis'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { lineWidth: 0.1, lineColor: [100, 100, 100] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25 },
            2: { cellWidth: 95 }
          }
        })
        
        // @ts-expect-error - autoTable adds finalY to doc
        yPos = doc.lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('No risk flags identified for this application.', 25, yPos + 10)
        yPos += 20
      }
      
      // Forensic Cross-Verification - Use actual data
      if (yPos < 220 && forensicEvidence.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Forensic Cross-Document Verification', 20, yPos)
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [['Claim Topic', 'Status', 'Confidence', 'Evidence']],
          body: forensicEvidence.slice(0, 5).map(fe => [
            fe.claim_topic || 'N/A',
            fe.status || 'N/A',
            `${fe.confidence}%` || 'N/A',
            (fe.statement_evidence || 'N/A').substring(0, 60) + '...'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.3, lineColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { lineWidth: 0.1, lineColor: [100, 100, 100] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 40 },
            3: { cellWidth: 70 }
          }
        })
        
        // @ts-expect-error - autoTable adds finalY to doc
        yPos = doc.lastAutoTable.finalY + 10
      }
      
      // ==================== PAGE 2: DECISION JUSTIFICATION ====================
      if (analysis?.decision_justification) {
        doc.addPage()
        yPos = 20
        
        // Section Header - Professional
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(20, yPos, 190, yPos)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('DECISION JUSTIFICATION', 105, yPos + 8, { align: 'center' })
        doc.line(20, yPos + 12, 190, yPos + 12)
        yPos += 20
        
        const justification = analysis.decision_justification
        const recommendation = justification.recommendation || finalDecision
        
        // Recommendation Box - Professional Black Border
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.8)
        doc.rect(20, yPos, 170, 15)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(`RECOMMENDATION: ${recommendation}`, 105, yPos + 10, { align: 'center' })
        yPos += 25
        
        // Overall Assessment
        if (justification.overall_assessment) {
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Overall Assessment:', 20, yPos)
          yPos += 7
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          const assessmentLines = doc.splitTextToSize(justification.overall_assessment, 170)
          doc.text(assessmentLines, 20, yPos)
          yPos += (assessmentLines.length * 5) + 10
        }
        
        // Strengths and Concerns in Two Columns
        if (justification.strengths || justification.concerns) {
          // Strengths Column - Professional Format
          let leftY = yPos
          if (justification.strengths && justification.strengths.length > 0) {
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text('STRENGTHS', 20, leftY)
            leftY += 7
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            justification.strengths.forEach((strength: string, idx: number) => {
              const lines = doc.splitTextToSize(`${idx + 1}. ${strength}`, 80)
              doc.text(lines, 22, leftY)
              leftY += lines.length * 4 + 2
            })
          }
          
          // Concerns Column - Professional Format
          let rightY = yPos
          if (justification.concerns && justification.concerns.length > 0) {
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text('CONCERNS', 110, rightY)
            rightY += 7
            
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            justification.concerns.forEach((concern: string, idx: number) => {
              const lines = doc.splitTextToSize(`${idx + 1}. ${concern}`, 80)
              doc.text(lines, 112, rightY)
              rightY += lines.length * 4 + 2
            })
          }
          
          yPos = Math.max(leftY, rightY) + 10
        }
        
        // Key Reasons
        if (justification.key_reasons && justification.key_reasons.length > 0) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text('Key Reasons for Decision:', 20, yPos)
          yPos += 7
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          justification.key_reasons.forEach((reason: string, idx: number) => {
            const lines = doc.splitTextToSize(`${idx + 1}. ${reason}`, 170)
            doc.text(lines, 20, yPos)
            yPos += lines.length * 4 + 3
          })
        }
      }

      // ==================== PAGE 3: OFFICER COMMENTS ====================
      if (appData.comment) {
        if (yPos > 200) {
          doc.addPage()
          yPos = 20
        } else {
          yPos += 10
        }
        
        // Section Header - Professional
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(20, yPos, 190, yPos)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('OFFICER COMMENTS', 105, yPos + 8, { align: 'center' })
        doc.line(20, yPos + 12, 190, yPos + 12)
        yPos += 20
        
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        const commentLines = doc.splitTextToSize(appData.comment, 170)
        doc.text(commentLines, 20, yPos)
      }
      
      // Footer on all pages - Page number only
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
      }
      
      // Save PDF
      doc.save(`InsightLoan_Report_${resolvedParams.id}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-8rem)] gap-0 relative">
      {/* Left Panel: AI Analysis */}
      <div className="flex flex-col space-y-6 overflow-y-auto pr-4 select-text" style={{ width: `${leftPanelWidth}%` }}>
        {/* Enhanced Header with Context Layer */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              {/* Back Button + Name */}
              <div className="flex items-start gap-3">
                <Link href="/" className="flex-shrink-0 mt-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                  </Button>
                </Link>
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                  
                  {/* Review Status Badge */}
                  {appData.review_status === "Manual_Override" ? (
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Manual Override
                    </Badge>
                  ) : appData.review_status === "Human_Verified" ? (
                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0">
                      <User className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-white text-slate-600 border-slate-300 flex-shrink-0">
                      <Bot className="h-3 w-3 mr-1" />
                      AI Analysis
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium ml-12">Application ID: {resolvedParams.id}</p>
              
              {/* Last Reviewed Timestamp */}
              {appData.reviewed_at && (
                <p className="text-xs text-slate-500 ml-12">
                  Last reviewed by {appData.reviewed_by} at {new Date(appData.reviewed_at).toLocaleString()}
                </p>
              )}
              
              {/* Decision & Risk Level Badges */}
              <div className="flex items-center gap-3 mt-3 ml-12">
                {/* Large Risk Score Display */}
                <div className={`px-6 py-4 rounded-2xl border-2 shadow-lg ${
                  riskScore >= 80 ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300' :
                  riskScore >= 60 ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300' :
                  'bg-gradient-to-br from-rose-50 to-red-100 border-rose-300'
                }`}>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-black tabular-nums tracking-tight drop-shadow-sm ${
                      riskScore >= 80 ? 'text-emerald-600' :
                      riskScore >= 60 ? 'text-amber-600' :
                      'text-rose-600'
                    }`}>
                      {riskScore}
                    </span>
                    <span className="text-sm text-slate-600 font-bold">/100</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-1 uppercase tracking-wide">Credit Score</p>
                  {isPolling && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-xs text-indigo-600 font-semibold">Analyzing...</span>
                    </div>
                  )}
                </div>
                
                <Badge className={`text-sm py-1.5 px-3 ${
                  finalDecision === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  finalDecision === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {finalDecision}
                </Badge>
                <Badge variant="outline" className={`text-sm py-1.5 px-3 ${
                  riskLevel === 'Low' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                  riskLevel === 'High' ? 'text-rose-700 border-rose-200 bg-rose-50' :
                  'text-amber-700 border-amber-200 bg-amber-50'
                }`}>
                  Risk: {riskLevel}
                </Badge>
              </div>
              
              {/* Metadata Badges Row - Dynamic from Application Form */}
              <div className="flex items-center gap-3 mt-3 ml-12">
                {appData.requested_amount && typeof appData.requested_amount === 'number' && (
                  <Badge variant="outline" className="text-slate-700 border-slate-200 bg-white">
                    <Banknote className="h-3 w-3 mr-1" />
                    Requested: RM {appData.requested_amount.toLocaleString()}
                  </Badge>
                )}
                {analysis?.applicant_profile?.period && (
                  <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
                    <Calendar className="h-3 w-3 mr-1" />
                    Tenure: {analysis.applicant_profile.period}
                  </Badge>
                )}
                {analysis?.applicant_profile?.loan_type && (
                  <Badge variant="outline" className="text-slate-700 border-slate-300 bg-slate-50">
                    <Building2 className="h-3 w-3 mr-1" />
                    {analysis.applicant_profile.loan_type}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Navigation and Decision Group - Reorganized for Visibility */}
            <div className="flex flex-col items-end gap-3">
              {/* Decision Buttons - Top Row for Maximum Visibility */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </>
                  )}
                </Button>
                
                {/* Manual Decision Buttons - Show locked state if decision is locked */}
                {appData.decision_locked ? (
                  <Badge className="bg-slate-700 text-white border-slate-600 px-3 py-1.5">
                    <Shield className="h-3 w-3 mr-1.5" />
                    Decision Locked by {appData.decision_locked_by}
                  </Badge>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-rose-600 border-rose-300 hover:bg-rose-50"
                      onClick={() => handleDecisionClick('Rejected')}
                      disabled={appData.status === 'Processing' || appData.status === 'Analyzing'}
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleDecisionClick('Approved')}
                      disabled={appData.status === 'Processing' || appData.status === 'Analyzing'}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                  </>
                )}
                
                {appData.status === 'Failed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={handleRetry}
                  >
                    Retry Analysis
                  </Button>
                )}
                
                {/* Send Email Button (manual mode, decision locked, email not sent) */}
                {appData.decision_locked && !appData.email_sent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                    onClick={() => setShowSendEmailDialog(true)}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Send Email
                  </Button>
                )}
                
                {/* Email Status Badge */}
                {appData.decision_locked && appData.email_status && (
                  <Badge 
                    variant="outline"
                    className={
                      appData.email_status === 'sent' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : appData.email_status === 'unsent'
                        ? 'bg-slate-50 text-slate-600 border-slate-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }
                  >
                    {appData.email_status === 'sent' 
                      ? '✓ Email Sent' 
                      : appData.email_status === 'unsent'
                      ? '○ Email Unsent'
                      : '✗ Email Failed'}
                  </Badge>
                )}
              </div>

              {/* Comment Button */}
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-300 hover:bg-slate-50 w-full"
                onClick={() => setShowCommentDialog(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {appData.comment ? "Edit Comment" : "Add Comment"}
              </Button>

              {/* Rapid Review Navigation - Second Row */}
              <div className="flex items-center gap-2 self-start">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void navigateApplication('previous')}
                  className="text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => void navigateApplication('next')}
                  className="text-slate-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Information Card - Moved to Top */}
        {analysis?.applicant_profile && (
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border-indigo-200/60 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    Applicant Information
                  </CardTitle>
                  <CardDescription>Extracted from Application Form by AI</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-300">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Extracted
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
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
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Loan Type</p>
                    <Badge className="mt-1 bg-indigo-600 text-white">
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
                
                <div className="col-span-2 space-y-3 pt-3 border-t border-indigo-200">
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Score Breakdown - Show Calculation Transparency */}
        {scoreBreakdown && scoreBreakdown.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" />
                Credit Score Calculation Breakdown
              </CardTitle>
              <CardDescription>Transparent scoring showing how the {riskScore}/100 credit score was calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoreBreakdown.map((item, idx) => {
                  const isPositive = item.type === 'positive'
                  const isNegative = item.type === 'negative'
                  const pointsDisplay = item.points > 0 ? `+${item.points}` : item.points
                  
                  return (
                    <div key={idx} className={`flex items-start justify-between p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${
                      isPositive ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300' :
                      isNegative ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200 hover:border-rose-300' :
                      'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 hover:border-slate-300'
                    }`}>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">{item.category}</h4>
                        <p className="text-xs text-slate-600 mt-1">{item.reason}</p>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className={`text-2xl font-bold ${
                          isPositive ? 'text-emerald-700' :
                          isNegative ? 'text-rose-700' :
                          'text-slate-700'
                        }`}>
                          {pointsDisplay}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium mt-0.5">POINTS</span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="mt-4 p-4 bg-gradient-to-r from-slate-800 via-slate-900 to-zinc-800 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">Total Credit Score</span>
                    <span className="text-4xl font-black text-white drop-shadow">{riskScore}/100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 bg-slate-700/50 rounded-lg p-2">
                    Score Guide: 80-100 = Low Risk (Approve), 60-79 = Medium Risk (Review), 0-59 = High Risk (Reject)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decision Justification Section - NEW */}
        {analysis?.decision_justification && (
          <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
            analysis.decision_justification.recommendation === 'APPROVE' 
              ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-300' 
              : analysis.decision_justification.recommendation === 'REVIEW'
              ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300'
              : 'bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border-rose-300'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Decision Justification
                  </CardTitle>
                  <CardDescription>AI reasoning for {analysis.decision_justification.recommendation.toLowerCase()} recommendation</CardDescription>
                </div>
                <Badge className={`text-sm font-bold ${
                  analysis.decision_justification.recommendation === 'APPROVE'
                    ? 'bg-emerald-600 text-white'
                    : analysis.decision_justification.recommendation === 'REVIEW'
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {analysis.decision_justification.recommendation}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Assessment */}
              <div className="p-4 bg-white/80 rounded-lg border-2 border-slate-200">
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {analysis.decision_justification.overall_assessment}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {analysis.decision_justification.strengths && analysis.decision_justification.strengths.length > 0 && (
                  <div className="bg-white/80 rounded-lg border-2 border-emerald-200 p-4">
                    <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.decision_justification.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {analysis.decision_justification.concerns && analysis.decision_justification.concerns.length > 0 && (
                  <div className="bg-white/80 rounded-lg border-2 border-rose-200 p-4">
                    <h4 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Concerns
                    </h4>
                    <ul className="space-y-2">
                      {analysis.decision_justification.concerns.map((concern: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="text-rose-600 mt-0.5">⚠</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Key Reasons */}
              {analysis.decision_justification.key_reasons && analysis.decision_justification.key_reasons.length > 0 && (
                <div className="bg-white/80 rounded-lg border-2 border-slate-300 p-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Key Reasons for {analysis.decision_justification.recommendation}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.decision_justification.key_reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="font-bold text-slate-500">{idx + 1}.</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Financial Metrics Section - Comprehensive Analysis */}
        {analysis && analysis.financial_metrics && Object.keys(analysis.financial_metrics).length > 0 && (
          <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-purple-200/60 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Financial Metrics Analysis
              </CardTitle>
              <CardDescription>Comprehensive financial ratios and indicators calculated from documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Debt Service Ratio (DSR) */}
                {analysis.financial_metrics.debt_service_ratio && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Debt Service Ratio (DSR)</h4>
                      <Badge className={`${
                        analysis.financial_metrics.debt_service_ratio.value < 40 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        analysis.financial_metrics.debt_service_ratio.value < 60 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.debt_service_ratio.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-purple-700 mb-2">
                      {analysis.financial_metrics.debt_service_ratio.percentage || `${(analysis.financial_metrics.debt_service_ratio.value ?? 0).toFixed(1)}%`}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: (Total Monthly Debt ÷ Net Income) × 100%</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Existing: RM {Number(analysis.financial_metrics.debt_service_ratio.calculation.existing_commitments || 0).toLocaleString()}</p>
                        <p>New Loan: RM {Number(analysis.financial_metrics.debt_service_ratio.calculation.estimated_new_installment || 0).toLocaleString()}</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          Total: RM {Number(analysis.financial_metrics.debt_service_ratio.calculation.total_monthly_debt || 0).toLocaleString()}
                        </p>
                        <p className="mt-1">Net Income: RM {Number(analysis.financial_metrics.debt_service_ratio.calculation.net_monthly_income || 0).toLocaleString()}</p>
                      </div>
                      {analysis.financial_metrics.debt_service_ratio.evidence && (
                        <p className="italic text-slate-500 mt-2 text-[10px]">
                          Evidence: &ldquo;{(analysis.financial_metrics.debt_service_ratio.evidence || '').substring(0, 80)}...&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Net Disposable Income */}
                {analysis.financial_metrics.net_disposable_income && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Net Disposable Income</h4>
                      <Badge className={`${
                        analysis.financial_metrics.net_disposable_income.value > 2000 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        analysis.financial_metrics.net_disposable_income.value > 1000 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.net_disposable_income.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700 mb-2">
                      RM {(analysis.financial_metrics.net_disposable_income.value ?? 0).toLocaleString()}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: Net Income - Total Debt - Living Expenses</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Income: RM {Number(analysis.financial_metrics.net_disposable_income.calculation.net_income || 0).toLocaleString()}</p>
                        <p>- Debt: RM {Number(analysis.financial_metrics.net_disposable_income.calculation.total_debt_commitments || 0).toLocaleString()}</p>
                        <p>- Living: RM {Number(analysis.financial_metrics.net_disposable_income.calculation.estimated_living_expenses || 0).toLocaleString()}</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          = RM {(analysis.financial_metrics.net_disposable_income.value ?? 0).toLocaleString()}
                        </p>
                      </div>
                      {analysis.financial_metrics.net_disposable_income.after_living_costs && (
                        <p className="text-indigo-600 font-medium mt-2">
                          Real Buffer: RM {(analysis.financial_metrics.net_disposable_income.after_living_costs ?? 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Per Capita Income */}
                {analysis.financial_metrics.per_capita_income && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Per Capita Income</h4>
                      <Badge className={`${
                        analysis.financial_metrics.per_capita_income.value > 2000 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        analysis.financial_metrics.per_capita_income.value > 1000 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.per_capita_income.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-indigo-700 mb-2">
                      RM {(analysis.financial_metrics.per_capita_income.value ?? 0).toLocaleString()}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: Net Monthly Income ÷ Family Members</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Income: RM {Number(analysis.financial_metrics.per_capita_income.calculation.net_monthly_income || 0).toLocaleString()}/month</p>
                        <p>Family: {Number(analysis.financial_metrics.per_capita_income.calculation.family_members || 1)} members</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          = RM {(analysis.financial_metrics.per_capita_income.value ?? 0).toLocaleString()}/person
                        </p>
                      </div>
                      {analysis.financial_metrics.per_capita_income.risk_flag && (
                        <Alert className="mt-2 bg-amber-50 border-amber-300">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <AlertDescription className="text-[10px] text-amber-800">
                            {analysis.financial_metrics.per_capita_income.risk_flag}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}

                {/* Savings Rate */}
                {analysis.financial_metrics.savings_rate && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Savings Rate</h4>
                      <Badge className={`${
                        analysis.financial_metrics.savings_rate.value > 50 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        analysis.financial_metrics.savings_rate.value > 20 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.savings_rate.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-green-700 mb-2">
                      {analysis.financial_metrics.savings_rate.percentage || `${(analysis.financial_metrics.savings_rate.value ?? 0).toFixed(1)}%`}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: (Closing Balance ÷ Monthly Income) × 100%</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Closing: RM {Number(analysis.financial_metrics.savings_rate.calculation.monthly_closing_balance || 0).toLocaleString()}</p>
                        <p>Income: RM {Number(analysis.financial_metrics.savings_rate.calculation.monthly_income || 0).toLocaleString()}</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          Rate: {analysis.financial_metrics.savings_rate.percentage || `${(analysis.financial_metrics.savings_rate.value ?? 0).toFixed(1)}%`}
                        </p>
                      </div>
                      {analysis.financial_metrics.savings_rate.evidence && (
                        <p className="italic text-slate-500 mt-2 text-[10px]">
                          Evidence: &ldquo;{(analysis.financial_metrics.savings_rate.evidence || '').substring(0, 80)}...&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cost of Living Ratio */}
                {analysis.financial_metrics.cost_of_living_ratio && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Cost of Living Ratio</h4>
                      <Badge className={`${
                        analysis.financial_metrics.cost_of_living_ratio.value < 30 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        analysis.financial_metrics.cost_of_living_ratio.value < 50 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.cost_of_living_ratio.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-indigo-700 mb-2">
                      {analysis.financial_metrics.cost_of_living_ratio.percentage || `${(analysis.financial_metrics.cost_of_living_ratio.value ?? 0).toFixed(1)}%`}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: (Living Expenses ÷ Net Income) × 100%</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Expenses: RM {Number(analysis.financial_metrics.cost_of_living_ratio.calculation.total_living_expenses || 0).toLocaleString()}</p>
                        <p>Income: RM {Number(analysis.financial_metrics.cost_of_living_ratio.calculation.net_income || 0).toLocaleString()}</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          Ratio: {analysis.financial_metrics.cost_of_living_ratio.percentage || `${(analysis.financial_metrics.cost_of_living_ratio.value ?? 0).toFixed(1)}%`}
                        </p>
                      </div>
                      {analysis.financial_metrics.cost_of_living_ratio.evidence && (
                        <p className="italic text-slate-500 mt-2 text-[10px]">
                          Evidence: &ldquo;{(analysis.financial_metrics.cost_of_living_ratio.evidence || '').substring(0, 80)}...&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Loan-to-Value Ratio (for Car/Housing loans only) */}
                {analysis.financial_metrics.loan_to_value_ratio?.applicable && (
                  <div className="bg-white rounded-xl border border-purple-200/60 p-4 shadow-sm hover:shadow-md transition-all hover:border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900">Loan-to-Value Ratio (LTV)</h4>
                      <Badge className={`${
                        analysis.financial_metrics.loan_to_value_ratio.value <= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {analysis.financial_metrics.loan_to_value_ratio.assessment}
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-orange-700 mb-2">
                      {analysis.financial_metrics.loan_to_value_ratio.percentage || `${(analysis.financial_metrics.loan_to_value_ratio.value ?? 0).toFixed(1)}%`}
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="font-semibold">Formula: (Loan Amount ÷ Asset Value) × 100%</p>
                      <div className="bg-slate-50 rounded p-2 mt-2 font-mono text-[10px]">
                        <p>Loan: RM {Number(analysis.financial_metrics.loan_to_value_ratio.calculation.loan_amount || 0).toLocaleString()}</p>
                        <p>Asset: RM {Number(analysis.financial_metrics.loan_to_value_ratio.calculation.asset_value || 0).toLocaleString()}</p>
                        <p>Down: RM {Number(analysis.financial_metrics.loan_to_value_ratio.calculation.down_payment || 0).toLocaleString()}</p>
                        <p className="font-bold border-t border-slate-300 pt-1 mt-1">
                          LTV: {analysis.financial_metrics.loan_to_value_ratio.percentage || `${(analysis.financial_metrics.loan_to_value_ratio.value ?? 0).toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metric Explanations */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50/70 to-violet-50/70 rounded-xl border border-purple-200/60">
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase">Understanding Financial Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span className="font-semibold">DSR (Debt Service Ratio):</span> Measures repayment pressure. Bank warning at 60-70%.
                  </div>
                  <div>
                    <span className="font-semibold">NDI (Net Disposable Income):</span> Cash left after debts. Shows emergency buffer capacity.
                  </div>
                  <div>
                    <span className="font-semibold">Per Capita Income:</span> Income per family member. Reveals hidden financial stress.
                  </div>
                  <div>
                    <span className="font-semibold">Savings Rate:</span> Closing balance vs income. Indicates financial discipline.
                  </div>
                  <div>
                    <span className="font-semibold">Cost of Living:</span> Living expenses as % of income. Shows spending patterns.
                  </div>
                  <div>
                    <span className="font-semibold">LTV (Loan-to-Value):</span> For Car/Housing loans. Malaysia standard max 90%.
                  </div>
                </div>
              </div>
            </CardContent>
                   </Card>
        )}

        {/* Risk Factors (key_risk_flags only) */}
        <Card className="bg-gradient-to-br from-orange-50/50 via-amber-50/50 to-yellow-50/50 border-amber-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-900">Risk Factors</CardTitle>
            <CardDescription className="text-xs">Explicit deductions & positive confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskFlags.map((rf, idx) => {
                const isPositive = rf.severity === 'Positive'
                const isNegative = rf.severity === 'High'
                const bgColor = isNegative ? 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200 hover:border-rose-300' : isPositive ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300'
                const IconComponent = isNegative ? AlertTriangle : isPositive ? CheckCircle : AlertCircle
                const iconColor = isNegative ? 'text-rose-600' : isPositive ? 'text-emerald-600' : 'text-amber-600'
                return (
                  <div key={idx} className={`${bgColor} border rounded-xl p-4 shadow-sm hover:shadow-md transition-all`}>
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
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/30 to-orange-50/30 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-amber-50/70">
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
          <Card className="bg-gradient-to-br from-cyan-50/50 via-sky-50/50 to-blue-50/50 border-sky-200/60 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-sky-900">Essay Insights (Evidence-Based)</CardTitle>
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
        <Card className="border-t-4 border-t-indigo-500 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white shadow-lg">
          <CardHeader 
            className="pb-2 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setShowReasoningStream(!showReasoningStream)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-sm text-white">AI Reasoning Stream</CardTitle>
              </div>
              <Badge className="bg-indigo-600 text-white border-indigo-500 text-xs">
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


        {/* AI Summary Section */}
        {analysis && analysis.ai_summary && (
          <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border-indigo-200/60 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                AI Applicant Summary
              </CardTitle>
              <CardDescription>Comprehensive analysis based on all 4 uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border border-indigo-200 p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {analysis.ai_summary}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <p className="text-xs text-slate-500">
                    This summary is generated by AI after analyzing: Application Form, Bank Statement, Loan Essay, and Payslip
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {crossVerification && crossVerification.status && (
          <Card className="bg-gradient-to-br from-teal-50/50 via-emerald-50/50 to-green-50/50 border-emerald-200/60 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-900">Cross-Verification: Claim vs. Reality</CardTitle>
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

        {/* Comment Section - NEW */}
        {appData.comment && (
          <Card className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-yellow-300/60 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-yellow-600" />
                Officer Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{appData.comment}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Decision Audit History Panel */}
        <Card className="mt-auto bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200/60 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">Decision History</CardTitle>
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

      {/* Resizable Handle */}
      <div
        className="w-4 cursor-col-resize flex items-center justify-center hover:bg-indigo-50 active:bg-indigo-100 transition-colors z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-300 via-indigo-400 to-indigo-300 rounded-full shadow-sm" />
      </div>

      {/* Right Panel: PDF Viewer Only */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col" style={{ width: `${100 - leftPanelWidth}%` }}>
        <div className="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-slate-50 to-gray-50 overflow-x-auto rounded-t-xl">
          {(['application_form','bank','essay','payslip'] as const).map(mode => (
            <Button key={mode} size="sm" variant={docViewMode===mode? 'default':'outline'} onClick={()=>setDocViewMode(mode)}>
              {mode==='application_form'? 'Application Form': mode==='bank'? 'Bank Statement': mode==='essay'? 'Loan Essay':'Payslip'}
            </Button>
          ))}
          
          {/* Supporting Docs Tabs */}
          {appData.supporting_doc_1_url && (
            <Button size="sm" variant={docViewMode==='supporting_1'? 'default':'outline'} onClick={()=>setDocViewMode('supporting_1')}>
              Supp. Doc 1
            </Button>
          )}
          {appData.supporting_doc_2_url && (
            <Button size="sm" variant={docViewMode==='supporting_2'? 'default':'outline'} onClick={()=>setDocViewMode('supporting_2')}>
              Supp. Doc 2
            </Button>
          )}
          {appData.supporting_doc_3_url && (
            <Button size="sm" variant={docViewMode==='supporting_3'? 'default':'outline'} onClick={()=>setDocViewMode('supporting_3')}>
              Supp. Doc 3
            </Button>
          )}

          <div className="ml-auto text-[11px] text-slate-500 whitespace-nowrap">PDF Viewer</div>
        </div>
        <div className="flex-1 overflow-hidden">
          {(() => {
            let url = null;
            if (docViewMode==='application_form') url = appData.application_form_url;
            else if (docViewMode==='bank') url = appData.bank_statement_url;
            else if (docViewMode==='essay') url = appData.essay_url;
            else if (docViewMode==='payslip') url = appData.payslip_url;
            else if (docViewMode==='supporting_1') url = appData.supporting_doc_1_url;
            else if (docViewMode==='supporting_2') url = appData.supporting_doc_2_url;
            else if (docViewMode==='supporting_3') url = appData.supporting_doc_3_url;

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

      <AICopilot applicationId={resolvedParams.id} />
      
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

      {/* Comment Dialog - NEW */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Additional Comments</DialogTitle>
            <DialogDescription>
              Provide any additional comments for the application decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment-text">Your Comments</Label>
              <Textarea
                id="comment-text"
                placeholder="E.g., Consider alternative income sources..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={10}
                className="max-h-[60vh]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveComment}
              disabled={!commentText.trim()}
            >
              Save Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Decision Confirmation Dialog */}
      <Dialog open={showLockConfirmDialog} onOpenChange={setShowLockConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Lock Decision Permanently
            </DialogTitle>
            <DialogDescription>
              You are about to finalize this decision. Once locked, it CANNOT be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning: This action is irreversible!</strong>
                <br />
                <br />
                Final Decision: <strong>{pendingDecision}</strong>
                <br />
                Applicant: <strong>{appData?.name}</strong>
                <br />
                Application ID: <strong>{resolvedParams.id}</strong>
              </AlertDescription>
            </Alert>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-slate-900">What happens next:</p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                <li>Decision will be locked permanently</li>
                <li>Approve/Reject buttons will be disabled</li>
                <li>Email notification may be sent to applicant (based on settings)</li>
                <li>This action will be logged in audit trail</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLockConfirmDialog(false)
                setPendingDecision(null)
              }}
              disabled={isLocking}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleLockDecision}
              disabled={isLocking}
            >
              {isLocking ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                'Lock Decision'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog (Manual Mode) */}
      <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Decision Email to Applicant</DialogTitle>
            <DialogDescription>
              Send an email notification to the applicant about the loan decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {emailResult ? (
              <Alert variant={emailResult.success ? "default" : "destructive"}>
                {emailResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{emailResult.message}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="bg-indigo-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Email Details:</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li><strong>Recipient:</strong> {appData?.analysis_result && typeof appData.analysis_result === 'object' ? 
                      (appData.analysis_result as any)?.applicant_profile?.email || 'Email not found' : 'Email not found'}</li>
                    <li><strong>Decision:</strong> {appData?.final_decision}</li>
                    <li><strong>Application ID:</strong> {resolvedParams.id}</li>
                  </ul>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The email will include the decision and a comprehensive assessment report.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
          <DialogFooter>
            {emailResult ? (
              <Button onClick={() => {
                setShowSendEmailDialog(false)
                setEmailResult(null)
              }}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowSendEmailDialog(false)}>
                  Skip
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={emailSending}
                >
                  {emailSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    'Send Email'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
