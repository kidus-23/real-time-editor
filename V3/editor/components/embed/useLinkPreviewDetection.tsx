'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from 'react';
import LinkifyIt from 'linkify-it';

const linkify = new LinkifyIt();

/**
 * Extracts actual image URL from Google Images search results
 */
function extractActualImageUrl(googleImagesUrl: string): string {
    try {
        const url = new URL(googleImagesUrl);
        const imgurl = url.searchParams.get('imgurl');
        if (imgurl) {
            return imgurl;
        }
    } catch {
        // If parsing fails, return original URL
    }
    return googleImagesUrl;
}

/**
 * Extracts URL from block content, handling both plain text and links
 */
function extractUrlFromBlock(block: any): string | null {
    if (!block) return null;
    if (!block.content || !Array.isArray(block.content)) return null;

    // Check if block contains only a link
    if (block.content.length === 1 && block.content[0].type === 'link') {
        return block.content[0].href;
    }

    // Check for plain text URLs
    const text = block.content.map((item: any) => item.text || '').join('').trim();

    if (!text) return null;

    // Try to match URL in text
    const matches = linkify.match(text);
    if (matches && matches.length > 0 && matches[0].url === text) {
        return text;
    }

    return null;
}

/**
 * Hook that automatically detects URLs in the editor and converts them to link preview blocks
 */
export function useLinkPreviewDetection(editor: any) {
    useEffect(() => {
        if (!editor) return;

        const processedBlocks = new Set<string>();

        const checkForLinks = () => {
            try {
                const blocks = editor.document;

                blocks.forEach((block: any) => {
                    if (!block) return;
                    // Only process paragraph blocks
                    if (block.type !== 'paragraph') return;

                    // Skip if already processed
                    if (processedBlocks.has(block.id)) return;

                    // Extract URL from block
                    const url = extractUrlFromBlock(block);

                    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        // Mark as processed
                        processedBlocks.add(block.id);

                        // Extract actual image URL if it's a Google Images link
                        const actualUrl = url.includes('google.com/imgres')
                            ? extractActualImageUrl(url)
                            : url;

                        // Replace the paragraph block with a link preview block
                        setTimeout(() => {
                            try {
                                editor.updateBlock(block.id, {
                                    type: 'linkPreview' as any,
                                    props: { url: actualUrl },
                                });
                            } catch (err) {
                                console.error('Failed to create link preview:', err);
                                processedBlocks.delete(block.id);
                            }
                        }, 100);
                    }
                });
            } catch (err) {
                console.error('Error in link detection:', err);
            }
        };

        // Listen for text changes
        const unsubscribe = editor.onChange(() => {
            checkForLinks();
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [editor]);
}
