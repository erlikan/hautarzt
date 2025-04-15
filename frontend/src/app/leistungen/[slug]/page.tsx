import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown'; // Import for rendering content
// Import the icon helper
import { getLucideIcon } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
// Import Button component
import { Button } from '@/components/ui/button';

// Define structure of props passed by Next.js
interface ServicePageProps {
    params: { slug: string };
}

// Helper to get data for a single service slug
function getServiceData(slug: string): { frontmatter: Record<string, any>, content: string } | null {
    const contentDirectory = path.join(process.cwd(), 'content/services');
    const filePath = path.join(contentDirectory, `${slug}.md`);

    try {
        if (!fs.existsSync(filePath)) {
            return null; // File doesn't exist
        }
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        // Basic validation
        if (typeof data.title !== 'string' || data.is_active === false) {
            console.warn(`Service file ${slug}.md is inactive or missing title.`)
            return null;
        }
        return { frontmatter: data, content };
    } catch (error) {
        console.error(`Error reading service file ${slug}.md:`, error);
        return null;
    }
}

// Function to generate static paths at build time
export async function generateStaticParams() {
    const contentDirectory = path.join(process.cwd(), 'content/services');
    try {
        const filenames = fs.readdirSync(contentDirectory);
        return filenames
            .filter(filename => filename.endsWith('.md'))
            .map(filename => ({
                slug: filename.replace(/\.md$/, ''),
            }));
    } catch (error) {
        console.error("Error reading service directory for static params:", error);
        return [];
    }
}

// Function to generate dynamic metadata
export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
    const serviceData = getServiceData(params.slug);

    if (!serviceData) {
        return {
            title: "Leistung nicht gefunden",
            description: "Die angeforderte Leistungsbeschreibung konnte nicht gefunden werden."
        };
    }

    return {
        title: `${serviceData.frontmatter.title} | Hautarzt Vergleich`,
        description: serviceData.frontmatter.summary || `Erfahren Sie mehr über ${serviceData.frontmatter.title}.`,
        // Add other metadata like canonical URL if needed
    };
}


// The Page component (Server Component)
export default async function ServiceDetailPage({ params }: ServicePageProps) {
    const { slug } = params;
    const serviceData = getServiceData(slug);

    // Handle not found case
    if (!serviceData) {
        notFound(); // Trigger Next.js 404 page
    }

    const { frontmatter, content } = serviceData;
    // Get icon component
    const IconComponent = getLucideIcon(frontmatter.icon_name);

    return (
        <div className="container py-12 md:py-16">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center space-x-1">
                <Link href="/" className="hover:text-primary">Startseite</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/leistungen`} className="hover:text-primary">Leistungen</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{frontmatter.title}</span>
            </nav>

            {/* Main Content Area */}
            <article className="prose prose-lg dark:prose-invert max-w-3xl mx-auto">
                {/* Render Icon if found */}
                <div className="flex items-center gap-3 mb-4">
                    {IconComponent && <IconComponent className="w-8 h-8 text-blue-600 flex-shrink-0" strokeWidth={1.5} />}
                    <h1>{frontmatter.title}</h1>
                </div>
                {/* Render the markdown content */}
                <ReactMarkdown>{content}</ReactMarkdown>
            </article>

            {/* Optional: Add a CTA or link back */}
            <div className="text-center mt-12">
                <Link href="/leistungen">
                    <Button variant="outline">&larr; Zurück zur Leistungsübersicht</Button>
                </Link>
            </div>
        </div>
    );
} 