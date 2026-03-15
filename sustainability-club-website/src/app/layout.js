import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sustainability Club",
  description: "Join us in making our school more sustainable.",
};

import Link from "next/link";
import { Leaf } from "lucide-react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
