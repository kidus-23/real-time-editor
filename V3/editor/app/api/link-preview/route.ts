import { NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL' },
                { status: 400 }
            );
        }

        // Fetch metadata using unfurl with timeout
        const metadata = await Promise.race([
            unfurl(url, {
                oembed: true,
                timeout: 5000,
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 6000)
            )
        ]) as any;

        // Extract relevant metadata with better fallbacks
        const response = {
            url,
            title: metadata?.title || metadata?.open_graph?.title || metadata?.oEmbed?.title || '',
            description: metadata?.description || metadata?.open_graph?.description || metadata?.oEmbed?.description || '',
            image: metadata?.open_graph?.images?.[0]?.url ||
                metadata?.twitter_card?.images?.[0]?.url ||
                metadata?.oEmbed?.thumbnails?.[0]?.url || '',
            favicon: metadata?.favicon || '',
            author: metadata?.open_graph?.article?.author ||
                metadata?.twitter_card?.creator ||
                metadata?.oEmbed?.author_name || '',
            siteName: metadata?.open_graph?.site_name ||
                metadata?.oEmbed?.provider_name || '',
            type: 'website' as const,
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error fetching link preview:', error);

        // Return a more graceful error response
        return NextResponse.json(
            {
                error: 'Failed to fetch link preview',
                message: error?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
