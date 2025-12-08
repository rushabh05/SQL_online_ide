'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
    Database, 
    Mail, 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    Loader2,
    ArrowRight,
    Sparkles,
    Terminal,
    Code2,
    CheckCircle2,
    RefreshCw
} from 'lucide-react'

export function LoginForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmailSent, setResetEmailSent] = useState(false)
    const [verificationPending, setVerificationPending] = useState(false)
    const [resendingVerification, setResendingVerification] = useState(false)

    const { signIn, signUp, signInGoogle, forgotPassword, resendVerification, isEmailVerified, refreshUser } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            let result
            if (isLogin) {
                result = await signIn(email, password)
                if (!result.error) {
                    // Check if email is verified for login
                    await refreshUser()
                    router.push('/workspace')
                }
            } else {
                result = await signUp(email, password, displayName)
                if (!result.error && result.verificationSent) {
                    // Show verification pending state
                    setVerificationPending(true)
                }
            }

            if (result.error) {
                setError(result.error)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        setResendingVerification(true)
        setError(null)
        
        try {
            const result = await resendVerification()
            if (result.error) {
                setError(result.error)
            }
        } catch (err) {
            setError('Failed to resend verification email')
        } finally {
            setResendingVerification(false)
        }
    }

    const handleCheckVerification = async () => {
        setLoading(true)
        try {
            await refreshUser()
            if (isEmailVerified) {
                router.push('/workspace')
            } else {
                setError('Email not verified yet. Please check your inbox.')
            }
        } catch (err) {
            setError('Failed to check verification status')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setError(null)
        setLoading(true)

        try {
            const result = await signInGoogle()
            if (result.error) {
                setError(result.error)
            } else {
                router.push('/workspace')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await forgotPassword(email)
            if (result.error) {
                setError(result.error)
            } else {
                setResetEmailSent(true)
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Email Verification Pending View
    if (verificationPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
                </div>

                <Card className="w-full max-w-md mx-4 p-8 bg-[#12121a]/90 backdrop-blur-xl border-[#1e1e2e] shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6">
                            <Mail className="h-10 w-10 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
                        <p className="text-gray-400">
                            We&apos;ve sent a verification link to
                        </p>
                        <p className="text-blue-400 font-medium mt-1">{email}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-[#1a1a24] border border-[#2a2a3e]">
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                Next Steps
                            </h3>
                            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                                <li>Open the email we just sent</li>
                                <li>Click the verification link</li>
                                <li>Come back here and click &quot;I&apos;ve Verified&quot;</li>
                            </ol>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={handleCheckVerification}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-green-500/25"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    I&apos;ve Verified My Email
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-center gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendingVerification}
                                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                            >
                                {resendingVerification ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        Resend Email
                                    </>
                                )}
                            </button>
                            <span className="text-gray-600">|</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationPending(false)
                                    setIsLogin(true)
                                }}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    // Forgot Password View
    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
                </div>

                <Card className="w-full max-w-md mx-4 p-8 bg-[#12121a]/90 backdrop-blur-xl border-[#1e1e2e] shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-gray-400">We&apos;ll send you a reset link</p>
                    </div>

                    {resetEmailSent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-green-400" />
                            </div>
                            <p className="text-green-400">Check your email for a password reset link!</p>
                            <Button
                                onClick={() => {
                                    setShowForgotPassword(false)
                                    setResetEmailSent(false)
                                }}
                                variant="outline"
                                className="w-full border-[#2a2a3e] hover:bg-[#1e1e2e]"
                            >
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-[#1a1a24] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>Send Reset Link</>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="w-full text-center text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex bg-[#0a0a0f] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
                <div className="max-w-md text-center">
                    <Link href="/" className="inline-block">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-8 shadow-2xl shadow-blue-500/30">
                            <Database className="h-10 w-10 text-white" />
                        </div>
                    </Link>
                    
                    <h1 className="text-4xl font-bold text-white mb-4">
                        SQL Workspace
                    </h1>
                    <p className="text-xl text-gray-400 mb-12">
                        Your powerful online SQL playground
                    </p>

                    {/* Features */}
                    <div className="space-y-6 text-left">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-[#12121a]/50 backdrop-blur border border-[#1e1e2e]">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Terminal className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">DuckDB Powered</h3>
                                <p className="text-sm text-gray-400">Lightning-fast analytical queries with modern SQL syntax</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-[#12121a]/50 backdrop-blur border border-[#1e1e2e]">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Code2 className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Monaco Editor</h3>
                                <p className="text-sm text-gray-400">VS Code-like editing experience with syntax highlighting</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-[#12121a]/50 backdrop-blur border border-[#1e1e2e]">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Sample Data</h3>
                                <p className="text-sm text-gray-400">Generate realistic sample tables instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
                <Card className="w-full max-w-md p-8 bg-[#12121a]/90 backdrop-blur-xl border-[#1e1e2e] shadow-2xl">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-block">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                                <Database className="h-8 w-8 text-white" />
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-white">SQL Workspace</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-8 p-1 bg-[#1a1a24] rounded-lg">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                                isLogin 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                                !isLogin 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full pl-10 pr-4 py-3 bg-[#1a1a24] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-[#1a1a24] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 bg-[#1a1a24] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 group"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2a2a3e]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#12121a] text-gray-500">or continue with</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <Button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        variant="outline"
                        className="w-full py-3 border-[#2a2a3e] hover:bg-[#1e1e2e] text-white transition-all"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Terms */}
                    <p className="mt-8 text-center text-xs text-gray-500">
                        By continuing, you agree to our{' '}
                        <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
                    </p>
                </Card>
            </div>
        </div>
    )
}

