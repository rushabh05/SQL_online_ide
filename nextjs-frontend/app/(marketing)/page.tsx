import { Metadata } from 'next'
import Link from 'next/link'
import { Database, Zap, Upload, Code2, Terminal, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

// SSG - This page will be statically generated for SEO
export const metadata: Metadata = {
    title: 'SQL Workspace - Free Online SQL Playground | Practice SQL Queries',
    description: 'Free online SQL editor and playground. Write, execute, and learn SQL queries with our powerful DuckDB-powered workspace. Upload CSV files, generate sample data, and practice SQL instantly.',
    keywords: ['SQL editor', 'online SQL', 'SQL playground', 'learn SQL', 'SQL practice', 'DuckDB', 'CSV to SQL', 'free SQL tool'],
    openGraph: {
        title: 'SQL Workspace - Free Online SQL Playground',
        description: 'Write, execute, and learn SQL queries with our powerful online SQL editor. No installation required.',
        type: 'website',
        url: 'https://sqlworkspace.com',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'SQL Workspace - Online SQL Editor',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SQL Workspace - Free Online SQL Playground',
        description: 'Write, execute, and learn SQL queries online. No installation required.',
    },
    robots: {
        index: true,
        follow: true,
    },
}

// JSON-LD structured data for SEO
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SQL Workspace',
    description: 'Free online SQL editor and playground for learning and practicing SQL queries',
    url: 'https://sqlworkspace.com',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    featureList: [
        'Online SQL Editor',
        'CSV File Upload',
        'Sample Data Generation',
        'Query History',
        'DuckDB Powered',
    ],
}

const features = [
    {
        icon: Terminal,
        title: 'DuckDB Powered',
        description: 'Lightning-fast analytical queries with modern SQL syntax and advanced features.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Code2,
        title: 'Monaco Editor',
        description: 'VS Code-like editing experience with syntax highlighting and auto-completion.',
        color: 'from-purple-500 to-pink-500',
    },
    {
        icon: Upload,
        title: 'CSV Upload',
        description: 'Import your own data by uploading CSV files. Instant table creation.',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Sparkles,
        title: 'Sample Data',
        description: 'Generate realistic sample tables instantly to practice your SQL skills.',
        color: 'from-orange-500 to-yellow-500',
    },
]

const benefits = [
    'No installation required',
    'Works in any modern browser',
    'Free to use',
    'Secure session-based storage',
    'Export results to CSV',
    'Query history saved',
]

export default function LandingPage() {
    return (
        <>
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen bg-[#0a0a0f] text-white">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Database className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-xl">SQL Workspace</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link 
                                    href="/login" 
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/workspace"
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity"
                                >
                                    Try Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                    </div>

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-8">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-gray-300">Powered by DuckDB</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            Write SQL Queries
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Right in Your Browser
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                            The most powerful free online SQL playground. Upload CSV files, 
                            generate sample data, and execute queries instantly. No installation required.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/workspace"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                            >
                                Start Writing SQL
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                            {benefits.slice(0, 3).map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-4 bg-[#0d0d14]">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                                Everything You Need to Practice SQL
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                A complete SQL development environment in your browser. 
                                No setup, no installation, just pure SQL.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl bg-[#12121a] border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                                Why Choose SQL Workspace?
                            </h2>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-gradient-to-b from-[#0d0d14] to-[#0a0a0f]">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Ready to Write Some SQL?
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Jump right in - no account required. Create an account to save your work.
                        </p>
                        <Link
                            href="/workspace"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-blue-500/25"
                        >
                            Launch SQL Workspace
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-4 border-t border-white/5">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">SQL Workspace</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} SQL Workspace. Free to use.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    )
}

