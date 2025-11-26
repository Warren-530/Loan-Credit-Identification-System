"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowUpRight, Search, Filter, ArrowUpDown, CheckSquare, Trash2, Bot, User, AlertCircle as OverrideIcon, AlertTriangle, CheckCircle, Clock, FileDown, Star } from "lucide-react"
import Link from "next/link"
import { api, type Application } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filter states
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [reviewStatusFilters, setReviewStatusFilters] = useState<Set<string>>(new Set())
  const [loanTypeFilters, setLoanTypeFilters] = useState<Set<string>>(new Set())
  const [highlightedFilter, setHighlightedFilter] = useState(false)

  // Sort state
  const [sortBy, setSortBy] = useState<string>("time-desc")

  const loadApplications = useCallback(async () => {
    try {
      const data = await api.getApplications()
      setApplications(data)
      setFilteredApplications(data)
    } catch (error) {
      console.error("Failed to load applications:", error)
    }
  }, [])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  // Apply search, filters, and sorting
  useEffect(() => {
    let result = [...applications]

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      result = result.filter(app => {
        const id = (app.id || '').toLowerCase()
        const name = (app.name || '').toLowerCase()
        const type = (app.type || '').toLowerCase()
        return id.includes(term) || name.includes(term) || type.includes(term)
      })
    }

    // Status filter
    if (statusFilters.size > 0) {
      result = result.filter(app => statusFilters.has(app.status))
    }

    // Review status filter
    if (reviewStatusFilters.size > 0) {
      result = result.filter(app => reviewStatusFilters.has(app.review_status))
    }

    // Loan type filter
    if (loanTypeFilters.size > 0) {
      result = result.filter(app => app.type && loanTypeFilters.has(app.type))
    }

    // Highlighted filter
    if (highlightedFilter) {
      result = result.filter(app => app.highlighted === true)
    }

    // Sorting
    switch (sortBy) {
      case "highlight-desc":
        // Highlighted first, then by date within each group
        result.sort((a, b) => {
          if (a.highlighted !== b.highlighted) {
            return (b.highlighted ? 1 : 0) - (a.highlighted ? 1 : 0)
          }
          const dateA = new Date(a.date || a.created_at || 0).getTime()
          const dateB = new Date(b.date || b.created_at || 0).getTime()
          return dateB - dateA
        })
        break
      case "score-asc":
        result.sort((a, b) => (a.score || 0) - (b.score || 0))
        break
      case "score-desc":
        result.sort((a, b) => (b.score || 0) - (a.score || 0))
        break
      case "amount-asc":
        result.sort((a, b) => {
          const amountA = a.requested_amount || parseFloat(a.amount?.replace(/[^\d.]/g, '') || '0')
          const amountB = b.requested_amount || parseFloat(b.amount?.replace(/[^\d.]/g, '') || '0')
          return amountA - amountB
        })
        break
      case "amount-desc":
        result.sort((a, b) => {
          const amountA = a.requested_amount || parseFloat(a.amount?.replace(/[^\d.]/g, '') || '0')
          const amountB = b.requested_amount || parseFloat(b.amount?.replace(/[^\d.]/g, '') || '0')
          return amountB - amountA
        })
        break
      case "time-desc":
        // Most recent first (newer dates = higher timestamps)
        result.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at || 0).getTime()
          const dateB = new Date(b.date || b.created_at || 0).getTime()
          return dateB - dateA
        })
        break
      case "time-asc":
        // Least recent first (older dates = lower timestamps)
        result.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at || 0).getTime()
          const dateB = new Date(b.date || b.created_at || 0).getTime()
          return dateA - dateB
        })
        break
    }

    setFilteredApplications(result)
  }, [applications, searchTerm, statusFilters, reviewStatusFilters, loanTypeFilters, sortBy, highlightedFilter])

  const handleSearch = () => {
    // Search is applied automatically through useEffect
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredApplications.map(app => app.id)))
    }
  }

  const toggleStatusFilter = (status: string) => {
    const newFilters = new Set(statusFilters)
    if (newFilters.has(status)) {
      newFilters.delete(status)
    } else {
      newFilters.add(status)
    }
    setStatusFilters(newFilters)
  }

  const handleDelete = async () => {
    // Simple delete implementation
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await api.deleteApplication(id);
    }
    setSelectedIds(new Set());
    setShowDeleteDialog(false);
    window.location.reload(); // Force reload to ensure state is fresh
  }

  const handleToggleHighlight = async () => {
    const ids = Array.from(selectedIds);
    
    // Check if any selected app is not highlighted
    const hasUnhighlighted = applications
      .filter(app => ids.includes(app.id))
      .some(app => !app.highlighted);
    
    // If any are unhighlighted, highlight all. Otherwise, unhighlight all.
    const shouldHighlight = hasUnhighlighted;
    
    for (const id of ids) {
      await api.toggleHighlight(id, shouldHighlight);
    }
    
    // Reload applications
    await loadApplications();
    setSelectedIds(new Set());
  }

  const toggleReviewStatusFilter = (status: string) => {
    const newFilters = new Set(reviewStatusFilters)
    if (newFilters.has(status)) {
      newFilters.delete(status)
    } else {
      newFilters.add(status)
    }
    setReviewStatusFilters(newFilters)
  }

  const toggleLoanTypeFilter = (type: string) => {
    const newFilters = new Set(loanTypeFilters)
    if (newFilters.has(type)) {
      newFilters.delete(type)
    } else {
      newFilters.add(type)
    }
    setLoanTypeFilters(newFilters)
  }

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return
    
    setIsExporting(true)
    try {
      const selectedApps = applications.filter(app => selectedIds.has(app.id))
      
      for (const app of selectedApps) {
        // Fetch full application details for each selected record
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${app.id}`)
        if (!response.ok) continue
        
        const appData = await response.json()
        const analysis = appData.analysis_result
        
        // Create PDF for this application
        const doc = new jsPDF()
        
        // Extract data
        const name = analysis?.applicant_profile?.name || appData.applicant_name || "Unknown"
        const riskScore = appData.risk_score || 0
        const finalDecision = appData.final_decision || appData.status
        const riskLevel = appData.risk_level || (riskScore >= 66 ? "Low" : riskScore >= 41 ? "Medium" : "High")
        const scoreBreakdown = analysis?.risk_score_analysis?.score_breakdown || []
        const riskFlags = analysis?.key_risk_flags || []
        const forensicEvidence = analysis?.forensic_evidence?.claim_vs_reality || []
        
        // ==================== PAGE 1: EXECUTIVE SUMMARY ====================
        // Header
        doc.setFillColor(15, 23, 42)
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
        doc.setFillColor(241, 245, 249)
        doc.rect(20, 50, 170, 40, 'F')
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(name, 25, 60)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Application ID: ${app.id}`, 25, 68)
        doc.text(`Loan Type: ${analysis?.applicant_profile?.loan_type || app.type || 'Personal Loan'}`, 25, 75)
        doc.text(`Requested Amount: ${analysis?.applicant_profile?.requested_amount ? `RM ${analysis.applicant_profile.requested_amount.toLocaleString()}` : app.amount}`, 25, 82)
        doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 130, 68)
        doc.text(`Status: ${finalDecision} (${riskLevel} Risk)`, 130, 75)
        
        // Risk Score Section
        const riskColor = riskScore >= 80 ? [16, 185, 129] : riskScore >= 60 ? [251, 191, 36] : [244, 63, 94]
        doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
        doc.rect(20, 100, 60, 25, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(28)
        doc.setFont('helvetica', 'bold')
        doc.text(riskScore.toString(), 50, 115, { align: 'center' })
        doc.setFontSize(10)
        doc.text('RISK SCORE (/100)', 50, 122, { align: 'center' })
        
        // Decision Section
        doc.setFillColor(riskColor[0], riskColor[1], riskColor[2])
        doc.rect(90, 100, 100, 25, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text(finalDecision.toUpperCase(), 140, 112, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Risk Level: ${riskLevel}`, 140, 120, { align: 'center' })
        
        // Score Breakdown Table
        let yPos = 140
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Risk Score Calculation Breakdown', 20, yPos)
        
        if (scoreBreakdown && scoreBreakdown.length > 0) {
          autoTable(doc, {
            startY: yPos + 5,
            head: [['Category', 'Points', 'Reason']],
            body: scoreBreakdown.map((sb: { category: string; points: number; reason: string }) => [
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
          
          yPos = (doc as any).lastAutoTable.finalY + 10
        }
        
        // Risk Flags
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Key Risk Flags & Findings', 20, yPos)
        
        if (riskFlags && riskFlags.length > 0) {
          autoTable(doc, {
            startY: yPos + 5,
            head: [['Risk Flag', 'Severity', 'Description']],
            body: riskFlags.slice(0, 10).map((f: { flag: string; severity: string; description: string }) => [
              f.flag,
              f.severity || 'Medium',
              f.description || 'See detailed analysis'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 50 },
              1: { cellWidth: 25 },
              2: { cellWidth: 95 }
            }
          })
          
          yPos = (doc as any).lastAutoTable.finalY + 10
        }
        
        // ==================== PAGE 2: DECISION JUSTIFICATION ====================
        if (analysis?.decision_justification) {
          doc.addPage()
          yPos = 20
          
          doc.setFillColor(15, 23, 42)
          doc.rect(0, yPos - 5, 210, 12, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('DECISION JUSTIFICATION', 105, yPos + 3, { align: 'center' })
          yPos += 15
          
          const justification = analysis.decision_justification
          const recommendation = justification.recommendation || finalDecision
          
          // Recommendation Badge
          doc.setTextColor(0, 0, 0)
          const recColor = recommendation === 'APPROVE' ? [16, 185, 129] : 
                          recommendation === 'REVIEW' ? [251, 191, 36] : [244, 63, 94]
          doc.setFillColor(recColor[0], recColor[1], recColor[2])
          doc.roundedRect(20, yPos, 170, 15, 3, 3, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(18)
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
          
          // Strengths and Concerns
          if (justification.strengths || justification.concerns) {
            let leftY = yPos
            if (justification.strengths && justification.strengths.length > 0) {
              doc.setFontSize(11)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(16, 185, 129)
              doc.text('✓ STRENGTHS', 20, leftY)
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
            
            let rightY = yPos
            if (justification.concerns && justification.concerns.length > 0) {
              doc.setFontSize(11)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(244, 63, 94)
              doc.text('⚠ CONCERNS', 110, rightY)
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
        }
        
        // ==================== PAGE 3: FINANCIAL METRICS ====================
        if (analysis?.financial_metrics) {
          doc.addPage()
          yPos = 20
          
          doc.setFillColor(15, 23, 42)
          doc.rect(0, yPos - 5, 210, 12, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('FINANCIAL METRICS ANALYSIS', 105, yPos + 3, { align: 'center' })
          yPos += 18
          
          const metrics = analysis.financial_metrics
          const metricsList = [
            { key: 'debt_service_ratio', label: 'Debt Service Ratio (DSR)', unit: '%' },
            { key: 'net_disposable_income', label: 'Net Disposable Income', unit: 'RM' },
            { key: 'savings_rate', label: 'Savings Rate', unit: '%' },
            { key: 'per_capita_income', label: 'Per Capita Income', unit: 'RM' }
          ]
          
          metricsList.forEach(({ key, label, unit }) => {
            const metric = metrics[key as keyof typeof metrics]
            if (metric && (metric as any).value !== undefined) {
              const metricValue = (metric as any).value
              const metricAssessment = (metric as any).assessment
              
              doc.setDrawColor(203, 213, 225)
              doc.setFillColor(248, 250, 252)
              doc.rect(20, yPos, 170, 22, 'FD')
              
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(0, 0, 0)
              doc.text(label, 22, yPos + 6)
              
              doc.setFontSize(14)
              doc.setTextColor(37, 99, 235)
              const displayValue = unit === 'RM' ? 
                `${unit} ${metricValue.toLocaleString()}` : 
                `${metricValue.toFixed(1)}${unit}`
              doc.text(displayValue, 22, yPos + 15)
              
              if (metricAssessment) {
                const assessColor = metricAssessment.toLowerCase().includes('good') || 
                                   metricAssessment.toLowerCase().includes('excellent') ? [16, 185, 129] :
                                   metricAssessment.toLowerCase().includes('concern') ||
                                   metricAssessment.toLowerCase().includes('high') ? [244, 63, 94] :
                                   [251, 191, 36]
                doc.setFillColor(assessColor[0], assessColor[1], assessColor[2])
                doc.roundedRect(140, yPos + 3, 48, 6, 1, 1, 'F')
                doc.setFontSize(7)
                doc.setTextColor(255, 255, 255)
                doc.text(metricAssessment.substring(0, 22), 164, yPos + 7, { align: 'center' })
              }
              
              yPos += 26
            }
          })
        }
        
        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(9)
          doc.setTextColor(100, 116, 139)
          doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
        }
        
        // Save PDF with unique name
        doc.save(`TrustLens_Report_${app.id}_${new Date().toISOString().split('T')[0]}.pdf`)
        
        // Small delay between exports
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
    } catch (error) {
      console.error('Batch export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const uniqueLoanTypes = Array.from(new Set(applications.map(app => app.type).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
      </div>

      <Card className="sticky top-0 z-10 shadow-md">
        <CardHeader>
          <CardTitle>Search & Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by IC, Name, or Application ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="default">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {(statusFilters.size + reviewStatusFilters.size + loanTypeFilters.size + (highlightedFilter ? 1 : 0) > 0) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {statusFilters.size + reviewStatusFilters.size + loanTypeFilters.size + (highlightedFilter ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {['Approved', 'Rejected', 'Review Required', 'Processing', 'Analyzing', 'Failed'].map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.has(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Highlight Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={highlightedFilter}
                  onCheckedChange={() => setHighlightedFilter(!highlightedFilter)}
                >
                  Show Highlighted Only
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Review Status</DropdownMenuLabel>
                {['AI_Pending', 'Human_Verified', 'Manual_Override'].map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={reviewStatusFilters.has(status)}
                    onCheckedChange={() => toggleReviewStatusFilter(status)}
                  >
                    {status.replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Loan Type</DropdownMenuLabel>
                {uniqueLoanTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={loanTypeFilters.has(type!)}
                    onCheckedChange={() => toggleLoanTypeFilter(type!)}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                  <DropdownMenuRadioItem value="highlight-desc">Highlighted First</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="time-desc">Most Recent</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="time-asc">Least Recent</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="score-desc">Risk Score (High to Low)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="score-asc">Risk Score (Low to High)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="amount-desc">Amount (High to Low)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="amount-asc">Amount (Low to High)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Select All */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectAll}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedIds.size === filteredApplications.length && filteredApplications.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>

            {/* Highlight Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToggleHighlight}
              disabled={selectedIds.size === 0}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Star className="h-4 w-4 mr-2" />
              Highlight ({selectedIds.size})
            </Button>

            {/* Export */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportSelected}
              disabled={selectedIds.size === 0 || isExporting}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : `Export (${selectedIds.size})`}
            </Button>

            {/* Delete Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedIds.size === 0}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead>Application ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Loan Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <CheckCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-900">No applications found</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {searchTerm || statusFilters.size > 0 || reviewStatusFilters.size > 0 || loanTypeFilters.size > 0
                            ? 'Try adjusting your search or filters'
                            : 'Upload a new application to get started'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id}
                    className={app.highlighted ? "bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-400" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onCheckedChange={() => toggleSelection(app.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {app.highlighted && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        {app.id}
                      </div>
                    </TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50">
                        {app.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{app.amount}</TableCell>
                    <TableCell>
                      {app.status === "Analyzing" || app.status === "Processing" ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col gap-2">
                            <div className="h-8 w-16 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded animate-pulse" style={{backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}} />
                            <div className="h-1.5 w-20 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-full animate-pulse" style={{backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}} />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                            <span className="text-xs text-blue-600 font-medium">Analyzing...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className={`text-2xl font-bold tabular-nums ${
                            app.score >= 80 ? "text-emerald-600" :
                            app.score >= 60 ? "text-amber-600" : 
                            app.score > 0 ? "text-rose-600" : "text-slate-400"
                          }`}>
                            {app.score > 0 ? app.score : "—"}
                          </span>
                          {app.score > 0 && (
                            <div className="flex flex-col gap-1">
                              <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    app.score >= 80 ? "bg-emerald-500" :
                                    app.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                                  }`} 
                                  style={{ width: `${Math.min(app.score, 100)}%` }} 
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {app.score >= 80 ? "Low Risk" : app.score >= 60 ? "Medium" : "High Risk"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        app.status === "Approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                        app.status === "Rejected" ? "bg-rose-100 text-rose-800 hover:bg-rose-100" :
                        app.status === "Review Required" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                        app.status === "Failed" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                        app.status === "Analyzing" || app.status === "Processing" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                        "bg-slate-100 text-slate-800 hover:bg-slate-100"
                      }>
                        {app.status === "Analyzing" || app.status === "Processing" ? "Processing..." : app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.review_status === "Manual_Override" ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <OverrideIcon className="h-3 w-3 mr-1" />
                          Manual Override
                        </Badge>
                      ) : app.review_status === "Human_Verified" ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          <User className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 border-slate-300">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Analysis
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/application/${app.id}`}>
                        <Button variant="ghost" size="sm">
                          View <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Applications</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} application{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
