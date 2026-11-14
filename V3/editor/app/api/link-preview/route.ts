import { NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';
import { auth } from "@clerk/nextjs/server";

// Hosts an outbound fetch must never reach (SSRF protection, CWE-918).
function isBlockedHost(hostname: string): boolean {
    const host = hostname.toLowerCase();
    return (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".internal") ||
        host === "metadata.google.internal" ||
        host.endsWith(".local") ||
        // IPv4 private / link-local / loopback / unspecified ranges
        /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
        // IPv6 loopback, link-local (fe80::), unique-local (fc00::/7), unspecified
        /^(::1|\[::1\]|::|\[::\]|fe80:|f[cd][0-9a-f]{2}:)/i.test(host) ||
        // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.1)
        /^::ffff:/i.test(host)
    );
}

export async function POST(request: NextRequest) {
    try {
        // Auth gate: this endpoint fetches arbitrary URLs server-side.
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL' },
                { status: 400 }
            );
        }

        // Only fetch web content over http(s)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return NextResponse.json(
                { error: 'Only http(s) URLs are supported' },
                { status: 400 }
            );
        }

        // Block internal / private / link-local targets
        if (isBlockedHost(parsed.hostname)) {
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
