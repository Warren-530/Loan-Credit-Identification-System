import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LogoutButton from "@/components/logout-button"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Logout</h3>
            <p className="text-sm text-slate-500 mb-4">Sign out from your account</p>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            Configure system settings, user preferences, and API integrations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
