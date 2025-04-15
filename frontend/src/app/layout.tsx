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
                    {/* --- Original Footer Structure --- */}
                    <footer className="border-t py-8 md:py-10 mt-auto bg-muted/50">
                        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                            <p className="text-sm text-muted-foreground text-center md:text-left">
                                {/* TODO: Maybe add Logo here too? */}
                                &copy; {new Date().getFullYear()} Hautarzt Vergleich. Alle Rechte vorbehalten.
                            </p>
                            <nav className="flex gap-4 sm:gap-6">
                                <Link href="/impressum" className="text-sm text-muted-foreground hover:text-primary">
                                    Impressum
                                </Link>
                                <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-primary">
                                    Datenschutz
                                </Link>
                            </nav>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}