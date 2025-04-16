import type { Metadata } from 'next';
import Link from 'next/link'; // Import Link for internal links

export const metadata: Metadata = {
    title: "Datenschutzerklärung | Hautarzt Vergleich",
    // Add noindex if you prefer this page not to be indexed by search engines
    // robots: { index: false, follow: true }, 
};

export default function DatenschutzPage() {
    // !! WICHTIG: Alle [Platzhalter] MÜSSEN durch Ihre korrekten Daten ersetzt werden! !!
    // !! Dies ist KEINE Rechtsberatung. Konsultieren Sie einen Anwalt!         !!
    const siteOperatorName = "[Ihr Name / Firmenname]"; // Same as Impressum
    const siteOperatorStreet = "[Ihre Straße und Hausnummer]"; // Same as Impressum
    const siteOperatorCity = "[Ihre PLZ und Stadt]"; // Same as Impressum
    const siteContactEmail = "[Ihre Kontakt-E-Mail-Adresse]"; // Same as Impressum
    const lastUpdatedDate = "[Datum der letzten Aktualisierung, z.B. TT.MM.JJJJ]";
    const hostingProviderInfo = "[Name und Adresse Ihres Hosting-Providers, z.B. Vercel Inc., Netlify Inc.]"; // Replace!
    const analyticsToolInfo = "[Falls Sie ein Analysetool wie Plausible, Fathom, Matomo oder Google Analytics nutzen, hier Details einfügen, sonst löschen]"; // Replace or Delete!
    const cookieConsentToolInfo = "[Falls Sie einen Cookie-Consent-Manager nutzen, hier Details einfügen, sonst löschen]"; // Replace or Delete!

    return (
        <div className="container py-12 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 md:mb-8">
                Datenschutzerklärung
            </h1>

            <div className="prose prose-zinc max-w-none dark:prose-invert">
                <p className="text-sm text-red-600 font-medium">Hinweis: Dies ist ein automatisch generierter Entwurf und ersetzt keine Rechtsberatung. Bitte lassen Sie diese Datenschutzerklärung anwaltlich prüfen und passen Sie die [Platzhalter] sowie die Inhalte an Ihre spezifischen Datenverarbeitungsprozesse an.</p>

                <p>Stand: {lastUpdatedDate}</p>

                <h2>1. Verantwortlicher</h2>
                <p>
                    Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze sowie sonstiger datenschutzrechtlicher Bestimmungen ist:
                </p>
                <p>
                    {siteOperatorName}<br />
                    {siteOperatorStreet}<br />
                    {siteOperatorCity}<br />
                    E-Mail: {siteContactEmail}
                </p>
                {/* Add Datenschutzbeauftragter if applicable - Placeholder remains commented */}

                <h2>2. Allgemeines zur Datenverarbeitung</h2>
                <p>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie ausführlich über den Umgang mit Ihren Daten bei der Nutzung unserer Website "Hautarzt Vergleich".</p>
                <p><strong>Umfang der Verarbeitung personenbezogener Daten</strong></p>
                <p>Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers. Eine Ausnahme gilt in solchen Fällen, in denen eine vorherige Einholung einer Einwilligung aus tatsächlichen Gründen nicht möglich ist und die Verarbeitung der Daten durch gesetzliche Vorschriften gestattet ist.</p>
                <p><strong>Rechtsgrundlage für die Verarbeitung personenbezogener Daten</strong></p>
                <p>Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der betroffenen Person einholen, dient Art. 6 Abs. 1 lit. a EU-Datenschutzgrundverordnung (DSGVO) als Rechtsgrundlage. Bei der Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrages, dessen Vertragspartei die betroffene Person ist, erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage. Dies gilt auch für Verarbeitungsvorgänge, die zur Durchführung vorvertraglicher Maßnahmen erforderlich sind. Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, der unser Unternehmen unterliegt, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage. Für den Fall, dass lebenswichtige Interessen der betroffenen Person oder einer anderen natürlichen Person eine Verarbeitung personenbezogener Daten erforderlich machen, dient Art. 6 Abs. 1 lit. d DSGVO als Rechtsgrundlage. Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen das erstgenannte Interesse nicht, so dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage für die Verarbeitung.</p>
                <p><strong>Datenlöschung und Speicherdauer</strong></p>
                <p>Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften, denen der Verantwortliche unterliegt, vorgesehen wurde. Eine Sperrung oder Löschung der Daten erfolgt auch dann, wenn eine durch die genannten Normen vorgeschriebene Speicherfrist abläuft, es sei denn, dass eine Erforderlichkeit zur weiteren Speicherung der Daten für einen Vertragsabschluss oder eine Vertragserfüllung besteht.</p>

                <h2>3. Bereitstellung der Website und Erstellung von Logfiles</h2>
                <p>Bei jedem Aufruf unserer Internetseite erfasst unser System automatisiert Daten und Informationen vom Computersystem des aufrufenden Rechners. Folgende Daten werden hierbei erhoben:</p>
                <ul>
                    <li>Informationen über den Browsertyp und die verwendete Version</li>
                    <li>Das Betriebssystem des Nutzers</li>
                    <li>Den Internet-Service-Provider des Nutzers</li>
                    <li>Die IP-Adresse des Nutzers (anonymisiert, falls durch Hoster konfiguriert)</li>
                    <li>Datum und Uhrzeit des Zugriffs</li>
                    <li>Websites, von denen das System des Nutzers auf unsere Internetseite gelangt (Referrer)</li>
                    <li>Websites, die vom System des Nutzers über unsere Website aufgerufen werden</li>
                </ul>
                <p>Die Speicherung in Logfiles erfolgt, um die Funktionsfähigkeit der Website sicherzustellen. Zudem dienen uns die Daten zur Optimierung der Website und zur Sicherstellung der Sicherheit unserer informationstechnischen Systeme. Eine Auswertung der Daten zu Marketingzwecken findet in diesem Zusammenhang nicht statt.</p>
                <p>Rechtsgrundlage für die vorübergehende Speicherung der Daten und der Logfiles ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technischen Bereitstellung und Sicherheit der Website).</p>
                <p>Unser Hosting-Provider ist: {hostingProviderInfo}. Wir haben mit unserem Hosting-Provider einen Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO abgeschlossen. [Link zur Datenschutzerklärung des Hosters einfügen, falls verfügbar]</p>

                <h2>4. Verwendung von Cookies und Consent Management</h2>
                <p>Unsere Webseite verwendet Cookies. Bei Cookies handelt es sich um Textdateien, die im Internetbrowser bzw. vom Internetbrowser auf dem Computersystem des Nutzers gespeichert werden. Ruft ein Nutzer eine Website auf, so kann ein Cookie auf dem Betriebssystem des Nutzers gespeichert werden. Dieses Cookie enthält eine charakteristische Zeichenfolge, die eine eindeutige Identifizierung des Browsers beim erneuten Aufrufen der Website ermöglicht.</p>
                <p>Wir setzen technisch notwendige Cookies ein, um unsere Website nutzerfreundlicher zu gestalten. Einige Elemente unserer Internetseite erfordern es, dass der aufrufende Browser auch nach einem Seitenwechsel identifiziert werden kann. Dies ist insbesondere für die Authentifizierungsfunktionen von Supabase notwendig.</p>
                <p>[Platzhalter: Falls Sie weitere Cookies für Analyse, Marketing oder durch Drittanbieter (z.B. eingebettete Inhalte) setzen, müssen diese hier detailliert beschrieben werden, inklusive Zweck, Anbieter, Speicherdauer und Rechtsgrundlage (Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 TTDSG). Erwähnen Sie hier auch Ihr Cookie Consent Tool: {cookieConsentToolInfo}]</p>
                <p>Die Rechtsgrundlage für die Verarbeitung personenbezogener Daten unter Verwendung technisch notwendiger Cookies ist Art. 6 Abs. 1 lit. f DSGVO sowie § 25 Abs. 2 Nr. 2 TTDSG. Für alle anderen Cookies ist die Rechtsgrundlage Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TTDSG.</p>
                <p>Sie können Ihre Einwilligung jederzeit über die Einstellungen in unserem Cookie-Consent-Tool widerrufen oder anpassen. Sie können Cookies zudem über Ihre Browsereinstellungen verwalten und löschen.</p>

                <h2>5. Kontaktaufnahme (Kontaktformular)</h2>
                <p>Auf unserer Internetseite ist ein Kontaktformular vorhanden, welches für die elektronische Kontaktaufnahme genutzt werden kann. Nimmt ein Nutzer diese Möglichkeit wahr, so werden die in der Eingabemaske eingegeben Daten (Name, E-Mail-Adresse, Betreff (optional), Nachricht) an uns übermittelt und gespeichert.</p>
                <p>Zum Schutz vor Spam nutzen wir einen CAPTCHA-Dienst. Aktuell ist dies [Platzhalter: z.B. Cloudflare Turnstile]. Hierbei können Daten an den Anbieter übertragen werden. Rechtsgrundlage ist unser berechtigtes Interesse am Schutz vor missbräuchlicher Nutzung unseres Formulars (Art. 6 Abs. 1 lit. f DSGVO). [Link zur Datenschutzerklärung des CAPTCHA-Anbieters einfügen]</p>
                <p>Für die Verarbeitung der Daten wird im Rahmen des Absendevorgangs Ihre Einwilligung eingeholt und auf diese Datenschutzerklärung verwiesen. Die Daten werden ausschließlich für die Verarbeitung der Konversation verwendet und anschließend zur Beantwortung Ihrer Anfrage an uns per E-Mail weitergeleitet. Die E-Mails werden mittels des Dienstleisters [Platzhalter: z.B. Resend Inc.] versendet, mit dem wir einen Vertrag zur Auftragsverarbeitung abgeschlossen haben. [Link zur Datenschutzerklärung des E-Mail-Dienstleisters einfügen]</p>
                <p>Rechtsgrundlage für die Verarbeitung der Daten, die im Zuge einer Übersendung einer E-Mail übermittelt werden oder über das Kontaktformular nach Einwilligung, ist Art. 6 Abs. 1 lit. a DSGVO. Zielt der E-Mail-Kontakt auf den Abschluss eines Vertrages ab, so ist zusätzliche Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. b DSGVO.</p>
                <p>Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

                <h2>6. Datenverarbeitung durch externe Dienstleister</h2>
                <p>Wir setzen zur Bereitstellung unserer Dienste verschiedene externe Dienstleister ein, mit denen wir Verträge zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO abgeschlossen haben, sofern diese personenbezogene Daten in unserem Auftrag verarbeiten.</p>
                <p><strong>a) Supabase (Backend & Datenbank)</strong></p>
                <p>Unser Backend, inklusive der Datenbank, wird über Supabase Inc., 970 Ravendale Dr, Mountain View, CA 94043, USA, betrieben. Supabase verarbeitet Daten in unserem Auftrag zur Speicherung von Praxisdaten, Analysedaten, Nutzerkonten (falls implementiert) und zur Ausführung von Serverless Functions. Die Daten können hierbei auf Servern in der EU oder den USA gespeichert werden. Supabase verpflichtet sich zur Einhaltung der DSGVO durch Standardvertragsklauseln. Weitere Informationen finden Sie in der Datenschutzerklärung von Supabase: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a></p>
                <p><strong>b) Google Generative AI (Gemini API)</strong></p>
                <p>Zur Analyse der Patientenbewertungen und zur Erstellung von Zusammenfassungen und Einblicken nutzen wir die Google Generative AI (Gemini API) von Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Hierzu werden anonymisierte oder pseudonymisierte Praxis- und Bewertungsdaten an Google übertragen. Wir sind bestrebt, keine direkt identifizierenden Personeninformationen (wie Patientennamen aus Rezensionen) an die API zu senden. Die Verarbeitung erfolgt zur Erfüllung unseres Angebots (Art. 6 Abs. 1 lit. b DSGVO) und auf Basis unseres berechtigten Interesses an der Verbesserung unseres Dienstes (Art. 6 Abs. 1 lit. f DSGVO). Daten können in die USA übertragen werden; Google sichert die Einhaltung europäischer Datenschutzstandards durch Standardvertragsklauseln zu. Weitere Informationen: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></p>
                <p><strong>c) Apify</strong></p>
                <p>Zur Sammlung von öffentlichen Google Maps Rezensionen nutzen wir Dienste der Apify Technologies s.r.o., Vodičkova 704/36, 110 00 Praha 1, Tschechische Republik. Hierbei werden öffentliche Praxis-URLs zur Initiierung der Sammlung an Apify übergeben. Apify verarbeitet diese Daten in unserem Auftrag. Rechtsgrundlage ist unser berechtigtes Interesse an der Bereitstellung aktueller Bewertungsdaten (Art. 6 Abs. 1 lit. f DSGVO). Weitere Informationen: <a href="https://apify.com/privacy-policy" target="_blank" rel="noopener noreferrer">https://apify.com/privacy-policy</a></p>
                <p><strong>d) [Platzhalter: CAPTCHA-Anbieter, z.B. Cloudflare]</strong></p>
                <p>[Platzhalter: Fügen Sie hier Details zur Datenverarbeitung durch Ihren CAPTCHA-Anbieter ein.]</p>
                <p><strong>e) [Platzhalter: E-Mail-Versanddienstleister, z.B. Resend]</strong></p>
                <p>[Platzhalter: Fügen Sie hier Details zur Datenverarbeitung durch Ihren E-Mail-Dienstleister ein.]</p>
                <p><strong>f) [Platzhalter: Analysetool-Anbieter, falls verwendet]</strong></p>
                <p>[Platzhalter: Fügen Sie hier Details zur Datenverarbeitung durch Ihren Analysetool-Anbieter ein.]</p>

                <h2>7. Ihre Rechte als betroffene Person</h2>
                <p>Werden personenbezogene Daten von Ihnen verarbeitet, sind Sie Betroffener i.S.d. DSGVO und es stehen Ihnen folgende Rechte gegenüber dem Verantwortlichen zu:</p>
                <ul>
                    <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten verlangen.</li>
                    <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten verlangen.</li>
                    <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten verlangen, soweit nicht die Verarbeitung zur Ausübung des Rechts auf freie Meinungsäußerung und Information, zur Erfüllung einer rechtlichen Verpflichtung, aus Gründen des öffentlichen Interesses oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist.</li>
                    <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten verlangen, soweit die Richtigkeit der Daten von Ihnen bestritten wird, die Verarbeitung unrechtmäßig ist, Sie aber deren Löschung ablehnen und wir die Daten nicht mehr benötigen, Sie jedoch diese zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen oder Sie gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung eingelegt haben.</li>
                    <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können verlangen, Ihre personenbezogenen Daten, die Sie uns bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten oder die Übermittlung an einen anderen Verantwortlichen zu verlangen.</li>
                    <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sofern Ihre personenbezogenen Daten auf Grundlage von berechtigten Interessen gemäß Art. 6 Abs. 1 S. 1 lit. f DSGVO verarbeitet werden, haben Sie das Recht, gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten einzulegen, soweit dafür Gründe vorliegen, die sich aus Ihrer besonderen Situation ergeben.</li>
                    <li><strong>Recht auf Widerruf der datenschutzrechtlichen Einwilligungserklärung (Art. 7 Abs. 3 DSGVO):</strong> Sie haben das Recht, Ihre datenschutzrechtliche Einwilligungserklärung jederzeit zu widerrufen. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.</li>
                    <li><strong>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO):</strong> Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren. In der Regel können Sie sich hierfür an die Aufsichtsbehörde Ihres üblichen Aufenthaltsortes oder Arbeitsplatzes oder unseres Unternehmenssitzes wenden.</li>
                </ul>
                <p>Zur Geltendmachung Ihrer Rechte wenden Sie sich bitte an die oben genannte Kontaktadresse.</p>

                <h2>8. Änderung dieser Datenschutzerklärung</h2>
                <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, z.B. bei der Einführung neuer Services. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.</p>

            </div>
        </div>
    );
} 