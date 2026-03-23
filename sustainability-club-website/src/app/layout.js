import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`
  },
  description: "Student-led sustainability education, climate research, and a practical carbon footprint calculator.",
  keywords: [
    "sustainability club",
    "carbon footprint calculator",
    "student climate research",
    "school sustainability",
    "eco club"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "Student-led sustainability education, climate research, and a practical carbon footprint calculator.",
    images: [
      {
        url: "/globe.svg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Student-led sustainability education, climate research, and a practical carbon footprint calculator.",
    images: ["/globe.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

import Link from "next/link";
import { Leaf } from "lucide-react";

export default function RootLayout({ children }) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Westminster School Sustainability Club",
    alternateName: SITE_NAME,
    url: siteUrl
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/posts`,
      "query-input": "required name=query"
    }
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <Providers>
          <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-green">
                <Leaf className="w-8 h-8" />
                <span>EcoClub</span>
              </Link>
              <div className="flex gap-8 text-sm font-medium text-gray-600">
                <Link href="/" className="hover:text-primary-green transition-colors">Home</Link>
                <Link href="/calculator" className="hover:text-primary-green transition-colors">Calculator</Link>
                <Link href="/posts" className="hover:text-primary-green transition-colors">Research</Link>
                <Link href="/about" className="hover:text-primary-green transition-colors">About</Link>
              </div>
            </nav>
          </header>
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-gray-100 dark:bg-gray-900 p-8 text-center text-gray-600 dark:text-gray-400">
            <p>© 2026 Westminster School Sustainability Club. All rights reserved.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
