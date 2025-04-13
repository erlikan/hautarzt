import { Mail } from 'lucide-react';

export default function KontaktPage() {
    return (
        <div className="container py-12 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Kontakt
            </h1>
            <div className="prose prose-zinc max-w-none dark:prose-invert">
                <p className="lead">
                    Haben Sie Fragen oder Anregungen zu unserem Verzeichnis?
                </p>
                <p>
                    Aktuell erreichen Sie uns am besten per E-Mail.
                    {/* TODO: Replace with actual contact email or form */}
                </p>
                <div className="mt-6">
                    <a
                        href="mailto:info@example.com" // Replace with real email
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Mail className="h-4 w-4" />
                        E-Mail senden (info@example.com)
                    </a>
                </div>

                {/* Optional: Add address, phone number, or a contact form component later */}
            </div>
        </div>
    );
} 