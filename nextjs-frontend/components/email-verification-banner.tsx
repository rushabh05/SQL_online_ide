'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react'

interface EmailVerificationBannerProps {
    onVerified?: () => void
}

export function EmailVerificationBanner({ onVerified }: EmailVerificationBannerProps) {
    const { user, isEmailVerified, resendVerification, refreshUser } = useAuth()
    const [sending, setSending] = useState(false)
    const [checking, setChecking] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [dismissed, setDismissed] = useState(false)

    // Auto-check verification status periodically
    useEffect(() => {
        if (!user || isEmailVerified) return

        const interval = setInterval(async () => {
            await refreshUser()
        }, 10000) // Check every 10 seconds

        return () => clearInterval(interval)
    }, [user, isEmailVerified, refreshUser])

    // Trigger onVerified callback when email is verified
    useEffect(() => {
        if (isEmailVerified && onVerified) {
            onVerified()
        }
    }, [isEmailVerified, onVerified])

    // Don't show if no user, already verified, or dismissed
    if (!user || isEmailVerified || dismissed) {
        return null
    }

    const handleResendVerification = async () => {
        setSending(true)
        setMessage(null)

        try {
            const result = await resendVerification()
            if (result.error) {
                setMessage({ type: 'error', text: result.error })
            } else {
                setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to send verification email' })
        } finally {
            setSending(false)
        }
    }

    const handleCheckVerification = async () => {
        setChecking(true)
        setMessage(null)

        try {
            await refreshUser()
            if (!isEmailVerified) {
                setMessage({ type: 'error', text: 'Email not verified yet. Please check your inbox.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to check verification status' })
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-md p-2.5">
            <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-[11px] text-amber-200">Verify Your Email</h3>
                            <p className="text-[10px] text-amber-200/70 mt-0.5">
                                Please verify your email address ({user.email}) to access all features.
                            </p>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-amber-400/60 hover:text-amber-400 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-2 p-1.5 rounded text-[10px] flex items-center gap-1.5 ${
                            message.type === 'success' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <AlertTriangle className="h-3 w-3" />
                            )}
                            {message.text}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResendVerification}
                            disabled={sending}
                            className="h-6 text-[10px] px-2 border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                        >
                            {sending ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Resend Email
                                </>
                            )}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCheckVerification}
                            disabled={checking}
                            className="h-6 text-[10px] px-2 border-amber-500/30 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                        >
                            {checking ? (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    I&apos;ve Verified
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

