"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="InsightLoan Logo" 
            width={36} 
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="text-xl font-bold text-slate-900 tracking-tight">InsightLoan</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="mb-2 px-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main</span>
        </div>
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Support Card */}
      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">Need Support?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Have a conversation with our AI Assistant to get support.</p>
        </div>
      </div>
    </div>
  )
}
