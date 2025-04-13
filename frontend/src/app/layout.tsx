import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    // Default title - updated
    title: "Hautarzt Vergleich - Finden Sie Ihren Hautarzt",
    // Default description - will be overridden by pages
    description: "Vergleichen Sie Hautärzte in Ihrer Nähe basierend auf echten Patienteneinblicken.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Using className directly without string interpolation helps avoid hydration issues
    return (
        <html lang="de">
            <body className={`${inter.className} flex flex-col min-h-screen bg-background`}>
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-14 items-center">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <span className="font-bold sm:inline-block">
                                {/* Updated Site Name */}
                                Hautarzt Vergleich
                            </span>
                        </Link>
                        <div className="flex flex-1 items-center justify-end space-x-4">
                            <nav className="flex items-center space-x-6 text-sm font-medium">
                                <Link href="/nearby-search" className="text-muted-foreground transition-colors hover:text-primary">
                                    In der Nähe
                                </Link>
                                <Link href="/kontakt" className="text-muted-foreground transition-colors hover:text-primary">
                                    Kontakt
                                </Link>
                            </nav>
                            {/* Add other buttons/user menu here if needed */}
                        </div>
                    </div>
                </header>
                <main className="flex-grow flex-1 container px-4 py-6 md:py-8">
                    {children}
                </main>
                <footer className="border-t py-8 md:py-10 mt-auto bg-muted/50">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                        <p className="text-sm text-muted-foreground text-center md:text-left">
                            {/* Updated Copyright Name */}
                            &copy; {new Date().getFullYear()} Hautarzt Vergleich. Alle Rechte vorbehalten.
                        </p>
                        <nav className="flex gap-4 sm:gap-6">
                            {/* TODO: Add Sitemap Link when available */}
                            {/* <Link href="/sitemap.xml" className="text-sm text-muted-foreground hover:text-primary">Sitemap</Link> */}
                            <Link href="/impressum" className="text-sm text-muted-foreground hover:text-primary">
                                Impressum
                            </Link>
                            <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-primary">
                                Datenschutz
                            </Link>
                        </nav>
                    </div>
                </footer>
            </body>
        </html>
    );
} 