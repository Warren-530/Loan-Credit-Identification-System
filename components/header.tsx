"use client"

import { useState } from "react"
import { NotificationCenter } from "./notification-center"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogOut, User, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-bold text-slate-900">Welcome Back!</h2>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationCenter />
        <div className="relative border-l pl-4 border-slate-200">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center space-x-3 hover:bg-slate-50 rounded-xl p-2 transition-all duration-200"
          >
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {getInitials(user?.displayName || null)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-900">{user?.displayName || "User"}</p>
              <p className="text-xs text-slate-500 font-medium">{user?.email || "user@example.com"}</p>
            </div>
          </button>

          {/* Account Dropdown Menu */}
          {showAccountMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowAccountMenu(false)}
              />
              <Card className="absolute right-0 top-14 w-72 z-20 shadow-lg border-slate-200">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border-2 border-indigo-200">
                      {getInitials(user?.displayName || null)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user?.displayName || "User"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-700 hover:text-slate-900"
                      onClick={() => {
                        router.push("/settings")
                        setShowAccountMenu(false)
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      <p>Signed in as</p>
                      <p className="font-semibold text-slate-700 truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
