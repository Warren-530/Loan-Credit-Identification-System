"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, Clock, AlertCircle, FileText, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Notification {
  id: number
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  time: string
  read: boolean
  link?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const getNotificationType = (action: string): 'success' | 'warning' | 'info' | 'error' => {
    if (action.includes('Approved')) return 'success'
    if (action.includes('Rejected')) return 'error'
    if (action.includes('Override')) return 'warning'
    if (action.includes('Changed')) return 'info'
    return 'info'
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-emerald-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-rose-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-600" />
      default: return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`)
      if (res.ok) {
        const data = await res.json()
        const logs = data.audit_logs || []
        
        // Convert audit logs to notifications
        const notifs: Notification[] = logs.slice(0, 10).map((log: { id: number; action: string; details: string; timestamp: string; application_id?: string }) => ({
          id: log.id,
          type: getNotificationType(log.action),
          title: log.action,
          message: log.details,
          time: new Date(log.timestamp).toLocaleTimeString(),
          read: false,
          link: log.application_id ? `/application/${log.application_id}` : undefined
        }))
        
        setNotifications(notifs)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-slate-500 relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-white text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <Bell className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => {
                        if (notification.link) {
                          window.location.href = notification.link
                        }
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          notification.type === 'success' ? 'bg-emerald-100' :
                          notification.type === 'error' ? 'bg-rose-100' :
                          notification.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900 leading-tight">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  window.location.href = '/settings'
                  setOpen(false)
                }}
              >
                <SettingsIcon className="h-3 w-3 mr-2" />
                View all activity in Settings
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
