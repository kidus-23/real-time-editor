'use client';

import React, { useState, useRef } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { ExternalLink, Copy, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoEmbedProps {
    block: {
        props: {
            url: string;
            caption?: string;
        };
    };
}

const VideoEmbedComponent = ({ block }: VideoEmbedProps) => {
    const [error, setError] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [width, setWidth] = useState<number>(100);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const url = block.props.url;
    const caption = block.props.caption;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        toast.success('Video URL copied to clipboard!');
        setShowContextMenu(false);
    };

    const handleOpenInBrowser = () => {
        window.open(url, '_blank', 'noopener,noreferrer');
        setShowContextMenu(false);
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = containerRef.current?.offsetWidth || 0;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(200, Math.min(startWidth + deltaX, window.innerWidth - 100));
            if (containerRef.current) {
                const percentage = (newWidth / containerRef.current.parentElement!.offsetWidth) * 100;
                setWidth(Math.min(100, Math.max(20, percentage)));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const setPresetSize = (size: 'small' | 'medium' | 'large' | 'full') => {
        const sizes = { small: 40, medium: 60, large: 80, full: 100 };
        setWidth(sizes[size]);
        toast.success(`Size set to ${size}`);
    };

    React.useEffect(() => {
        const handleClickOutside = () => setShowContextMenu(false);
        if (showContextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showContextMenu]);

    // Extract YouTube video ID
    const getYouTubeId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
            /youtube\.com\/shorts\/([^&?\s]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Extract Vimeo video ID
    const getVimeoId = (url: string): string | null => {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    };

    const youtubeId = getYouTubeId(url);
    const vimeoId = getVimeoId(url);

    let embedUrl = url;
    if (youtubeId) {
        embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
    } else if (vimeoId) {
        embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
    }

    if (error || !url) {
        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    Failed to load video
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-2 bg-white dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group relative"
            onContextMenu={handleContextMenu}
            style={{ width: `${width}%`, margin: '8px auto' }}
        >
            {/* Size Control Buttons */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/50 rounded-md p-1">
                <button onClick={() => setPresetSize('small')} className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded" title="Small (40%)">S</button>
                <button onClick={() => setPresetSize('medium')} className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded" title="Medium (60%)">M</button>
                <button onClick={() => setPresetSize('large')} className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded" title="Large (80%)">L</button>
                <button onClick={() => setPresetSize('full')} className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded" title="Full (100%)">Full</button>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-all z-10"
                onMouseDown={handleResizeStart}
                title="Drag to resize"
            />

            <div className="aspect-video w-full bg-black">
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video player"
                    onError={() => setError(true)}
                />
            </div>
            {caption && (
                <div className="p-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                    {caption}
                </div>
            )}
            <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {url}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopyLink}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Copy link"
                    >
                        <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={handleOpenInBrowser}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Open in browser"
                    >
                        <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>
            {showContextMenu && (
                <ContextMenu
                    x={contextMenuPosition.x}
                    y={contextMenuPosition.y}
                    onCopyLink={handleCopyLink}
                    onOpenInBrowser={handleOpenInBrowser}
                />
            )}
        </div>
    );
};

const ContextMenu = ({
    x,
    y,
    onCopyLink,
    onOpenInBrowser,
}: {
    x: number;
    y: number;
    onCopyLink: () => void;
    onOpenInBrowser: () => void;
}) => {
    return (
        <div
            className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
            style={{ top: y, left: x }}
        >
            <button
                onClick={onCopyLink}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
                <Copy className="h-4 w-4" />
                Copy Video URL
            </button>
            <button
                onClick={onOpenInBrowser}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
                <ExternalLink className="h-4 w-4" />
                Open in Browser
            </button>
        </div>
    );
};

const videoEmbedSpec = {
    type: 'videoEmbed' as const,
    propSchema: {
        url: {
            default: '',
        },
        caption: {
            default: '',
        },
    },
    content: 'none',
};

export const VideoEmbed = createReactBlockSpec(videoEmbedSpec, {
    render: (props) => <VideoEmbedComponent block={props.block} />,
    
    // Serialize video embeds to markdown as links with a video indicator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMarkdown: (block: any) => {
        const url = block.props?.url || '';
        const caption = block.props?.caption;
        if (!url) return '';
        
        // Format as a markdown link with caption if available
        if (caption) {
            return `[🎥 ${caption}](${url})`;
        }
        return `[🎥 Video](${url})`;
    },
});
