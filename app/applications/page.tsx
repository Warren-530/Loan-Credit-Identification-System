import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Applications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            Advanced filtering and search capabilities for all applications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
