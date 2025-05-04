import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Define expected request body structure
interface RequestBody {
    name: string;
    email: string;
    subject?: string;
    message: string;
    captchaToken: string; // Renamed from token for clarity
}

// reCAPTCHA verification endpoint
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function POST(request: NextRequest) {
    let requestBody: RequestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
    }

    const { name, email, subject, message, captchaToken } = requestBody;

    // --- Basic Input Validation ---
    if (!name || !email || !message || !captchaToken) {
        return NextResponse.json({ error: 'Fehlende erforderliche Felder.' }, { status: 400 });
    }

    // --- reCAPTCHA Verification ---
    try {
        console.log('[API Contact] Verifying reCAPTCHA token...');
        const recaptchaResponse = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        });

        const recaptchaData = await recaptchaResponse.json();
        console.log('[API Contact] reCAPTCHA verification response:', recaptchaData);

        // Check for success and score (v3)
        if (!recaptchaData.success || recaptchaData.score < 0.5) { // Adjust score threshold if needed
            console.warn('[API Contact] reCAPTCHA verification failed or score too low.');
            return NextResponse.json({ error: 'reCAPTCHA-Verifizierung fehlgeschlagen.' }, { status: 403 });
        }
        console.log('[API Contact] reCAPTCHA verified successfully.');

    } catch (error) {
        console.error('[API Contact] Error during reCAPTCHA verification:', error);
        return NextResponse.json({ error: 'Fehler bei der reCAPTCHA-Verifizierung.' }, { status: 500 });
    }

    // --- Email Sending (using Resend) ---
    const receiverEmail = process.env.CONTACT_FORM_RECEIVER_EMAIL;
    if (!receiverEmail) {
        console.error('[API Contact] CONTACT_FORM_RECEIVER_EMAIL environment variable not set.');
        return NextResponse.json({ error: 'Serverseitiger Konfigurationsfehler.' }, { status: 500 });
    }

    try {
        console.log(`[API Contact] Sending email to ${receiverEmail}...`);
        const { data, error } = await resend.emails.send({
            from: 'Kontaktformular <kontakt@hautarzt-vergleich.de>', // Use a verified domain in Resend
            to: [receiverEmail],
            reply_to: email, // Set reply-to for easy response
            subject: `Neue Kontaktanfrage: ${subject || 'Kein Betreff'}`,
            html: `
                <h1>Neue Kontaktanfrage von Hautarzt-Vergleich.de</h1>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>E-Mail:</strong> ${email}</p>
                ${subject ? `<p><strong>Betreff:</strong> ${subject}</p>` : ''}
                <hr>
                <p><strong>Nachricht:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            `,
            // Alternatively use `text:` for plain text emails
            // text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`
        });

        if (error) {
            console.error('[API Contact] Resend error:', error);
            throw new Error('Fehler beim Senden der E-Mail.');
        }

        console.log('[API Contact] Email sent successfully:', data);
        return NextResponse.json({ message: 'Nachricht erfolgreich gesendet' }, { status: 200 });

    } catch (error) {
        console.error('[API Contact] Error sending email:', error);
        // Ensure error has a message property
        const errorMessage = (error instanceof Error) ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 