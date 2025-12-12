import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sqlworkspace.vercel.app'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/workspace'], // Don't index the actual app (dynamic content)
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}

