"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, CheckCircle2, ArrowRight } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export function NewApplicationModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [applicationId, setApplicationId] = useState("")
  const [loanType, setLoanType] = useState("Micro-Business Loan")
  const [icNumber, setIcNumber] = useState("")
  const [applicantName, setApplicantName] = useState("")
  const [requestedAmount, setRequestedAmount] = useState("50000")
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [essay, setEssay] = useState<File | null>(null)
  const [payslip, setPayslip] = useState<File | null>(null)
  const [batchFile, setBatchFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    if (!bankStatement || !icNumber || !applicantName) {
      alert("Please provide Applicant Name, IC Number and Bank Statement")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("loan_type", loanType)
      formData.append("ic_number", icNumber)
      formData.append("applicant_name", applicantName)
      formData.append("requested_amount", requestedAmount)
      formData.append("bank_statement", bankStatement)
      if (essay) formData.append("essay", essay)
      if (payslip) formData.append("payslip", payslip)

      const result = await api.uploadApplication(formData)
      
      setOpen(false)
      // Reset form
      setIcNumber("")
      setApplicantName("")
      setBankStatement(null)
      setEssay(null)
      setPayslip(null)
      
      // Show success modal
      setApplicationId(result.application_id)
      setSuccessMessage("Application submitted successfully!")
      setShowSuccess(true)
      
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to submit application: ${errorMessage}`)
      console.error("Submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSubmit = async () => {
    if (!batchFile) {
      alert("Please upload a CSV or ZIP file")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", batchFile)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/upload/batch`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Batch upload failed")
      
      const result = await response.json()
      
      setOpen(false)
      setBatchFile(null)
      
      // Show success modal
      setApplicationId("")
      setSuccessMessage(`Batch upload successful! ${result.processed_count} applications queued for processing`)
      setShowSuccess(true)
      
      router.refresh()
    } catch (error) {
      alert("Failed to upload batch file. Please try again.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Loan Application</DialogTitle>
          <DialogDescription>
            Ingest new loan applications for AI processing.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Entry</TabsTrigger>
            <TabsTrigger value="batch">Batch Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant-name">Applicant Name *</Label>
                <Input 
                  id="applicant-name" 
                  placeholder="e.g. Ali bin Ahmad"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic-number">Applicant ID / IC *</Label>
                <Input 
                  id="ic-number" 
                  placeholder="e.g. 890101-14-5566"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loan-type">Loan Type</Label>
              <select
                id="loan-type"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option>Micro-Business Loan</option>
                <option>Personal Loan</option>
                <option>Housing Loan</option>
                <option>Car Loan</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Requested Amount (RM)</Label>
              <Input 
                id="amount" 
                type="number"
                placeholder="50000"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bank Statement (PDF/TXT) *</Label>
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setBankStatement(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {bankStatement && (
                <p className="text-xs text-emerald-600">✓ {bankStatement.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Loan Essay (PDF/TXT)</Label>
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setEssay(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {essay && (
                <p className="text-xs text-emerald-600">✓ {essay.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payslip (PDF/TXT)</Label>
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setPayslip(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {payslip && (
                <p className="text-xs text-emerald-600">✓ {payslip.name}</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={loading || !bankStatement || !icNumber || !applicantName}
              >
                {loading ? "Processing..." : "Start AI Analysis"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="batch" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Batch Upload Format</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a CSV file with columns: loan_type, ic_number, applicant_name, requested_amount, bank_statement_path, essay_path
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Or upload a ZIP file containing a manifest.csv and all document files
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Upload CSV or ZIP File</Label>
                <Input
                  type="file"
                  accept=".csv,.zip"
                  onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {batchFile && (
                  <p className="text-xs text-emerald-600">✓ {batchFile.name}</p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-900 mb-2">CSV Example Format:</p>
                <pre className="text-xs text-slate-600 overflow-x-auto">
{`loan_type,ic_number,applicant_name,requested_amount
Micro-Business Loan,890101-14-5566,Ali bin Ahmad,50000
Personal Loan,920202-15-7788,Sarah Tan,25000`}
                </pre>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleBatchSubmit}
                  disabled={loading || !batchFile}
                >
                  {loading ? "Processing..." : "Upload Batch"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            
            <div className="text-center space-y-2">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Success!
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600">
                {successMessage}
              </DialogDescription>
            </div>
            
            {applicationId && (
              <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Application ID</p>
                <p className="text-sm font-mono font-semibold text-slate-900 break-all">
                  {applicationId}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSuccess(false)}
              >
                Close
              </Button>
              {applicationId && (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowSuccess(false)
                    router.push(`/application/${applicationId}`)
                  }}
                >
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
