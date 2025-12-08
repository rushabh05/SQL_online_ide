'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Database } from 'lucide-react'

interface AuthGuardProps {
    children: React.ReactNode
    requireAuth?: boolean  // If false, allows guest access
}

export function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Only redirect if auth is required and user is not logged in
        if (requireAuth && !loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router, requireAuth])

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full animate-pulse"></div>
                        <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                            <Database className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                            <span className="text-lg text-gray-300">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // If auth is required and user is not logged in, show nothing while redirecting
    if (requireAuth && !user) {
        return null
    }

    // Allow access (either authenticated or guest mode)
    return <>{children}</>
}
