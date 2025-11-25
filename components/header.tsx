import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-slate-900">TrustLens AI</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2 border-l pl-4 border-slate-200">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
            JD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900">John Doe</p>
            <p className="text-xs text-slate-500">Senior Underwriter</p>
          </div>
        </div>
      </div>
    </header>
  )
}
