import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Impressum | Hautarzt Vergleich",
    robots: { index: false, follow: true }, // Suggest no-indexing for Impressum
};

export default function ImpressumPage() {
    // !! WICHTIG: Alle [Platzhalter] MÜSSEN durch Ihre korrekten Daten ersetzt werden! !!
    // !! Dies ist KEINE Rechtsberatung. Konsultieren Sie einen Anwalt!         !!
    const siteOperatorName = "Cvelop Web & Internet Technologies";
    const siteOperatorStreet = "Ammerswilerstrasse 35";
    const siteOperatorCity = "5600 Lenzburg / Schweiz";
    const siteRepresentative = "Cagatay Ulukan"; // z.B. Sie selbst, wenn Einzelunternehmer
    const siteContactEmail = "info@hautarzt-vergleich.de"; // Dieselbe wie im Datenschutz
    const siteContactPhone = "";
    const responsiblePerson = "siehe Vertretung"; // Oft identisch mit Betreiber/Vertreter
    const responsiblePersonAddress = ""; // Oft identisch mit Betreiber

    return (
        <div className="container py-12 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 md:mb-8">
                Impressum
            </h1>

            <div className="prose prose-zinc max-w-none dark:prose-invert">

                <h2>Angaben gemäß § 5 TMG</h2>
                <p>
                    {siteOperatorName}<br />
                    {siteOperatorStreet}<br />
                    {siteOperatorCity}<br />
                </p>

                <h2>Vertreten durch:</h2>
                <p>
                    {siteRepresentative}
                </p>

                <h2>Kontakt:</h2>
                <p>
                    {siteContactPhone && <>Telefon: {siteContactPhone}<br /></>}
                    E-Mail: {siteContactEmail}
                </p>

                {/* Add Umsatzsteuer-ID if applicable - Placeholder remains commented */}

                {/* Add Registereintrag if applicable - Placeholder remains commented */}

                {/* Add Berufsbezeichnung etc. if applicable - Placeholder remains commented */}

                <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h2>
                <p>
                    {responsiblePerson}<br />
                    {responsiblePersonAddress}
                </p>

                <h2>Streitschlichtung</h2>
                <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.<br />
                    Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
                <p>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>

                <h3>Haftungsausschluss (Disclaimer)</h3>
                <p><strong>Haftung für Inhalte</strong></p>
                <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
                <p><strong>Haftung für Links</strong></p>
                <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>
                <p><strong>Urheberrecht</strong></p>
                <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>

            </div>
        </div>
    );
} 