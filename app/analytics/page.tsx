"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ReferenceLine, ZAxis, Label,
  LineChart, Line, Area, AreaChart, ComposedChart
} from "recharts"
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, Clock, 
  CheckCircle2, AlertTriangle, ShieldAlert, Users, FileCheck, Calendar, Zap
} from "lucide-react"

interface ScatterPoint {
  income: number
  dsr: number
  status: string
  name: string
  id: string
}

interface TrendData {
  date: string
  total: number
  approved: number
  rejected: number
  approval_rate: number
}

interface RiskBreakdown {
  risk_level: string
  approved: number
  rejected: number
  pending: number
  approval_rate: number
}

interface RiskAnalysis {
  breakdown: RiskBreakdown[]
  processing_time: { range: string; count: number }[]
}

interface AnalyticsData {
  kpi: {
    total_applications: number
    total_exposure: number
    avg_risk_score: number
    approval_rate: number
    avg_processing_time: string
    ai_human_agreement: number
  }
  charts: {
    score_distribution: { range: string; count: number }[]
    loan_composition: { name: string; value: number }[]
    top_risk_flags: { name: string; count: number }[]
    status_breakdown: { name: string; count: number }[]
  }
  overrides: {
    id: string
    name: string
    ai_decision: string
    human_decision: string
    reason: string
    date: string
  }[]
  advanced: {
    financial_scatter: ScatterPoint[]
    application_trends: TrendData[]
    risk_level_analysis: RiskAnalysis
  }
}

