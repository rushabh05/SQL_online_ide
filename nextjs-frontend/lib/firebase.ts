/**
 * Firebase Configuration
 * 
 * To use this, you need to:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication and choose Email/Password and Google providers
 * 3. Copy your Firebase config from Project Settings > General > Your apps
 * 4. Create a .env.local file with your Firebase credentials
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    User,
    Auth,
    ActionCodeSettings
} from 'firebase/auth'

// App name for email templates
const APP_NAME = 'SQL Online IDE'

// Firebase configuration - will be loaded on client side
const getFirebaseConfig = () => {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAzxrqAdlCOskFKXmboiuz6wEyohd_-h5Q',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sql-online-ide.firebaseapp.com',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sql-online-ide',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sql-online-ide.firebasestorage.app'  ,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1038528845338',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1038528845338:web:b9417b253d4f8811c223a3',
    }
return firebaseConfig
}

// Lazy initialization - only initialize on client side
let app: FirebaseApp | null = null
let auth: Auth | null = null
let googleProvider: GoogleAuthProvider | null = null

const getFirebaseApp = (): FirebaseApp => {
    if (typeof window === 'undefined') {
        throw new Error('Firebase can only be initialized on the client side')
    }
    
    if (!app) {
        const config = getFirebaseConfig()
        app = getApps().length > 0 ? getApp() : initializeApp(config)
    }
    return app
}

const getFirebaseAuth = (): Auth => {
    if (!auth) {
        auth = getAuth(getFirebaseApp())
    }
    return auth
}

const getGoogleProvider = (): GoogleAuthProvider => {
    if (!googleProvider) {
        googleProvider = new GoogleAuthProvider()
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        })
    }
    return googleProvider
}

// Auth functions
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
        return { user: result.user, error: null }
    } catch (error: any) {
        return { user: null, error: getErrorMessage(error.code) }
    }
}

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
        const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
        
        // Update display name if provided
        if (displayName && result.user) {
            await updateProfile(result.user, { displayName })
        }
        
        // Send email verification with custom action code settings
        if (result.user) {
            const actionCodeSettings: ActionCodeSettings = {
                url: typeof window !== 'undefined' 
                    ? `${window.location.origin}/login?verified=true`
                    : 'http://localhost:3000/login?verified=true',
                handleCodeInApp: false, // Opens in browser, not app
            }
            await sendEmailVerification(result.user, actionCodeSettings)
        }
        
        return { user: result.user, error: null, verificationSent: true }
    } catch (error: any) {
        return { user: null, error: getErrorMessage(error.code), verificationSent: false }
    }
}

// Resend verification email
export const resendVerificationEmail = async () => {
    try {
        const auth = getFirebaseAuth()
        const user = auth.currentUser
        if (user && !user.emailVerified) {
            const actionCodeSettings: ActionCodeSettings = {
                url: typeof window !== 'undefined' 
                    ? `${window.location.origin}/login?verified=true`
                    : 'http://localhost:3000/login?verified=true',
                handleCodeInApp: false,
            }
            await sendEmailVerification(user, actionCodeSettings)
            return { error: null, sent: true }
        }
        return { error: 'No user logged in or email already verified', sent: false }
    } catch (error: any) {
        return { error: getErrorMessage(error.code), sent: false }
    }
}

// Get app name for display
export const getAppName = () => APP_NAME

// Check if email is verified
export const isEmailVerified = (): boolean => {
    const auth = getFirebaseAuth()
    return auth.currentUser?.emailVerified ?? false
}

// Reload user to get latest verification status
export const reloadUser = async () => {
    try {
        const auth = getFirebaseAuth()
        if (auth.currentUser) {
            await auth.currentUser.reload()
            return { user: auth.currentUser, error: null }
        }
        return { user: null, error: 'No user logged in' }
    } catch (error: any) {
        return { user: null, error: getErrorMessage(error.code) }
    }
}

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider())
        return { user: result.user, error: null }
    } catch (error: any) {
        return { user: null, error: getErrorMessage(error.code) }
    }
}

export const logOut = async () => {
    try {
        await signOut(getFirebaseAuth())
        return { error: null }
    } catch (error: any) {
        return { error: getErrorMessage(error.code) }
    }
}

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(getFirebaseAuth(), email)
        return { error: null }
    } catch (error: any) {
        return { error: getErrorMessage(error.code) }
    }
}

// Error message helper
const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try logging in instead.'
        case 'auth/invalid-email':
            return 'Please enter a valid email address.'
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled.'
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.'
        case 'auth/user-disabled':
            return 'This account has been disabled.'
        case 'auth/user-not-found':
            return 'No account found with this email.'
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.'
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.'
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.'
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed before completing.'
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.'
        default:
            return 'An error occurred. Please try again.'
    }
}

// Export a function to get auth (for use in auth-context)
export { getFirebaseAuth as getAuth, onAuthStateChanged }
export type { User }
