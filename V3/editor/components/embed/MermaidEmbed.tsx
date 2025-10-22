"use client";

import React, { useEffect, useRef, useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import type { BlockNoteEditor } from "@blocknote/core";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Pencil, Check } from "lucide-react";
import mermaid from "mermaid";
import { toast } from "sonner";

// Counter for unique chart IDs
let mermaidIdCounter = 0;

type MermaidEmbedProps = {
  block: {
    props: {
      code: string;
    };
  };
  editor: BlockNoteEditor;
};

const MermaidEmbedComponent = ({ block, editor }: MermaidEmbedProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeWidth, setResizeWidth] = useState<number>(100);
  const [chartId] = useState(`mermaid-embed-${mermaidIdCounter++}`);

  useEffect(() => {
    // Only render if not in edit mode
    if (isEditMode) return;

    const theme = editor.props?.theme === "dark" ? "dark" : "default";

    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "loose",
    });

    const render = async () => {
      try {
        // Clean up any previous mermaid elements with this ID
        const existingElement = document.getElementById(chartId);
        if (existingElement) {
          existingElement.remove();
        }

        const { svg: renderedSvg } = await mermaid.render(
          chartId,
          block.props.code
        );
        setSvg(renderedSvg);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to render diagram");
        setSvg("");
      }
    };

    render();
  }, [block.props.code, editor.props?.theme, chartId, isEditMode]);

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

  return (
    <div
      ref={containerRef}
      data-block-type="mermaid"
      className="my-4 group relative"
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

      <div className="space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BrainCircuit size={16} />
            <span>Mermaid Diagram</span>
          </div>

          {/* Edit/Done Button */}
          {editor.isEditable && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              {isEditMode ? (
                <>
                  <Check size={14} />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Pencil size={14} />
                  <span>Edit</span>
                </>
              )}
            </button>
          )}
        </div>

        {isEditMode ? (
          /* Code Editor */
          <div className="space-y-2">
            <Textarea
              value={block.props.code}
              onChange={(e) => {
                editor.updateBlock(block, {
                  props: { code: e.target.value },
                });
              }}
              placeholder="Enter Mermaid diagram code..."
              className="font-mono text-sm min-h-[200px]"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Live Preview */
          <div
            ref={chartRef}
            className="flex justify-center items-center p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[200px]"
            dangerouslySetInnerHTML={{
              __html: error
                ? `<pre class="text-red-500">${error}</pre>`
                : svg ||
                  '<div class="text-gray-400">Rendering diagram...</div>',
            }}
          />
        )}
      </div>
    </div>
  );
};

// Block specification
export const MermaidEmbedSpec = {
  type: "mermaid" as const,
  propSchema: {
    code: {
      default: "graph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;",
    },
  },
  content: "none" as const,
};

// Create the React block spec
export const MermaidEmbed = createReactBlockSpec(MermaidEmbedSpec, {
  render: (props) => <MermaidEmbedComponent {...props} />,
  toExternalHTML: (props) => {
    return (
      <div data-block-type="mermaid">
        <pre>
          <code className="language-mermaid">{props.block.props.code}</code>
        </pre>
      </div>
    );
  },
  parse: (element) => {
    if (element.getAttribute("data-block-type") === "mermaid") {
      const code = element.querySelector("code")?.textContent || "";
      return {
        code,
      };
    }
    return undefined;
  },
});