const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analytics/summary`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-600">Failed to load analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8 pb-16 max-w-[1800px] mx-auto bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Portfolio Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive risk monitoring and operational insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1.5 text-xs font-medium border-slate-300">
            Last Updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* KPI Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Total Applications */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Applications</p>
              <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{data.kpi.total_applications}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Portfolio Size</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Exposure */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Exposure</p>
              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              RM {(data.kpi.total_exposure / 1000000).toFixed(2)}M
            </h3>
            <p className="text-xs text-slate-500 mt-1">Approved Loan Value</p>
          </CardContent>
        </Card>

        {/* Average Risk Score */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Risk Score</p>
              <div className="h-9 w-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{data.kpi.avg_risk_score}</h3>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  data.kpi.avg_risk_score >= 80 ? 'bg-emerald-500' : 
                  data.kpi.avg_risk_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`} 
                style={{ width: `${data.kpi.avg_risk_score}%` }} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Approval Rate */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approval Rate</p>
              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{data.kpi.approval_rate}%</h3>
            <p className="text-xs text-slate-500 mt-1">Decision Breakdown</p>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Processing</p>
              <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{data.kpi.avg_processing_time}</h3>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              85% faster than manual
            </p>
          </CardContent>
        </Card>

        {/* AI-Human Agreement */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI Accuracy</p>
              <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{data.kpi.ai_human_agreement}%</h3>
            <p className="text-xs text-slate-500 mt-1">Human Agreement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Risk Score Distribution */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Risk Score Distribution</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Portfolio credit score breakdown across risk tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="range" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.3 }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#4f46e5" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loan Composition */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Loan Composition</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Portfolio breakdown by loan category
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.loan_composition}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.charts.loan_composition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Application Status Breakdown */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Application Status Breakdown</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Current status distribution across all applications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              {data.charts.status_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.status_breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9', opacity: 0.3 }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4f46e5" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No status data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Risk Flags */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Top Risk Indicators</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Most frequently detected risk flags across portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {data.charts.top_risk_flags.length > 0 ? (
                data.charts.top_risk_flags.map((flag, idx) => {
                  const percentage = (flag.count / data.kpi.total_applications) * 100
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 text-xs">{flag.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">{flag.count} cases</span>
                          <span className="text-slate-400 text-xs">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            idx === 0 ? 'bg-rose-500' :
                            idx === 1 ? 'bg-orange-500' :
                            idx === 2 ? 'bg-amber-500' :
                            idx === 3 ? 'bg-yellow-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-[240px] text-slate-400 text-sm">
                  No risk flags detected
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Human Override Monitor */}
      <Card className="bg-white border-slate-200 shadow-sm mt-2">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-semibold text-slate-900">AI Override Monitor</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Recent instances where human decision differed from AI recommendation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {data.overrides.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">Perfect AI-Human Alignment</p>
                <p className="text-xs text-slate-500 mt-1">No overrides detected in recent applications</p>
              </div>
            ) : (
              data.overrides.map((override, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-900">{override.name}</p>
                      <span className="text-xs text-slate-500 font-mono">{override.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2 flex-wrap">
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-300 font-medium">
                        AI: {override.ai_decision}
                      </Badge>
                      <span className="text-slate-400">→</span>
                      <Badge className="bg-purple-600 text-white hover:bg-purple-700 font-medium">
                        Human: {override.human_decision}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &quot;{override.reason}&quot;
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ADVANCED ANALYTICS SECTION */}
      <div className="pt-8 mt-8 border-t-2 border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Advanced Risk Intelligence</h2>
        <p className="text-sm text-slate-500 mb-8">Multi-dimensional analysis and predictive insights</p>
      </div>

      {/* 1. Financial Health Scatter Plot */}
      {data.advanced?.financial_scatter && data.advanced.financial_scatter.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Financial Health Landscape</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Income vs Debt Service Ratio correlation analysis with risk clustering visualization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="income" 
                    name="Monthly Income" 
                    unit=" RM"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Net Monthly Income (RM)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#475569' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="dsr" 
                    name="DSR" 
                    unit="%"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    label={{ value: 'Debt Service Ratio (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#475569' }}
                  />
                  <ZAxis range={[60, 200]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-semibold text-slate-900 text-xs mb-1">{data.name}</p>
                            <p className="text-xs text-slate-600">Income: RM {data.income.toLocaleString()}</p>
                            <p className="text-xs text-slate-600">DSR: {data.dsr.toFixed(1)}%</p>
                            <p className="text-xs">
                              <Badge className={
                                data.status === 'Approved' ? 'bg-emerald-500' :
                                data.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                              }>
                                {data.status}
                              </Badge>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                    <Label value="High Risk Threshold (DSR 60%)" position="right" fill="#ef4444" fontSize={11} />
                  </ReferenceLine>
                  <Scatter 
                    name="Approved" 
                    data={data.advanced.financial_scatter.filter(d => d.status === 'Approved')} 
                    fill="#10b981"
                    opacity={0.7}
                  />
                  <Scatter 
                    name="Rejected" 
                    data={data.advanced.financial_scatter.filter(d => d.status === 'Rejected')} 
                    fill="#ef4444"
                    opacity={0.7}
                  />
                  <Scatter 
                    name="Pending" 
                    data={data.advanced.financial_scatter.filter(d => d.status === 'Pending' || (!['Approved', 'Rejected'].includes(d.status)))} 
                    fill="#f59e0b"
                    opacity={0.7}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    iconType="circle"
                    verticalAlign="bottom"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Insight:</strong> Applications clustered in the top-left quadrant (low income, high DSR) represent the highest risk segment. 
                The reference line at 60% DSR marks the critical threshold - data points above this line require enhanced scrutiny.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Trends & Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* 2. Application Trends Over Time */}
        {data.advanced?.application_trends && data.advanced.application_trends.length > 0 && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Application Trends Over Time</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Daily submission volume and approval rate patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.advanced.application_trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      label={{ value: 'Applications', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#64748b' }}
                      domain={[0, 100]}
                      label={{ value: 'Approval %', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#64748b' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Apps" />
                    <Bar yAxisId="left" dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                    <Bar yAxisId="left" dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="approval_rate" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Approval Rate %"
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Risk Level Analysis */}
        {data.advanced?.risk_level_analysis && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">Risk Level Analysis</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Approval patterns by risk tier and processing time distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                {/* Risk Level Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Decision Breakdown by Risk Tier</h4>
                  <div className="h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.advanced.risk_level_analysis.breakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis 
                          type="category" 
                          dataKey="risk_level" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '11px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                        <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                        <Bar dataKey="pending" stackId="a" fill="#64748b" name="Pending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Processing Time Distribution */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Processing Time Distribution</h4>
                  <div className="h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.advanced.risk_level_analysis.processing_time}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="range" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '11px'
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
