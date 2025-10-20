// Utility functions for link preview functionality

export interface LinkMetadata {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    author?: string;
    siteName?: string;
    type?: 'video' | 'image' | 'article' | 'website';
    embedUrl?: string;
    videoId?: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
        /youtube\.com\/shorts\/([^&?\s]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Checks if a URL is a direct image link
 */
export function isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const urlLower = url.toLowerCase();

    // Check file extension
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
        return true;
    }

    // Check common CDN patterns
    const cdnPatterns = [
        /cdn\..*\.(jpg|jpeg|png|gif|webp|svg)/i,
        /images\..*\.(jpg|jpeg|png|gif|webp|svg)/i,
        /img\..*\.(jpg|jpeg|png|gif|webp|svg)/i,
        /(jpg|jpeg|png|gif|webp|svg)$/i,
    ];

    return cdnPatterns.some(pattern => pattern.test(url));
}

/**
 * Checks if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Checks if a URL is a Twitter/X post
 */
export function isTwitterUrl(url: string): boolean {
    return /(?:twitter\.com|x\.com)/.test(url);
}

/**
 * Generates a YouTube embed URL from a video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Fetches link metadata from the API route
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
    try {
        // Check for YouTube videos
        const youtubeId = extractYouTubeId(url);
        if (youtubeId) {
            return {
                url,
                type: 'video',
                videoId: youtubeId,
                embedUrl: getYouTubeEmbedUrl(youtubeId),
                image: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
            };
        }

        // Check for direct image URLs
        if (isImageUrl(url)) {
            return {
                url,
                type: 'image',
                image: url,
            };
        }

        // Fetch metadata from API
        const response = await fetch('/api/link-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch link metadata');
        }

        const metadata: LinkMetadata = await response.json();
        return metadata;
    } catch (error) {
        console.error('Error fetching link metadata:', error);
        // Return basic metadata as fallback
        return {
            url,
            type: 'website',
        };
    }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Extracts domain name from URL
 */
export function getDomainFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return '';
    }
}
