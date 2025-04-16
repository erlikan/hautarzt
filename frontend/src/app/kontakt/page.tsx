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
import React, { useState } from 'react';

export default function KontaktPage() {
    // State for form inputs
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    // State for CAPTCHA token (example)
    // const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Check captchaToken validity here
        // if (!captchaToken) { 
        //     setSubmitStatus('error');
        //     setSubmitMessage('Bitte bestätigen Sie, dass Sie kein Roboter sind.');
        //     return;
        // }

        setIsSubmitting(true);
        setSubmitStatus(null);
        setSubmitMessage(null);

        try {
            // TODO: Implement fetch call to the backend Edge Function
            const response = await fetch('/api/contact-form-handler', { // Example endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // captchaToken: captchaToken 
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Fehler beim Senden der Nachricht.');
            }

            setSubmitStatus('success');
            setSubmitMessage('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.');
            setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
            // TODO: Reset CAPTCHA if possible
            // captchaRef.current?.reset(); 

        } catch (error: any) {
            setSubmitStatus('error');
            setSubmitMessage(error.message || 'Ein unerwarteter Fehler ist aufgetreten.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // REMOVED contactEmail constant

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
                            {/* TODO: Add CAPTCHA Component Here */}
                            {/* <CaptchaComponent onVerify={setCaptchaToken} ref={captchaRef} /> */}

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Wird gesendet...' : <>Nachricht senden <Send className="w-4 h-4 ml-2" /></>}
                            </Button>
                            <p className="text-xs text-muted-foreground pt-2">
                                Hinweis: Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß unserer <a href="/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</a> zu.
                            </p>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Contact Info & Text - REMOVED EMAIL */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Kontaktinformation</h2>
                    <p className="text-muted-foreground">
                        Haben Sie Fragen, Anregungen oder möchten Sie einen Fehler melden? Bitte nutzen Sie das Kontaktformular. Wir bemühen uns, Ihre Anfrage zeitnah zu bearbeiten.
                    </p>
                    {/* Removed Email display */}
                    {/* <div className="space-y-3"> ... email link ... </div> */}
                    {/* Optional: Add Address Card if needed later */}
                </div>

            </div>
        </div>
    );
} 