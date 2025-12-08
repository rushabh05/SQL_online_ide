import { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'

// SSR - This page will be server-rendered for SEO
export const metadata: Metadata = {
    title: 'Sign In | SQL Workspace - Online SQL Playground',
    description: 'Sign in to SQL Workspace to save your queries, access your data, and continue where you left off. Free online SQL editor and playground.',
    keywords: ['SQL login', 'SQL workspace sign in', 'online SQL editor login'],
    openGraph: {
        title: 'Sign In | SQL Workspace',
        description: 'Sign in to access your SQL Workspace and saved queries.',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function LoginPage() {
    return <LoginForm />
}
