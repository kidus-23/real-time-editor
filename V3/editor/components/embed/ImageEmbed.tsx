"use client";

import React, { useState, useRef, useEffect } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { ExternalLink, Copy, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// Define the props type for the image embed block
type ImageEmbedPropsType = {
  url: string;
  caption: string;
  width: number;
};

// Define the block config
type ImageEmbedConfig = {
  type: "imageEmbed";
  propSchema: {
    url: {
      default: "";
    };
    caption: {
      default: "";
    };
    width: {
      default: 100;
    };
  };
  content: "none";
  isFileBlock: false;
};

// Define a simple block type for typing the render props
type ImageEmbedBlock = {
  type: "imageEmbed";
  props: ImageEmbedPropsType;
  id: string;
  content?: never;
  children?: never[];
};

const imageEmbedConfig: ImageEmbedConfig = {
  type: "imageEmbed" as const,
  propSchema: {
    url: {
      default: "" as const,
    },
    caption: {
      default: "" as const,
    },
    width: {
      default: 100 as const,
    },
  },
  content: "none" as const,
  isFileBlock: false,
};

interface ImageEmbedProps {
  block: ImageEmbedBlock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any; // BlockNote editor instance with complex schema
}

const ImageEmbedComponent = ({ block, editor }: ImageEmbedProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isFocused, setIsFocused] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number>(block.props.width ?? 100);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteInputRef = useRef<HTMLTextAreaElement>(null);

  const url = block.props.url || "";
  const caption = block.props.caption || "";

  // Sync state with prop changes (e.g., external updates)
  useEffect(() => {
    setResizeWidth(block.props.width ?? 100);
  }, [block.props.width]);

  const updateBlockProps = (updates: Partial<ImageEmbedPropsType>) => {
    editor.updateBlock(block, { props: { ...block.props, ...updates } });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    pasteInputRef.current?.focus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!");
    setShowContextMenu(false);
  };

  const handleCopyImage = async () => {
    try {
      if (url.startsWith("data:")) {
        // For data URLs (local embeds), create blob from canvas to avoid CORS
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((b) => {
                if (b) {
                  navigator.clipboard
                    .write([new ClipboardItem({ [b.type]: b })])
                    .then(() => {
                      toast.success("Image copied to clipboard!");
                      resolve();
                    })
                    .catch(reject);
                } else {
                  reject(new Error("Failed to create blob from canvas"));
                }
              }, "image/png");
            } else {
              reject(new Error("Failed to get canvas context"));
            }
          };
          img.onerror = reject;
        });
      } else {
        // For remote URLs
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        toast.success("Image copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast.error("Failed to copy image");
    }
    setShowContextMenu(false);
  };

  const handleOpenInBrowser = () => {
    if (url.startsWith("data:")) {
      // For data URLs, open in new tab via blob URL
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank", "noopener,noreferrer");
        })
        .catch((err) => {
          console.error("Failed to open data URL:", err);
          toast.error("Cannot open local image in browser");
        });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setShowContextMenu(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(
        200,
        Math.min(startWidth + deltaX, window.innerWidth - 100)
      );
      if (containerRef.current && containerRef.current.parentElement) {
        const percentage =
          (newWidth / containerRef.current.parentElement.offsetWidth) * 100;
        const clampedPercentage = Math.min(100, Math.max(20, percentage));
        setResizeWidth(clampedPercentage);
        // Persist to block immediately for real-time updates
        updateBlockProps({ width: clampedPercentage });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    // Validate size (optional: e.g., < 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateBlockProps({ url: dataUrl });
      setLoading(true);
      setError(false);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const setPresetSize = (size: "small" | "medium" | "large" | "full") => {
    const sizes = { small: 40, medium: 60, large: 80, full: 100 };
    const newWidth = sizes[size];
    setResizeWidth(newWidth);
    updateBlockProps({ width: newWidth });
    toast.success(`Size set to ${size}`);
  };

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  if (!block) return null;

  if (!url) {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-8 my-2 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer ${
          isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
        } focus:outline-none`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
        onClick={() => fileInputRef.current?.click()}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
            // Reset input
            e.target.value = "";
          }}
        />
        <textarea
          ref={pasteInputRef}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          onPaste={handlePaste}
          readOnly
          tabIndex={-1}
        />
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drop an image here, paste from clipboard, click to select, or press Enter/Space
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports JPG, PNG, GIF, WebP (max 5MB)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`border rounded-lg overflow-hidden my-2 bg-white dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group relative ${
        isFocused ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      } focus:outline-none`}
      onContextMenu={handleContextMenu}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ width: `${resizeWidth}%`, margin: "8px auto" }}
      tabIndex={0}
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">Failed to load image</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-blue-500 hover:underline text-sm"
            >
              Replace image
            </button>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={caption || "Image"}
            className="w-full h-auto max-h-[600px] object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
      {caption && (
        <div className="p-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          {caption}
        </div>
      )}
      <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate" title={url}>
            {url.startsWith("data:") ? "Embedded Image" : url}
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
          onCopyImage={handleCopyImage}
          onOpenInBrowser={handleOpenInBrowser}
        />
      )}
      {/* Hidden file input for replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          e.target.value = "";
        }}
      />
      <textarea
        ref={pasteInputRef}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        onPaste={handlePaste}
        readOnly
        tabIndex={-1}
      />
    </div>
  );
};

const ContextMenu = ({
  x,
  y,
  onCopyLink,
  onCopyImage,
  onOpenInBrowser,
}: {
  x: number;
  y: number;
  onCopyLink: () => void;
  onCopyImage: () => void;
  onOpenInBrowser: () => void;
}) => {
  return (
    <div
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      <button
        onClick={onCopyImage}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Copy Image
      </button>
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

export const ImageEmbed = createReactBlockSpec(imageEmbedConfig, {
  render: (props) => <ImageEmbedComponent block={props.block as ImageEmbedBlock} editor={props.editor} />,
});