"use client";

import React, { useEffect, useRef, useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Pencil, Check } from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// Counter for unique chart IDs
let mermaidIdCounter = 0;

// Explicit render-props type (the old conditional-type derivation no longer
// resolves in @blocknote/react 0.57).
interface MermaidEmbedProps {
  block: {
    id: string;
    type: "mermaid";
    props: {
      code: string;
      width: number;
    };
    content?: never;
    children?: never[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any; // BlockNote editor instance with complex schema
}

const MermaidEmbedComponent = (props: MermaidEmbedProps) => {
  const { block, editor } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [resizeWidth, setResizeWidth] = useState<number>(100);
  const [chartId] = useState(`mermaid-embed-${mermaidIdCounter++}`);

  const code = block?.props?.code || '';

  // Track the resolved theme so diagrams re-render when dark mode toggles
  // (previously the theme was read once and left out of the dep array).
  const { resolvedTheme } = useTheme();
  const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

  useEffect(() => {
    // Only render if not in edit mode
    if (isEditMode) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      // "strict" (mermaid's default) sandboxes rendering and escapes HTML in
      // labels. "loose" would let attacker-authored diagram code inject HTML
      // that executes in every collaborator's browser (stored XSS).
      securityLevel: "strict",
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
          code
        );
        setSvg(renderedSvg);
        setError("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to render diagram");
        setSvg("");
      }
    };

    render();
  }, [code, chartId, isEditMode, mermaidTheme]);

  if (!block) return null;

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
      if (containerRef.current) {
        const percentage =
          (newWidth / containerRef.current.parentElement!.offsetWidth) * 100;
        setResizeWidth(Math.min(100, Math.max(20, percentage)));
      }
    };

    const handleMouseUp = () => {
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
                  type: "mermaid",
                  props: { code: e.target.value },
                  // PartialBlock cast — the custom block's typing isn't
                  // expressible against the `any`-typed editor instance.
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
              }}
              placeholder="Enter Mermaid diagram code..."
              className="font-mono text-sm min-h-[200px]"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Live Preview — rendered SVG comes from mermaid in strict mode;
             errors are rendered as a React text node (never interpolated HTML). */
          <div
            ref={chartRef}
            className="flex justify-center items-center p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[200px]"
          >
            {error ? (
              <pre className="text-red-500 whitespace-pre-wrap break-words">{error}</pre>
            ) : svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="text-gray-400">Rendering diagram...</div>
            )}
          </div>
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
    caption: {
      default: "" as const,
    },
    name: {
      default: "" as const,
    },
  },
  content: "none" as const,
  isFileBlock: false,
};

// Create the React block spec
// In @blocknote 0.57, createReactBlockSpec returns a spec FACTORY that must
// be called to produce the actual block spec object — registering the
// factory itself in a schema crashes with
// "Cannot read properties of undefined (reading 'layoutOnly')".
export const MermaidEmbed = createReactBlockSpec(MermaidEmbedSpec, {
  // Render signature cast — 0.57's render props type isn't directly
  // compatible with the hand-written props interface above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: MermaidEmbedComponent as any,
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
})();
