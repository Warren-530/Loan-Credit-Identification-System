"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Don't protect auth routes
  const isAuthRoute = pathname === '/auth'

  useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      router.push('/auth')
    }
  }, [user, loading, router, isAuthRoute])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow auth page to be accessed without login
  if (isAuthRoute) {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
