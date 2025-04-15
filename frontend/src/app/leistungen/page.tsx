import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
// Assuming type definition exists in types.ts
import type { ServiceInfoItem } from '@/types';
// Import the icon helper
import { getLucideIcon } from '@/lib/utils';

// SEO Metadata for the main Leistungen page
export const metadata: Metadata = {
    title: "Dermatologische Leistungen | Hautarzt Vergleich",
    description: "Erfahren Sie mehr über häufige dermatologische Leistungen wie Aknebehandlung, Hautkrebsvorsorge, Lasertherapie und Allergietests.",
};

// Helper function (can be shared or adapted from homepage)
function getServiceInfoData(): ServiceInfoItem[] {
    const contentDirectory = path.join(process.cwd(), 'content/services');
    try {
        const filenames = fs.readdirSync(contentDirectory);
        const items = filenames
            .filter(filename => filename.endsWith('.md'))
            .map((filename): ServiceInfoItem | null => {
                const slug = filename.replace(/\.md$/, '');
                const filePath = path.join(contentDirectory, filename);
                const fileContents = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter } = matter(fileContents);

                // Basic validation
                if (typeof frontmatter.title !== 'string' || frontmatter.is_active === false) {
                    return null;
                }

                return {
                    id: slug,
                    slug: slug,
                    title: frontmatter.title,
                    summary: frontmatter.summary || null,
                    icon_name: frontmatter.icon_name || null,
                    // Ensure other required fields from type are present or optional
                } as ServiceInfoItem;
            })
            .filter((item): item is ServiceInfoItem => item !== null); // Filter out null items

        // Add sorting if desired (e.g., by title)
        items.sort((a, b) => a.title.localeCompare(b.title));
        return items;
    } catch (error) {
        console.error(`Error reading service info content:`, error);
        return [];
    }
}

// The Page component (Server Component)
export default async function LeistungenPage() {
    const serviceItems = getServiceInfoData();

    return (
        <div className="container py-12 md:py-16">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-4 md:text-4xl">Leistungsspektrum der Dermatologie</h1>
            <p className="text-lg text-muted-foreground text-center mb-10 md:mb-12 max-w-2xl mx-auto">
                Informieren Sie sich über häufige Behandlungen und Diagnoseverfahren beim Hautarzt.
            </p>

            {serviceItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {serviceItems.map((item) => {
                        // Get icon component using the helper
                        const IconComponent = getLucideIcon(item.icon_name);
                        return (
                            <Link key={item.id} href={`/leistungen/${item.slug}`} passHref className="block h-full group">
                                <Card className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        {/* Render icon if found */}
                                        {IconComponent && <IconComponent className="w-7 h-7 mb-2 text-blue-600" strokeWidth={1.5} />}
                                        <CardTitle className="text-lg text-gray-800 group-hover:text-blue-700">{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {item.summary || 'Klicken Sie hier für mehr Details.'}
                                        </p>
                                    </CardContent>
                                    {/* Footer could have a subtle arrow or "Mehr lesen" */}
                                    {/* <CardFooter className="mt-auto pt-3">
                                        <span className="text-xs text-blue-600 font-medium group-hover:underline">Mehr erfahren &rarr;</span>
                                    </CardFooter> */}
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-muted-foreground">Derzeit sind keine Leistungsbeschreibungen verfügbar.</p>
            )}
        </div>
    );
} 