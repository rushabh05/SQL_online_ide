'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { 
    getAuth,
    onAuthStateChanged, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    logOut, 
    resetPassword,
    resendVerificationEmail,
    reloadUser,
    User 
} from './firebase'
import { sessionStorage as appSessionStorage, clearGuestStorage } from './storage'

interface AuthContextType {
    user: User | null
    loading: boolean
    isEmailVerified: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; verificationSent?: boolean }>
    signInGoogle: () => Promise<{ error: string | null }>
    signOut: () => Promise<{ error: string | null }>
    forgotPassword: (email: string) => Promise<{ error: string | null }>
    resendVerification: () => Promise<{ error: string | null; sent?: boolean }>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEmailVerified, setIsEmailVerified] = useState(false)
    const previousUserIdRef = useRef<string | null>(null)

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            setLoading(false)
            return
        }

        try {
            const auth = getAuth()
            const unsubscribe = onAuthStateChanged(auth, (newUser) => {
                const newUserId = newUser?.uid || null
                const previousUserId = previousUserIdRef.current
                
                // Detect user change (login, logout, or user switch)
                if (previousUserId !== newUserId) {
                    console.log(`User changed: ${previousUserId} -> ${newUserId}`)
                    
                    // If a new user logged in (different from previous), clear guest session
                    // This ensures the new user doesn't see the previous user's or guest's data
                    if (newUserId && previousUserId !== newUserId) {
                        console.log('New user logged in, clearing guest session data')
                        clearGuestStorage()
                    }
                    
                    previousUserIdRef.current = newUserId
                }
                
                setUser(newUser)
                // Google sign-in users are always verified, email users need to verify
                setIsEmailVerified(newUser?.emailVerified ?? false)
                setLoading(false)
            })

            return () => unsubscribe()
        } catch (error) {
            console.error('Firebase initialization error:', error)
            setLoading(false)
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        const result = await signInWithEmail(email, password)
        if (result.user) {
            setIsEmailVerified(result.user.emailVerified)
        }
        return { error: result.error }
    }

    const signUp = async (email: string, password: string, displayName?: string) => {
        const result = await signUpWithEmail(email, password, displayName)
        if (result.user) {
            setIsEmailVerified(result.user.emailVerified)
        }
        return { error: result.error, verificationSent: result.verificationSent }
    }

    const signInGoogle = async () => {
        const result = await signInWithGoogle()
        if (result.user) {
            // Google users are always verified
            setIsEmailVerified(true)
        }
        return { error: result.error }
    }

    const signOutUser = async () => {
        const result = await logOut()
        setIsEmailVerified(false)
        return { error: result.error }
    }

    const forgotPassword = async (email: string) => {
        const result = await resetPassword(email)
        return { error: result.error }
    }

    const resendVerification = async () => {
        const result = await resendVerificationEmail()
        return { error: result.error, sent: result.sent }
    }

    const refreshUser = useCallback(async () => {
        const result = await reloadUser()
        if (result.user) {
            setUser(result.user)
            setIsEmailVerified(result.user.emailVerified)
        }
    }, [])

    const value: AuthContextType = {
        user,
        loading,
        isEmailVerified,
        signIn,
        signUp,
        signInGoogle,
        signOut: signOutUser,
        forgotPassword,
        resendVerification,
        refreshUser,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
