"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NewApplicationModal } from "@/components/new-application-modal"
import { ArrowUpRight, Clock, AlertTriangle, CheckCircle, Bot, User, AlertCircle as OverrideIcon } from "lucide-react"
import Link from "next/link"
import { api, type Application } from "@/lib/api"

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [avgProcessingTime, setAvgProcessingTime] = useState<number>(0)

  const loadApplications = useCallback(async () => {
    try {
      const data = await api.getApplications()
      setApplications(data)
      
      // Fetch stats for processing time
      const stats = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications/stats`)
      const statsData = await stats.json()
      setAvgProcessingTime(statsData.avg_processing_time || 0)
    } catch (error) {
      console.error("Failed to load applications:", error)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await loadApplications()
    })()
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      void loadApplications()
    }, 5000)
    return () => clearInterval(interval)
  }, [loadApplications])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <NewApplicationModal onUploadSuccess={loadApplications} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Processed</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{applications.length}</div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {applications.length === 0 ? "No applications yet" : "All time applications"}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">High Risk Flagged</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              {applications.filter(app => app.score !== null && app.score < 50).length}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {applications.length > 0 
                ? `${((applications.filter(app => app.score < 50).length / applications.length) * 100).toFixed(1)}% of total`
                : "0% of total"
              }
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Avg Processing Time</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              {avgProcessingTime > 0 ? `${avgProcessingTime.toFixed(1)}s` : 'N/A'}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">AI analysis time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Loan Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <CheckCircle className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-900">No applications yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Click &quot;New Application&quot; to start processing loan applications
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.id}</TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {app.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{app.amount}</TableCell>
                    <TableCell>
                      {app.status === "Analyzing" || app.status === "Processing" ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col gap-2">
                            <div className="h-8 w-16 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 rounded animate-pulse" style={{backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}} />
                            <div className="h-1.5 w-20 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-full animate-pulse" style={{backgroundSize: '200% 100%', animation: 'shimmer 2s infinite'}} />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                            <span className="text-xs text-indigo-600 font-medium">Analyzing...</span>
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
                        app.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        app.status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        app.status === "Review Required" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        app.status === "Failed" ? "bg-red-50 text-red-700 border border-red-200" :
                        app.status === "Analyzing" || app.status === "Processing" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        "bg-slate-50 text-slate-700 border border-slate-200"
                      }>
                        {app.status === "Analyzing" || app.status === "Processing" ? "Processing..." : app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {String((app as unknown as {review_status?: string}).review_status) === "Manual_Override" ? (
                        <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                          <OverrideIcon className="h-3 w-3 mr-1" />
                          Manual Override
                        </Badge>
                      ) : String((app as unknown as {review_status?: string}).review_status) === "Human_Verified" ? (
                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <User className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-white text-slate-600 border-slate-300">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Analysis
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/application/${app.id}`}>
                        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                          View <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
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
    </div>
  )
}
