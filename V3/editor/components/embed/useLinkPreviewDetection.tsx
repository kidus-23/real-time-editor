'use client';

import { useEffect, useRef } from 'react';
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
    } catch (e) {
        // If parsing fails, return original URL
    }
    return googleImagesUrl;
}

/**
 * Extracts URL from block content, handling both plain text and links
 */
function extractUrlFromBlock(block: any): string | null {
    if (!block.content || !Array.isArray(block.content)) return null;

    // Check if block contains only a link
    if (block.content.length === 1 && block.content[0].type === 'link') {
        return block.content[0].href;
    }

    // Check for plain text URLs
    let text = block.content.map((item: any) => item.text || '').join('').trim();

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
    const processedBlocks = useRef(new Set<string>());
    const isProcessing = useRef(false);

    useEffect(() => {
        if (!editor) return;

        const checkForLinks = async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                const blocks = editor.document;
                if (!blocks || !Array.isArray(blocks)) return;

                for (const block of blocks) {
                    // Only process paragraph blocks
                    if (block.type !== 'paragraph') continue;

                    // Skip if already processed
                    if (processedBlocks.current.has(block.id)) continue;

                    // Skip empty blocks
                    if (!block.content || block.content.length === 0) continue;

                    // Extract URL from block
                    const url = extractUrlFromBlock(block);

                    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        // Mark as processed
                        processedBlocks.current.add(block.id);

                        // Extract actual image URL if it's a Google Images link
                        const actualUrl = url.includes('google.com/imgres')
                            ? extractActualImageUrl(url)
                            : url;

                        // Replace the paragraph block with a link preview block
                        try {
                            await editor.updateBlock(block.id, {
                                type: 'linkPreview' as any,
                                props: { url: actualUrl },
                            });
                        } catch (err) {
                            console.error('Failed to create link preview:', err);
                            processedBlocks.current.delete(block.id);
                        }
                    }
                }
            } catch (err) {
                console.error('Error in link detection:', err);
            } finally {
                isProcessing.current = false;
            }
        };

        // Debounce the check to avoid too frequent updates
        let timeoutId: NodeJS.Timeout;
        const unsubscribe = editor.onChange(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                checkForLinks();
            }, 500);
        });

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [editor]);
}
