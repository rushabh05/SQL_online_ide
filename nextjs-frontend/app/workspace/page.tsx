import { Metadata } from 'next'
import { WorkspaceApp } from '@/components/workspace-app'

// SSR - This page will be server-rendered with SEO metadata
export const metadata: Metadata = {
    title: 'SQL Editor | SQL Workspace - Online SQL Playground',
    description: 'Write and execute SQL queries in our powerful online SQL editor. Upload CSV files, generate sample data, and practice SQL with DuckDB. Free SQL playground.',
    keywords: ['SQL editor', 'online SQL', 'SQL playground', 'DuckDB', 'CSV to SQL', 'SQL practice', 'query editor'],
    openGraph: {
        title: 'SQL Editor | SQL Workspace',
        description: 'Write and execute SQL queries online. Upload CSV files and practice SQL instantly.',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function WorkspacePage() {
    return <WorkspaceApp />
}
