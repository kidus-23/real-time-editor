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

        // Fetch metadata using unfurl
        const metadata = await unfurl(url);

        // Extract relevant metadata
        const response = {
            url,
            title: metadata.title || metadata.open_graph?.title,
            description: metadata.description || metadata.open_graph?.description,
            image: metadata.open_graph?.images?.[0]?.url || metadata.twitter_card?.images?.[0]?.url,
            favicon: metadata.favicon,
            author: metadata.open_graph?.article?.author || metadata.twitter_card?.creator,
            siteName: metadata.open_graph?.site_name,
            type: 'website' as const,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching link preview:', error);
        return NextResponse.json(
            { error: 'Failed to fetch link preview' },
            { status: 500 }
        );
    }
}
