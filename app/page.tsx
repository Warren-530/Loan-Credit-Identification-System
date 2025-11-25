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

  const loadApplications = useCallback(async () => {
    try {
      const data = await api.getApplications()
      setApplications(data)
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
        <NewApplicationModal />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-slate-500">
              {applications.length === 0 ? "No applications yet" : "All time"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.score !== null && app.score < 50).length}
            </div>
            <p className="text-xs text-slate-500">
              {applications.length > 0 
                ? `${((applications.filter(app => app.score < 50).length / applications.length) * 100).toFixed(1)}% of total`
                : "0% of total"
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~5s</div>
            <p className="text-xs text-slate-500">AI analysis time</p>
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
                <TableHead>Applicant ID</TableHead>
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
                      {String((app as unknown as {review_status?: string}).review_status) === "Manual_Override" ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <OverrideIcon className="h-3 w-3 mr-1" />
                          Manual Override
                        </Badge>
                      ) : String((app as unknown as {review_status?: string}).review_status) === "Human_Verified" ? (
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
    </div>
  )
}
