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
import { ArrowUpRight, Search, Filter, ArrowUpDown, CheckSquare, Trash2, Bot, User, AlertCircle as OverrideIcon, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { api, type Application } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filter states
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [reviewStatusFilters, setReviewStatusFilters] = useState<Set<string>>(new Set())
  const [loanTypeFilters, setLoanTypeFilters] = useState<Set<string>>(new Set())

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

    // Sorting
    switch (sortBy) {
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
  }, [applications, searchTerm, statusFilters, reviewStatusFilters, loanTypeFilters, sortBy])

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

  const handleDelete = async () => {
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/application/${id}`, {
          method: 'DELETE'
        })
      )
      await Promise.all(deletePromises)
      setSelectedIds(new Set())
      setShowDeleteDialog(false)
      await loadApplications()
    } catch (error) {
      console.error("Failed to delete applications:", error)
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

  const uniqueLoanTypes = Array.from(new Set(applications.map(app => app.type).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
      </div>

      <Card>
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
                  {(statusFilters.size + reviewStatusFilters.size + loanTypeFilters.size > 0) && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {statusFilters.size + reviewStatusFilters.size + loanTypeFilters.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
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
                <DropdownMenuLabel>Review Status</DropdownMenuLabel>
                {['AI Pending', 'Verified', 'Manual Override'].map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={reviewStatusFilters.has(status)}
                    onCheckedChange={() => toggleReviewStatusFilter(status)}
                  >
                    {status}
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

            {/* Delete */}
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
                  <TableRow key={app.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onCheckedChange={() => toggleSelection(app.id)}
                      />
                    </TableCell>
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
                      {app.review_status === "Manual Override" ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <OverrideIcon className="h-3 w-3 mr-1" />
                          Manual Override
                        </Badge>
                      ) : app.review_status === "Verified" ? (
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
