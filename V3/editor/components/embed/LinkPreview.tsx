"use client";

import React, { useState, useEffect, useRef } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import {
  fetchLinkMetadata,
  LinkMetadata,
  getDomainFromUrl,
  isValidUrl,
} from "@/lib/linkPreview";
import { ExternalLink, Copy, Loader2, Image, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface LinkPreviewProps {
  block: {
    props: {
      url: string;
    };
  };
}

const LinkPreviewComponent = ({ block }: LinkPreviewProps) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [resizeWidth, setResizeWidth] = useState<number>(100);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const url = block.props.url;

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadMetadata = async () => {
      try {
        setLoading(true);
        const data = await fetchLinkMetadata(url);
        setMetadata(data);
        setError(false);
      } catch (err) {
        console.error("Failed to load link preview:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [url]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
    setShowContextMenu(false);
  };

  const handleOpenInBrowser = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setShowContextMenu(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(
        200,
        Math.min(startWidth + deltaX, window.innerWidth - 100)
      );
      if (containerRef.current) {
        const percentage =
          (newWidth / containerRef.current.parentElement!.offsetWidth) * 100;
        setResizeWidth(Math.min(100, Math.max(20, percentage)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const setPresetSize = (size: "small" | "medium" | "large" | "full") => {
    const sizes = { small: 40, medium: 60, large: 80, full: 100 };
    setResizeWidth(sizes[size]);
    toast.success(`Size set to ${size}`);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  if (loading) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-2 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-2 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group"
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate text-sm"
            >
              {url}
            </a>
          </div>
          <button
            onClick={handleCopyLink}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Copy link"
          >
            <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
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
  }

  // Render YouTube video embed
  if (metadata.type === "video" && metadata.embedUrl) {
    return (
      <div
        ref={containerRef}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-2 bg-white dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group relative"
        onContextMenu={handleContextMenu}
        style={{ width: `${resizeWidth}%`, margin: "8px auto" }}
      >
        {/* Size Control Buttons */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/50 rounded-md p-1">
          <button
            onClick={() => setPresetSize("small")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Small (40%)"
          >
            S
          </button>
          <button
            onClick={() => setPresetSize("medium")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Medium (60%)"
          >
            M
          </button>
          <button
            onClick={() => setPresetSize("large")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Large (80%)"
          >
            L
          </button>
          <button
            onClick={() => setPresetSize("full")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Full (100%)"
          >
            Full
          </button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-all z-10"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />

        <div className="aspect-video w-full bg-black">
          <iframe
            src={metadata.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
        <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <PlayCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {getDomainFromUrl(url)}
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
  }

  // Render image preview
  if (metadata.type === "image" || (metadata.image && !metadata.title)) {
    return (
      <div
        ref={containerRef}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-2 bg-white dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group relative"
        onContextMenu={handleContextMenu}
        style={{ width: `${resizeWidth}%`, margin: "8px auto" }}
      >
        {/* Size Control Buttons */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/50 rounded-md p-1">
          <button
            onClick={() => setPresetSize("small")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Small (40%)"
          >
            S
          </button>
          <button
            onClick={() => setPresetSize("medium")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Medium (60%)"
          >
            M
          </button>
          <button
            onClick={() => setPresetSize("large")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Large (80%)"
          >
            L
          </button>
          <button
            onClick={() => setPresetSize("full")}
            className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
            title="Full (100%)"
          >
            Full
          </button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-all z-10"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        />

        <div className="relative bg-gray-100 dark:bg-gray-900">
          <img
            src={metadata.image || url}
            alt={metadata.title || "Image preview"}
            className="w-full h-auto max-h-96 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {getDomainFromUrl(url)}
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
  }

  // Render article/website preview
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden my-2 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group no-underline"
      onContextMenu={handleContextMenu}
    >
      <div className="flex">
        {metadata.image && (
          <div className="w-48 flex-shrink-0 bg-gray-100 dark:bg-gray-900">
            <img
              src={metadata.image}
              alt={metadata.title || "Preview"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {metadata.title && (
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 text-base">
                  {metadata.title}
                </h3>
              )}
              {metadata.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {metadata.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                {metadata.favicon && (
                  <img
                    src={metadata.favicon}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span>{metadata.siteName || getDomainFromUrl(url)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCopyLink();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Copy link"
              >
                <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
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
    </a>
  );
};

// Context menu component
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
        Copy Link
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

// Define the custom block spec
const linkPreviewSpec = {
  type: "linkPreview" as const,
  propSchema: {
    url: {
      default: "",
    },
  },
  content: "none",
};

export const LinkPreview = createReactBlockSpec(linkPreviewSpec, {
  render: (props) => <LinkPreviewComponent block={props.block as any} />,

  // Serialize link previews to markdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toMarkdown: (block: any) => {
    const url = block.props?.url;
    if (!url) {
      return "";
    }
    // Serialize as a standard Markdown link: [url](url)
    return `[${url}](${url})`;
  },
});
