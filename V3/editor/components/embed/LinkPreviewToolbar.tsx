'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, Info, Video, Image } from 'lucide-react';
import { toast } from 'sonner';
import { BlockNoteEditor } from '@blocknote/core';

interface LinkPreviewToolbarProps {
    editor: BlockNoteEditor;
}

export function LinkPreviewToolbar({ editor }: LinkPreviewToolbarProps) {
    const handleInsertLinkPreview = () => {
        const url = prompt('Enter URL to preview:\n\nExamples:\n• https://www.youtube.com/watch?v=...\n• https://example.com/image.jpg\n• https://example.com/article');

        if (!url) return;

        // Clean up the URL - remove markdown formatting if present
        let cleanUrl = url.trim();

        // Extract URL from markdown link format [text](url)
        const markdownLinkMatch = cleanUrl.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
        if (markdownLinkMatch) {
            cleanUrl = markdownLinkMatch[1];
        }

        // Extract actual image URL from Google Images
        if (cleanUrl.includes('google.com/imgres')) {
            try {
                const urlObj = new URL(cleanUrl);
                const imgurl = urlObj.searchParams.get('imgurl');
                if (imgurl) {
                    cleanUrl = imgurl;
                }
            } catch {
                // Keep original URL if parsing fails
            }
        }

        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            try {
                editor.insertBlocks(
                    [
                        {
                            type: 'linkPreview' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                            props: { url: cleanUrl },
                        },
                    ],
                    editor.getTextCursorPosition().block,
                    'after'
                );
                toast.success('Link preview inserted!');
            } catch (error) {
                console.error('Failed to insert link preview:', error);
                toast.error('Failed to insert link preview');
            }
        } else {
            toast.error('Please enter a valid URL starting with http:// or https://');
        }
    };

    const handleInsertVideo = () => {
        const url = prompt('Enter video URL:\n\nSupported:\n• YouTube: https://www.youtube.com/watch?v=...\n• Vimeo: https://vimeo.com/...\n• Direct video files: https://example.com/video.mp4');

        if (!url) return;

        let cleanUrl = url.trim();

        // Extract URL from markdown link format
        const markdownLinkMatch = cleanUrl.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
        if (markdownLinkMatch) {
            cleanUrl = markdownLinkMatch[1];
        }

        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            try {
                editor.insertBlocks(
                    [
                        {
                            type: 'videoEmbed' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                            props: { url: cleanUrl },
                        },
                    ],
                    editor.getTextCursorPosition().block,
                    'after'
                );
                toast.success('Video embedded!');
            } catch (error) {
                console.error('Failed to insert video:', error);
                toast.error('Failed to insert video');
            }
        } else {
            toast.error('Please enter a valid URL starting with http:// or https://');
        }
    };

    const handleInsertImage = () => {
        const url = prompt('Enter image URL:\n\nExample:\n• https://example.com/image.jpg\n• https://cdn.example.com/photo.png');

        if (!url) return;

        let cleanUrl = url.trim();

        // Extract URL from markdown link format
        const markdownLinkMatch = cleanUrl.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
        if (markdownLinkMatch) {
            cleanUrl = markdownLinkMatch[1];
        }

        // Extract actual image URL from Google Images
        if (cleanUrl.includes('google.com/imgres')) {
            try {
                const urlObj = new URL(cleanUrl);
                const imgurl = urlObj.searchParams.get('imgurl');
                if (imgurl) {
                    cleanUrl = imgurl;
                }
            } catch {
                // Keep original URL if parsing fails
            }
        }

        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            try {
                editor.insertBlocks(
                    [
                        {
                            type: 'imageEmbed' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                            props: { url: cleanUrl },
                        },
                    ],
                    editor.getTextCursorPosition().block,
                    'after'
                );
                toast.success('Image inserted!');
            } catch (error) {
                console.error('Failed to insert image:', error);
                toast.error('Failed to insert image');
            }
        } else {
            toast.error('Please enter a valid URL starting with http:// or https://');
        }
    };

    const showHelp = () => {
        toast.info(
            'Media Embed Help:\n\n' +
            '📺 Video: YouTube, Vimeo, and direct video URLs\n' +
            '🖼️ Image: Any direct image URL\n' +
            '🔗 Link Preview: Articles, websites, and auto-detection\n\n' +
            'Tip: Paste URLs on their own line for auto-conversion!',
            { duration: 8000 }
        );
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                onClick={handleInsertVideo}
                variant="outline"
                size="sm"
                className="gap-2"
                title="Insert Video"
            >
                <Video className="h-4 w-4" />
                Video
            </Button>
            <Button
                onClick={handleInsertImage}
                variant="outline"
                size="sm"
                className="gap-2"
                title="Insert Image"
            >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4" />
                Image
            </Button>
            <Button
                onClick={handleInsertLinkPreview}
                variant="outline"
                size="sm"
                className="gap-2"
                title="Insert Link Preview"
            >
                <Link className="h-4 w-4" />
                Link
            </Button>
            <Button
                onClick={showHelp}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Media Embed Help"
            >
                <Info className="h-4 w-4" />
            </Button>
        </div>
    );
}