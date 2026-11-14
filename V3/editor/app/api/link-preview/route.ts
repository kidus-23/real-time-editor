import { NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';
import { auth } from "@clerk/nextjs/server";

// Hosts an outbound fetch must never reach (SSRF protection, CWE-918).
//
// Handles the practical bypasses: trailing-dot FQDNs (localhost.),
// numeric IPv4 encodings (decimal 2130706433, octal 0177.0.0.1, hex 0x7f.0.0.1
// — all of which can encode 127.0.0.1 or 169.254.169.254), and IPv6 zone ids.
// Known accepted limitations (documented, can't be fixed at this layer):
// unfurl() follows redirects to arbitrary hosts, and DNS-rebinding TOCTOU.
function isBlockedHost(hostname: string): boolean {
    let host = hostname.toLowerCase();

    // IPv6 zone id (e.g. [::1%25eth0]) — reject outright
    if (host.includes("%")) {
        return true;
    }

    // Trailing-dot FQDN ("localhost." still resolves to loopback)
    host = host.replace(/\.+$/, "").replace(/^\[|\]$/g, "");

    // Numeric-only IPv4 encodings — canonicalize to a dotted quad
    if (/^[0-9]+$/.test(host)) {
        const n = Number(host);
        if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
            return true;
        }
        host = [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
    } else if (/^0[0-9a-fx]+(\.[0-9a-fx]+)*$/i.test(host) && /(\.|^[0-9a-f]+$)/i.test(host)) {
        // Octal/hex mixed notation like 0177.0.0.1 or 0x7f.0.0.1
        const parts = host.split(".").map((p) => {
            if (/^0[0-9]+$/.test(p)) return String(parseInt(p, 8));
            if (/^0x[0-9a-f]+$/i.test(p)) return String(parseInt(p, 16));
            return p;
        });
        if (parts.every((p) => /^\d+$/.test(p))) {
            host = parts.join(".");
        }
    }

    return (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".internal") ||
        host === "metadata.google.internal" ||
        host.endsWith(".local") ||
        // IPv4 private / link-local / loopback / unspecified ranges
        /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
        // IPv6 loopback, link-local (fe80::), unique-local (fc00::/7), unspecified
        /^(::1|::|fe80:|f[cd][0-9a-f]{2}:)/i.test(host) ||
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
