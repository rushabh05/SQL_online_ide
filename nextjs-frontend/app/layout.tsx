import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base URL for the site - update this for production
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sqlworkspace.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SQL Workspace - Free Online SQL Editor & Playground",
    template: "%s | SQL Workspace",
  },
  description: "Free online SQL editor and playground. Write, execute, and learn SQL queries instantly with DuckDB. Upload CSV files, generate sample data, and practice SQL - no installation required.",
  keywords: [
    "SQL editor online",
    "free SQL playground",
    "learn SQL",
    "practice SQL",
    "SQL tutorial",
    "DuckDB online",
    "CSV to SQL",
    "run SQL online",
    "SQL query builder",
    "online database",
    "SQL sandbox",
    "SQL practice online free",
  ],
  authors: [{ name: "SQL Workspace" }],
  creator: "SQL Workspace",
  publisher: "SQL Workspace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SQL Workspace",
    title: "SQL Workspace - Free Online SQL Editor & Playground",
    description: "Write, execute, and learn SQL queries instantly. No installation required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SQL Workspace - Online SQL Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Workspace - Free Online SQL Editor",
    description: "Write and run SQL queries online. Free, no signup required.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-google-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}
