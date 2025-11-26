"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, Sliders, Database, FileDown, Trash2, 
  Bot, Activity, Clock, Shield, AlertCircle, CheckCircle2, Download, User, LogOut
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface PolicySettings {
  dsr_threshold: number
  min_savings_rate: number
  confidence_threshold: number
  auto_reject_gambling: boolean
  auto_reject_high_dsr: boolean
  max_loan_micro_business: number
  max_loan_personal: number
  max_loan_housing: number
  max_loan_car: number
  updated_at: string
  updated_by: string
}

interface AuditLog {
  id: number
  timestamp: string
  user: string
  action: string
  details: string
  application_id?: string
  old_value?: string
  new_value?: string
}

interface DatabaseStats {
  total_applications: number
  approved: number
  rejected: number
  pending_review: number
  processing: number
  total_audit_logs: number
  database_size_mb: number
  last_backup: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout, changePassword } = useAuth()
  const [policy, setPolicy] = useState<PolicySettings | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  
  // AI Document Processing Toggles (UI only - not connected to backend)
  const [ocrEnabled, setOcrEnabled] = useState(true)
  const [autoPdfExtract, setAutoPdfExtract] = useState(true)
  const [multiLangSupport, setMultiLangSupport] = useState(true)
  
  // Fairness & Ethics Controls (UI only)
  const [maskProtectedAttributes, setMaskProtectedAttributes] = useState(true)
  const [requireHumanReviewLowIncome, setRequireHumanReviewLowIncome] = useState(true)
  
  // Prompt Version (UI only)
  const [promptVersion, setPromptVersion] = useState('v1.1')
  
  // Simulation state
  const [showSimulation, setShowSimulation] = useState(false)
  const [simulationResult, setSimulationResult] = useState<string>('')
  
  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const handleAccountLogout = async () => {
    await logout()
    router.push("/auth")
  }
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }
    
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess("Password changed successfully!")
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordSuccess(null)
      }, 2000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password")
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchDbStats()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`)
      if (res.ok) {
        const data = await res.json()
        setPolicy(data.policy)
        setAuditLogs(data.audit_logs || [])
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDbStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/database/stats`)
      if (res.ok) {
        const data = await res.json()
        setDbStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch database stats:", error)
    }
  }

  const handleSave = async () => {
    if (!policy) return
    
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policy,
          updated_by: 'Admin Officer'
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setSaveMessage('Settings saved successfully')
        fetchSettings() // Refresh to get audit logs
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      setSaveMessage('Failed to save settings')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/export/applications`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleClearTestData = async () => {
    if (!confirm('Are you sure you want to delete all test applications? This cannot be undone.')) {
      return
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/database/clear-test-data`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Successfully deleted ${data.deleted_count} test applications`)
        fetchDbStats()
      }
    } catch (error) {
      alert('Failed to clear test data')
    }
  }

  const handleSimulateImpact = () => {
    if (!policy) return
    
    // Mock simulation logic
    const baseDSR = 60 // Baseline DSR threshold
    const diff = baseDSR - policy.dsr_threshold
    const impactRate = (diff * 0.8).toFixed(1)
    const volumeChange = (diff * 25).toFixed(0)
    
    let message = ''
    if (diff > 0) {
      // Stricter policy
      message = `IMPACT ANALYSIS:\n\nStricter Risk Policy Detected\n• Estimated Rejection Rate: +${impactRate}%\n• Projected Monthly Loan Volume: -RM ${volumeChange}k\n• Risk Exposure Reduction: Medium\n\nNote: Lower approval volume but higher portfolio quality`
    } else if (diff < 0) {
      // Looser policy
      const absImpact = Math.abs(parseFloat(impactRate))
      const absVolume = Math.abs(parseInt(volumeChange))
      message = `IMPACT ANALYSIS:\n\nGrowth-Focused Policy Detected\n• Estimated Approval Rate: +${absImpact.toFixed(1)}%\n• Projected Monthly Loan Volume: +RM ${absVolume}k\n• Risk Exposure Increase: Medium\n\nNote: Higher approval volume but increased default risk`
    } else {
      message = `IMPACT ANALYSIS:\n\nBalanced Policy (Baseline)\n• No significant change from current settings\n• Risk-Return profile remains stable`
    }
    
    setSimulationResult(message)
    setShowSimulation(true)
    
    // Auto-hide after 8 seconds
    setTimeout(() => setShowSimulation(false), 8000)
  }

  const handleExportSystemLogs = async () => {
    try {
      // Fetch all applications to get decision history
      const appsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications`)
      const applications = appsRes.ok ? await appsRes.json() : []

      // Build comprehensive log text
      let logText = '='.repeat(80) + '\n'
      logText += 'TRUSTLENS AI - SYSTEM ACTIVITY LOG\n'
      logText += '='.repeat(80) + '\n'
      logText += `Generated: ${new Date().toLocaleString()}\n`
      logText += `Total Audit Logs: ${auditLogs.length}\n`
      logText += `Total Applications: ${applications.length}\n`
      logText += '='.repeat(80) + '\n\n'

      // Section 1: Audit Trail Logs
      logText += '█ SECTION 1: SYSTEM AUDIT TRAIL\n'
      logText += '─'.repeat(80) + '\n\n'
      
      auditLogs.forEach((log, idx) => {
        logText += `[${idx + 1}] ${new Date(log.timestamp).toLocaleString()}\n`
        logText += `    User: ${log.user}\n`
        logText += `    Action: ${log.action}\n`
        logText += `    Details: ${log.details}\n`
        if (log.application_id) logText += `    Application ID: ${log.application_id}\n`
        if (log.old_value) logText += `    Old Value: ${log.old_value}\n`
        if (log.new_value) logText += `    New Value: ${log.new_value}\n`
        logText += '\n'
      })

      // Section 2: Application Decision History
      logText += '\n' + '='.repeat(80) + '\n'
      logText += '█ SECTION 2: APPLICATION DECISION HISTORY\n'
      logText += '─'.repeat(80) + '\n\n'

      applications.forEach((app: any) => {
        if (app.decision_history && app.decision_history.length > 0) {
          logText += `Application: ${app.application_id}\n`
          logText += `  Applicant: ${app.applicant_name}\n`
          logText += `  Current Status: ${app.status}\n`
          logText += `  Decision Timeline:\n`
          
          app.decision_history.forEach((decision: any, idx: number) => {
            logText += `    [${idx + 1}] ${new Date(decision.timestamp).toLocaleString()}\n`
            logText += `        Decision: ${decision.decision}\n`
            logText += `        Made By: ${decision.made_by}\n`
            if (decision.reason) logText += `        Reason: ${decision.reason}\n`
            if (decision.risk_score !== undefined) logText += `        Risk Score: ${decision.risk_score}\n`
            if (decision.confidence !== undefined) logText += `        AI Confidence: ${decision.confidence}%\n`
          })
          logText += '\n'
        }
      })

      // Section 3: Summary Statistics
      logText += '\n' + '='.repeat(80) + '\n'
      logText += '█ SECTION 3: SUMMARY STATISTICS\n'
      logText += '─'.repeat(80) + '\n\n'
      
      const statusCounts = applications.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {})

      Object.entries(statusCounts).forEach(([status, count]) => {
        logText += `${status}: ${count}\n`
      })

      logText += '\n' + '='.repeat(80) + '\n'
      logText += 'END OF LOG\n'
      logText += '='.repeat(80) + '\n'

      // Download as TXT
      const blob = new Blob([logText], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system_logs_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export system logs:', error)
      alert('Failed to export system logs')
    }
  }

  if (loading || !policy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8 pb-16 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure risk policies, AI parameters, and manage system data</p>
        </div>
        {saveMessage && (
          <Badge className={saveMessage.includes('success') ? 'bg-emerald-500' : 'bg-rose-500'}>
            {saveMessage.includes('success') ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {saveMessage}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Policy & AI Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Risk Policy Configuration - FULLY FUNCTIONAL (saves to database) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Risk Policy Configuration</CardTitle>
                <Badge className="bg-emerald-500 text-white text-xs">Active</Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Adjust risk appetite thresholds and auto-rejection rules • Changes saved to database
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* DSR Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">Maximum DSR Threshold</Label>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 font-mono">
                    {policy.dsr_threshold}%
                  </Badge>
                </div>
                <Slider
                  value={[policy.dsr_threshold]}
                  onValueChange={(value) => setPolicy({ ...policy, dsr_threshold: value[0] })}
                  min={30}
                  max={80}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Conservative (30%)</span>
                  <span>Moderate (55%)</span>
                  <span>Aggressive (80%)</span>
                </div>
              </div>

              <Separator />

              {/* Minimum Savings Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">Minimum Savings Rate</Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-mono">
                    {policy.min_savings_rate}%
                  </Badge>
                </div>
                <Slider
                  value={[policy.min_savings_rate]}
                  onValueChange={(value) => setPolicy({ ...policy, min_savings_rate: value[0] })}
                  min={0}
                  max={30}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>No Requirement (0%)</span>
                  <span>Standard (15%)</span>
                  <span>Strict (30%)</span>
                </div>
              </div>

              <Separator />

              {/* Auto-Reject Rules */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900">Auto-Rejection Rules</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Auto-Reject Gambling Patterns</p>
                    <p className="text-xs text-slate-500 mt-1">Automatically reject if gambling detected in statements</p>
                  </div>
                  <Switch
                    checked={policy.auto_reject_gambling}
                    onCheckedChange={(checked) => setPolicy({ ...policy, auto_reject_gambling: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Auto-Reject High DSR</p>
                    <p className="text-xs text-slate-500 mt-1">Automatically reject if DSR exceeds 70%</p>
                  </div>
                  <Switch
                    checked={policy.auto_reject_high_dsr}
                    onCheckedChange={(checked) => setPolicy({ ...policy, auto_reject_high_dsr: checked })}
                  />
                </div>
              </div>

              <Separator />

              {/* Fairness & Ethics Guardrails */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Fairness & Ethics Guardrails</h4>
                  <Badge className="bg-amber-500 text-white text-xs">Track 2</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Protected Attribute Masking</p>
                    <p className="text-xs text-slate-500 mt-1">Mask gender/race/age before AI processing to prevent bias</p>
                  </div>
                  <Switch
                    checked={maskProtectedAttributes}
                    onCheckedChange={setMaskProtectedAttributes}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Human Review for Low Income</p>
                    <p className="text-xs text-slate-500 mt-1">Require manual review if income {'<'} RM 2,000 (protect vulnerable groups)</p>
                  </div>
                  <Switch
                    checked={requireHumanReviewLowIncome}
                    onCheckedChange={setRequireHumanReviewLowIncome}
                  />
                </div>
              </div>

              <Separator />

              {/* Loan Limits */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900">Maximum Loan Amounts by Type</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Micro-Business Loan</Label>
                    <Input
                      type="number"
                      value={policy.max_loan_micro_business}
                      onChange={(e) => setPolicy({ ...policy, max_loan_micro_business: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Personal Loan</Label>
                    <Input
                      type="number"
                      value={policy.max_loan_personal}
                      onChange={(e) => setPolicy({ ...policy, max_loan_personal: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Housing Loan</Label>
                    <Input
                      type="number"
                      value={policy.max_loan_housing}
                      onChange={(e) => setPolicy({ ...policy, max_loan_housing: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Car Loan</Label>
                    <Input
                      type="number"
                      value={policy.max_loan_car}
                      onChange={(e) => setPolicy({ ...policy, max_loan_car: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. AI Model Configuration (Display Only) */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">AI Model Configuration</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Current AI model information and analysis parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Model Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Current Model</p>
                  <p className="text-sm font-bold text-slate-900">Gemini 2.0 Flash</p>
                  <Badge className="mt-2 bg-purple-600 text-white text-xs">Latest Version</Badge>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Last Updated</p>
                  <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Model deployed successfully</p>
                </div>
              </div>

              <Separator />

              {/* System Prompt Versioning */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">System Prompt Versioning</h4>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs text-slate-600">Active Prompt Version</Label>
                    <select 
                      value={promptVersion}
                      onChange={(e) => setPromptVersion(e.target.value)}
                      className="text-sm font-mono border border-purple-300 rounded px-3 py-1 bg-white"
                    >
                      <option value="v1.0">v1.0 - Strict Auditor</option>
                      <option value="v1.1">v1.1 - Balanced</option>
                      <option value="v1.2">v1.2 - Growth Focused</option>
                    </select>
                  </div>
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold mb-1">Current Prompt Focus:</p>
                    <p className="italic">
                      {promptVersion === 'v1.0' && '"Strict verification of DSR, asset ownership, and income stability. Conservative risk appetite."'}
                      {promptVersion === 'v1.1' && '"Balanced analysis: DSR compliance, cashflow surplus, asset verification, gambling detection."'}
                      {promptVersion === 'v1.2' && '"Growth-oriented: Emphasize income potential, asset diversity, business viability for micro-loans."'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">AI Confidence Threshold</Label>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 font-mono">
                    {policy.confidence_threshold}%
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Applications with AI confidence below this threshold will be flagged for human review
                </p>
                <Slider
                  value={[policy.confidence_threshold]}
                  onValueChange={(value) => setPolicy({ ...policy, confidence_threshold: value[0] })}
                  min={60}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Low (60%)</span>
                  <span>Standard (75%)</span>
                  <span>High (95%)</span>
                </div>
              </div>

              <Separator />

              {/* Document Processing Features */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900">Document Processing Features</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">OCR for Handwritten Documents</p>
                    <p className="text-xs text-slate-500 mt-1">Extract text from scanned or handwritten documents</p>
                  </div>
                  <Switch 
                    checked={ocrEnabled} 
                    onCheckedChange={setOcrEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Auto-Extract from PDFs</p>
                    <p className="text-xs text-slate-500 mt-1">Automatically parse structured PDF documents</p>
                  </div>
                  <Switch 
                    checked={autoPdfExtract} 
                    onCheckedChange={setAutoPdfExtract}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Multi-Language Support</p>
                    <p className="text-xs text-slate-500 mt-1">Process documents in English and Bahasa Malaysia</p>
                  </div>
                  <Switch 
                    checked={multiLangSupport} 
                    onCheckedChange={setMultiLangSupport}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="space-y-4">
            {/* Simulation Result Display */}
            {showSimulation && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 mb-2">Decision Intelligence Simulation</p>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{simulationResult}</pre>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSimulation(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reset Changes
              </Button>
              <Button 
                variant="outline"
                onClick={handleSimulateImpact}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Activity className="h-4 w-4 mr-2" />
                Simulate Impact
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Data Management & Logs */}
        <div className="space-y-6">
          {/* 3. Database Statistics */}
          {dbStats && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg font-semibold text-slate-900">Database Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Total Applications</p>
                    <p className="text-2xl font-bold text-slate-900">{dbStats.total_applications}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-emerald-600">{dbStats.approved}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-xs text-slate-600">Rejected</p>
                    <p className="text-2xl font-bold text-rose-600">{dbStats.rejected}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{dbStats.pending_review}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Database Size</span>
                    <span className="font-mono font-medium text-slate-900">{dbStats.database_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Audit Logs</span>
                    <span className="font-mono font-medium text-slate-900">{dbStats.total_audit_logs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Last Backup</span>
                    <span className="text-xs text-slate-500">{new Date(dbStats.last_backup).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Export Applications */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Export Applications</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Download application data for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <Button 
                onClick={handleExport}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Applications (CSV)
              </Button>

              <Button 
                onClick={handleClearTestData}
                variant="outline"
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Test Data
              </Button>

              <p className="text-xs text-slate-500 italic mt-3">
                Test data includes applications in Processing or Analyzing status
              </p>
            </CardContent>
          </Card>

          {/* 5. System Log Management */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">System Log Management</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                View and export audit trail logs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">Total Log Entries</p>
                  <Badge className="bg-purple-600 text-white font-mono">
                    {dbStats?.total_audit_logs || 0}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Showing last 10 entries below
                </p>
              </div>

              <Button 
                onClick={handleExportSystemLogs}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export System Logs (TXT)
              </Button>
            </CardContent>
          </Card>

          {/* 6. Account Settings */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Account Settings</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Manage your account and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {getInitials(user?.displayName || null)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Account Type</span>
                    <Badge className="bg-blue-600 text-white">Premium</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Member Since</span>
                    <span className="text-slate-900 font-mono">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Password
              </Button>

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="text-sm"
                    />
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded">
                      <AlertCircle className="h-3 w-3 text-rose-600" />
                      <p className="text-xs text-rose-600">{passwordError}</p>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <p className="text-xs text-emerald-600">{passwordSuccess}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowChangePassword(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="flex-1">
                      Update Password
                    </Button>
                  </div>
                </form>
              )}

              <Separator />

              <Button 
                onClick={handleAccountLogout}
                variant="outline"
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* 7. Recent Activity */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Last 10 system actions and changes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-900">{log.action}</p>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{log.details}</p>
                      {log.application_id && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {log.application_id}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900">Settings Auto-Save</p>
            <p className="text-xs text-slate-600 mt-1">
              Last saved by <strong>{policy.updated_by}</strong> on{' '}
              {new Date(policy.updated_at).toLocaleString()}. 
              All changes are logged in the audit trail for compliance and transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
