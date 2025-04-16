import { cn } from "@/lib/utils"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Corrected import path
import Link from "next/link"; // Added missing Link import
import Image from 'next/image';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); // Ensure variable is set if using cn

export const metadata: Metadata = {
    // Default title/description - will be overridden by pages
    title: "Hautarzt Vergleich",
    description: "Vergleichen Sie Hautärzte in Ihrer Nähe basierend auf echten Patienteneinblicken.",
    metadataBase: new URL('https://www.hautarzt-vergleich.de'), // Replace with your actual production domain!
    // Favicon Configuration - ADDED
    icons: {
        icon: '/favicon.ico', // Standard favicon
        // Optional: Add other icon sizes/types if you have them
        // shortcut: '/favicon-16x16.png',
        // apple: '/apple-touch-icon.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning>
            <body className={cn(
                "min-h-screen bg-background font-sans antialiased",
                inter.variable // Use the variable with cn
            )}>
                <div className="flex flex-col min-h-screen">
                    {/* --- Original Header Structure --- */}
                    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="container flex h-14 items-center">
                            <Link href="/" className="mr-6 flex items-center space-x-2">
                                <Image
                                    src="/logo-64.png"
                                    alt="Hautarzt Vergleich Logo"
                                    width={48}
                                    height={48}
                                    priority
                                />
                                <span className="hidden sm:inline-block font-bold">Hautarzt Vergleich</span>
                            </Link>
                            <div className="flex flex-1 items-center justify-end space-x-4">
                                <nav className="flex items-center space-x-6 text-sm font-medium">
                                    <Link href="/nearby-search" className="text-muted-foreground transition-colors hover:text-primary">
                                        In der Nähe
                                    </Link>
                                    {/* ADDED Leistungen Link */}
                                    <Link href="/leistungen" className="text-muted-foreground transition-colors hover:text-primary">
                                        Leistungen
                                    </Link>
                                    <Link href="/kontakt" className="text-muted-foreground transition-colors hover:text-primary">
                                        Kontakt
                                    </Link>
                                </nav>
                                {/* Add other buttons/user menu here if needed */}
                            </div>
                        </div>
                    </header>
                    <main className="flex-grow">
                        {children}
                    </main>
                    {/* --- Footer Structure Refined --- */}
                    <footer className="border-t mt-auto bg-gray-50">
                        <div className="container px-6 py-8 md:py-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                                {/* Column 1: Logo & Name (Optional) / Navigation */}
                                <div>
                                    <Link href="/" className="flex items-center space-x-2 mb-3">
                                        <Image
                                            src="/logo-64.png"
                                            alt="Hautarzt Vergleich Logo"
                                            width={32}
                                            height={32}
                                        />
                                        <span className="font-semibold text-lg">Hautarzt Vergleich</span>
                                    </Link>
                                    <p className="text-sm text-muted-foreground">
                                        Finden Sie den passenden Hautarzt in Ihrer Nähe.
                                    </p>
                                </div>

                                {/* Column 2: Navigation Links */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</h3>
                                    <nav className="flex flex-col space-y-2">
                                        <Link href="/" className="text-sm text-muted-foreground hover:text-primary hover:underline">Startseite</Link>
                                        <Link href="/leistungen" className="text-sm text-muted-foreground hover:text-primary hover:underline">Leistungen</Link>
                                        <Link href="/kontakt" className="text-sm text-muted-foreground hover:text-primary hover:underline">Kontakt</Link>
                                        {/* Add more links if needed */}
                                    </nav>
                                </div>

                                {/* Column 3: Legal Links */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Rechtliches</h3>
                                    <nav className="flex flex-col space-y-2">
                                        <Link href="/impressum" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                            Impressum
                                        </Link>
                                        <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                            Datenschutz
                                        </Link>
                                        {/* Add Sitemap Link */}
                                        <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                            Sitemap
                                        </a>
                                    </nav>
                                </div>
                            </div>

                            {/* Bottom Row: Copyright */}
                            <div className="border-t pt-6 text-center">
                                <p className="text-xs text-muted-foreground">
                                    &copy; {new Date().getFullYear()} Hautarzt Vergleich. Alle Rechte vorbehalten.
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}