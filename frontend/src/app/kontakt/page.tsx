'use client';

import { Mail, Send, MessageSquare, User, Mailbox, CheckCircle, AlertCircle } from 'lucide-react';
// Shadcn component imports
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // For form container
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import AlertTitle
// Import React hooks
import React, { useState, useCallback, useEffect } from 'react';
// Import reCAPTCHA hook and provider
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Wrap the main component logic for provider context
function KontaktForm() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);

    // --- reCAPTCHA State and Hook ---
    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!executeRecaptcha) {
            console.error("executeRecaptcha not yet available");
            setSubmitStatus('error');
            setSubmitMessage('reCAPTCHA konnte nicht geladen werden. Bitte versuchen Sie es später erneut.');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        setSubmitMessage(null);

        try {
            // Get reCAPTCHA token
            const captchaToken = await executeRecaptcha('contactForm'); // Action name

            if (!captchaToken) {
                throw new Error("reCAPTCHA-Token konnte nicht generiert werden.");
            }

            // Fetch call to the backend Edge Function
            const response = await fetch('/api/contact-form-handler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    captchaToken: captchaToken // Send token to backend
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Senden der Nachricht.');
            }

            setSubmitStatus('success');
            setSubmitMessage('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.');
            setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form

        } catch (error: any) {
            setSubmitStatus('error');
            setSubmitMessage(error.message || 'Ein unerwarteter Fehler ist aufgetreten.');
        } finally {
            setIsSubmitting(false);
        }
    }, [executeRecaptcha, formData]); // Add dependencies

    return (
        <div className="container py-12 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight text-center sm:text-4xl mb-8 md:mb-12">
                Kontaktieren Sie uns
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
                {/* Left Column: Contact Form */}
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="text-xl font-semibold mb-4">Nachricht senden</h2>

                            {/* Submission Status Messages */}
                            {submitStatus === 'success' && (
                                <Alert variant="default">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Erfolgreich!</AlertTitle>
                                    <AlertDescription>{submitMessage}</AlertDescription>
                                </Alert>
                            )}
                            {submitStatus === 'error' && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Fehler</AlertTitle>
                                    <AlertDescription>{submitMessage}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" placeholder="Ihr Name" required value={formData.name} onChange={handleInputChange} disabled={isSubmitting} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">E-Mail</Label>
                                    <Input id="email" name="email" type="email" placeholder="Ihre E-Mail" required value={formData.email} onChange={handleInputChange} disabled={isSubmitting} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="subject">Betreff (optional)</Label>
                                <Input id="subject" name="subject" placeholder="z.B. Frage zur Website, Fehlermeldung" value={formData.subject} onChange={handleInputChange} disabled={isSubmitting} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="message">Nachricht</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Ihre Nachricht an uns..."
                                    rows={5}
                                    required
                                    value={formData.message} onChange={handleInputChange} disabled={isSubmitting}
                                />
                            </div>
                            {/* reCAPTCHA notice - v3 is often invisible */}
                            <p className="text-xs text-muted-foreground">
                                Diese Website ist durch reCAPTCHA geschützt und es gelten die
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary"> Datenschutzbestimmungen</a> und
                                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary"> Nutzungsbedingungen</a> von Google.
                            </p>

                            <Button type="submit" className="w-full" disabled={isSubmitting || !executeRecaptcha}>
                                {isSubmitting ? 'Wird gesendet...' : <>Nachricht senden <Send className="w-4 h-4 ml-2" /></>}
                            </Button>
                            <p className="text-xs text-muted-foreground pt-2">
                                Hinweis: Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß unserer <a href="/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</a> zu.
                            </p>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Contact Info */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Kontaktinformation</h2>
                    <p className="text-muted-foreground">
                        Haben Sie Fragen, Anregungen oder möchten Sie einen Fehler melden? Bitte nutzen Sie das Kontaktformular. Wir bemühen uns, Ihre Anfrage zeitnah zu bearbeiten.
                    </p>
                </div>

            </div>
        </div>
    );
}

// Main export wrapping the form with the Provider
export default function KontaktPage() {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!recaptchaSiteKey) {
        // Handle missing site key - maybe show an error or disable the form
        console.error("reCAPTCHA Site Key is missing. Please check environment variables.");
        return (
            <div className="container py-12 md:py-16 text-center">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Konfigurationsfehler</AlertTitle>
                    <AlertDescription>Das Kontaktformular kann nicht geladen werden. Bitte versuchen Sie es später erneut.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
            <KontaktForm />
        </GoogleReCaptchaProvider>
    );
} 