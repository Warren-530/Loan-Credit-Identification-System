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
import { Plus, CheckCircle2, ArrowRight, FileText, Upload } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export function NewApplicationModal({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [applicationId, setApplicationId] = useState("")
  
  // 4 Required Documents (removed manual input fields)
  const [applicationForm, setApplicationForm] = useState<File | null>(null)
  const [bankStatement, setBankStatement] = useState<File | null>(null)
  const [essay, setEssay] = useState<File | null>(null)
  const [payslip, setPayslip] = useState<File | null>(null)
  const [supportingDoc1, setSupportingDoc1] = useState<File | null>(null)
  const [supportingDoc2, setSupportingDoc2] = useState<File | null>(null)
  const [supportingDoc3, setSupportingDoc3] = useState<File | null>(null)
  const [batchFile, setBatchFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    // Validate all 4 documents are uploaded
    if (!applicationForm || !bankStatement || !essay || !payslip) {
      alert("Please upload ALL 4 required documents:\n1. Application Form\n2. Bank Statement\n3. Loan Essay\n4. Payslip")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("application_form", applicationForm)
      formData.append("bank_statement", bankStatement)
      formData.append("essay", essay)
      formData.append("payslip", payslip)
      
      // Append supporting documents individually
      if (supportingDoc1) formData.append("supporting_doc_1", supportingDoc1)
      if (supportingDoc2) formData.append("supporting_doc_2", supportingDoc2)
      if (supportingDoc3) formData.append("supporting_doc_3", supportingDoc3)

      const result = await api.uploadApplication(formData)
      
      setOpen(false)
      // Reset form
      setApplicationForm(null)
      setBankStatement(null)
      setEssay(null)
      setPayslip(null)
      setSupportingDoc1(null)
      setSupportingDoc2(null)
      setSupportingDoc3(null)
      
      // Show success modal
      setApplicationId(result.application_id)
      setSuccessMessage("Application submitted! AI is extracting applicant information from Application Form...")
      setShowSuccess(true)
      
      // Notify parent to reload data
      if (onUploadSuccess) {
        onUploadSuccess()
      }
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
          <TabsContent value="single" className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">AI-Powered Application Processing</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Upload 4 required documents. AI will automatically extract applicant information from the Application Form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</span>
                    Application Form (PDF) *
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setApplicationForm(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {applicationForm && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {applicationForm.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Official loan application form with applicant details</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</span>
                    Bank Statement (PDF) *
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setBankStatement(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {bankStatement && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {bankStatement.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Recent bank account transaction history</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
                    Loan Essay (PDF) *
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEssay(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {essay && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {essay.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Applicant's written explanation of loan purpose</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">4</span>
                    Payslip (PDF) *
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPayslip(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {payslip && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {payslip.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Recent salary slip for income verification</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">5</span>
                    Supporting Document 1 (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSupportingDoc1(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {supportingDoc1 && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {supportingDoc1.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">6</span>
                    Supporting Document 2 (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSupportingDoc2(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {supportingDoc2 && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {supportingDoc2.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">7</span>
                    Supporting Document 3 (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSupportingDoc3(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {supportingDoc3 && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {supportingDoc3.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Additional proofs (e.g., Business Registration, Utility Bills)</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit}
                  disabled={loading || !applicationForm || !bankStatement || !essay || !payslip}
                >
                  {loading ? "Processing..." : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Submit & Analyze with AI
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="batch" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Batch Upload Format (ZIP)</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a ZIP file containing multiple folders. Each folder represents one applicant.
                </p>
                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono">
                  <p className="font-bold mb-1">Structure Example:</p>
                  <p>batch_upload.zip</p>
                  <p className="pl-4">├── Applicant_Ali/</p>
                  <p className="pl-8">├── application_form.pdf</p>
                  <p className="pl-8">├── bank_statement.pdf</p>
                  <p className="pl-8">├── loan_essay.pdf</p>
                  <p className="pl-8">└── payslip.pdf</p>
                  <p className="pl-4">├── Applicant_Siti/</p>
                  <p className="pl-8">└── ...</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  <span className="font-semibold">Auto-Detection:</span> The system automatically identifies files based on keywords in filenames (e.g., &quot;form&quot;, &quot;bank&quot;, &quot;essay&quot;, &quot;payslip&quot;).
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Upload ZIP File</Label>
                <Input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {batchFile && (
                  <p className="text-xs text-emerald-600">✓ {batchFile.name}</p>
                )}
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
