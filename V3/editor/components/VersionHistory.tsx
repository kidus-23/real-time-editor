"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { db } from "@/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Clock, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { diffChars, type Change } from "diff";
import { toast } from "sonner";
import { createSnapshot, restoreVersion } from "@/actions/versionHistory";

// Import BlockNote components and conversion utilities
import {
  BlockNoteEditor,
  PartialBlock,
  Block,
  blocksToMarkdown,
  markdownToBlocks,
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { LinkPreview } from "./embed/LinkPreview";
import { VideoEmbed } from "./embed/VideoEmbed";
import { ImageEmbed } from "./embed/ImageEmbed";
import { MermaidEmbed } from "./embed/MermaidEmbed";

interface Version {
  id: string;
  content: string; // This is now Markdown
  title: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
}

interface VersionHistoryProps {
  documentId: string;
  editor?: BlockNoteEditor | null;
  isOpen?: boolean;
  onClose?: () => void;
}

// Create a schema with custom blocks for the preview editor
const previewSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linkPreview: LinkPreview as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoEmbed: VideoEmbed as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageEmbed: ImageEmbed as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mermaid: MermaidEmbed as any,
  },
});

// Sub-component to render a read-only preview of a version
function PreviewEditor({ markdownContent }: { markdownContent: string }) {
  const [blocks, setBlocks] = useState<Block[] | undefined>(undefined);

  // Create preview editor first so we can use its pmSchema for parsing
  // NOTE: do not pass an empty initialContent array — the hook validates that initialContent is non-empty.
  const previewEditor = useCreateBlockNote({
    schema: previewSchema,
  });

  useEffect(() => {
    const convert = async () => {
      if (!markdownContent) {
        setBlocks([]);
        return;
      }

      if (!previewEditor) {
        // wait until preview editor is created
        return;
      }

      try {
        // Use the previewEditor's pmSchema when parsing markdown to blocks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedBlocks = await (markdownToBlocks as any)(
          markdownContent,
          (previewEditor as any).pmSchema
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pb = parsedBlocks as any;
        setBlocks(pb);

        // Apply parsed blocks to the preview editor so the view renders properly
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (previewEditor as any).isEditable = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (previewEditor as any).replaceBlocks(
            (previewEditor as any).topLevelBlocks,
            pb as any
          );
        } catch (innerErr) {
          // Non-fatal: render will still show blocks via BlockNoteView initial content
          console.error(
            "Failed to apply parsed blocks to preview editor:",
            innerErr
          );
        }
      } catch (err) {
        console.error("Error parsing markdown to blocks for preview:", err);
        setBlocks([]);
      }
    };

    convert();
  }, [markdownContent, previewEditor]);

  if (!previewEditor || !blocks) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <BlockNoteView editor={previewEditor} theme="light" />
    </div>
  );
}

export default function VersionHistory({
  documentId,
  editor,
  isOpen,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { user } = useUser();

  // Fetch versions and current document content when the sheet is opened
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    // Fetch and listen for updates to the current document's content
    const docUnsubscribe = onSnapshot(
      doc(db, "documents", documentId),
      async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data() as Record<string, unknown> | undefined;

        // If the server is storing canonical markdown in the document (preferred), use it
        if (data && typeof data.content === "string") {
          setCurrentContent(data.content as string);
          return;
        }

        // Otherwise, attempt to convert the live editor blocks to markdown, but only if
        // the editor and its pmSchema are initialized. Guard to avoid runtime errors
        // from underlying tiptap/pm serializers (e.g., domSerializer undefined).
        try {
          const hasEditor = !!(editor as any);
          const hasPmSchema = !!(editor as any)?.pmSchema;

          if (hasEditor && hasPmSchema) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const contentInBlocks = (editor as any).topLevelBlocks;
            // Pass the editor instance as the 3rd argument to blocksToMarkdown (matches ImportExportMenu usage)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const markdown = await (blocksToMarkdown as any)(
              contentInBlocks,
              (editor as any).pmSchema,
              editor as any
            );
            setCurrentContent(markdown ?? "");
          } else {
            // Editor not ready and no server markdown available — fallback to empty string
            setCurrentContent("");
          }
        } catch (err) {
          console.error("Error converting editor blocks to markdown:", err);
          setCurrentContent("");
        }
      }
    );

    // Fetch all historical versions
    const versionsRef = collection(db, "documents", documentId, "versions");
    const q = query(versionsRef, orderBy("timestamp", "desc"));
    const versionsUnsubscribe = onSnapshot(q, (snapshot) => {
      const versionsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Version)
      );

      setVersions(versionsData);
      if (versionsData.length > 0 && !selectedVersion) {
        setSelectedVersion(versionsData[0]);
      }
      setLoading(false);
    });

    return () => {
      docUnsubscribe();
      versionsUnsubscribe();
    };
  }, [documentId, isOpen, editor, selectedVersion]);

  // Helper function to manually serialize custom blocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializeCustomBlocks = (blocks: any[]): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return blocks.map((block: any) => {
      // Handle linkPreview blocks
      if (block.type === "linkPreview" && block.props?.url) {
        return {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: block.props.url,
              content: [{ type: "text", text: block.props.url }],
            },
          ],
        };
      }

      // Handle imageEmbed blocks
      if (block.type === "imageEmbed" && block.props?.url) {
        return {
          type: "image",
          props: {
            url: block.props.url,
            caption: block.props.caption || "",
          },
        };
      }

      // Handle videoEmbed blocks
      if (block.type === "videoEmbed" && block.props?.url) {
        const caption = block.props.caption || "Video";
        return {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: block.props.url,
              content: [{ type: "text", text: `🎥 ${caption}` }],
            },
          ],
        };
      }

      // Handle mermaid blocks - convert to code block
      if (block.type === "mermaid" && block.props?.code) {
        return {
          type: "codeBlock",
          props: {
            language: "mermaid",
          },
          content: [{ type: "text", text: block.props.code }],
        };
      }

      // Recursively handle nested blocks (children)
      if (block.children && Array.isArray(block.children)) {
        return {
          ...block,
          children: serializeCustomBlocks(block.children),
        };
      }

      return block;
    });
  };

  // Client-side handler to create a snapshot
  const handleCreateSnapshot = async () => {
    if (!user || !editor) return;

    startTransition(true);
    try {
      // Prefer using the editor's pmSchema when available for reliable conversion.
      // Fallback to the currentContent (which may already be canonical Markdown) if conversion isn't possible.
      let markdownContent: string;
      try {
        // Capture editor fields in locals to avoid a race where `editor` changes
        // between the truthiness check and the actual use (causes pmSchema undefined).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const editorAny = editor as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pmSchema = editorAny?.pmSchema as any | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let topLevelBlocks = editorAny?.topLevelBlocks as any | undefined;

        if (editorAny && pmSchema && topLevelBlocks) {
          // Convert custom blocks to standard markdown-compatible blocks
          topLevelBlocks = serializeCustomBlocks(topLevelBlocks);

          // Pass the editor instance as the 3rd argument to blocksToMarkdown to ensure internal serializers
          // can access editor helpers (matches ImportExportMenu usage).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          markdownContent = await (blocksToMarkdown as any)(
            topLevelBlocks,
            pmSchema,
            editorAny
          );
        } else {
          // Use last-known currentContent (document snapshot) as fallback
          markdownContent = currentContent ?? "";
        }
      } catch (convErr) {
        console.error(
          "Error converting blocks to markdown for snapshot:",
          convErr
        );
        // Fall back to currentContent if conversion fails
        markdownContent = currentContent ?? "";
      }

      const title =
        (editor as any)?.document?.[0]?.content?.[0]?.text || "Untitled";

      const result = await createSnapshot(documentId, title, markdownContent);
      if (result.success) {
        toast.success("Snapshot created successfully!");
      } else {
        console.error("createSnapshot returned error:", result);
        toast.error(result.error || "Failed to create snapshot");
      }
    } catch (error) {
      console.error("handleCreateSnapshot error:", error);
      const msg = (error as any)?.message || String(error);
      toast.error(
        `An unexpected error occurred while creating snapshot: ${msg}`
      );
    } finally {
      startTransition(false);
    }
  };

  // Client-side handler to restore a version
  const handleRestoreVersion = async () => {
    if (!selectedVersion || !editor) return;

    setRestoring(true);
    try {
      // 1. Call the server action to GET the historical markdown
      const result = await restoreVersion(documentId, selectedVersion.id);

      if (result.success && result.markdownContent) {
        // 2. Convert the markdown string back into BlockNote blocks
        // Pass the editor schema (pmSchema) to ensure parser has correct schema when available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blocks = await (markdownToBlocks as any)(
          result.markdownContent,
          (editor as any)?.pmSchema
        );

        // 3. Replace the live editor's content with the restored blocks
        // Cast to any to avoid strict typing mismatches between BlockNote schemas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (editor as any).replaceBlocks(
          (editor as any).topLevelBlocks,
          blocks as any
        );

        toast.success("Version restored successfully!");
        onClose?.(); // Close the sheet if a handler was provided
      } else {
        toast.error(result.error || "Failed to restore version");
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(false);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()} (${formatDistanceToNow(
      date,
      { addSuffix: true }
    )})`;
  };

  // Memoized diff generation
  const diffView = useMemo(() => {
    if (!selectedVersion) return null;
    const differences = diffChars(currentContent, selectedVersion.content);

    return (
      <div className="whitespace-pre-wrap font-mono text-sm space-y-1">
        {differences.map((part: Change, index: number) => {
          const style = part.added
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
            : part.removed
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through"
            : "text-muted-foreground";
          return (
            <span key={index} className={style}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  }, [currentContent, selectedVersion]);

  return (
    // The component returns only the main container for the version history panel
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Version History</h2>
        </div>
        <div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Versions Sidebar */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <Button
              onClick={handleCreateSnapshot}
              disabled={loading || isPending}
              className="w-full"
            >
              {isPending ? "Creating..." : "Create New Snapshot"}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <p className="text-center p-4 text-muted-foreground">
                  Loading versions...
                </p>
              ) : versions.length === 0 ? (
                <p className="text-center p-4 text-muted-foreground">
                  No versions found.
                </p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <p className="font-medium text-sm truncate">
                      {version.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(version.timestamp)} by {version.userName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Version Preview Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedVersion ? (
            <>
              <Tabs
                defaultValue="preview"
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="changes">Changes</TabsTrigger>
                  </TabsList>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRestoreVersion}
                    disabled={isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isPending ? "Restoring..." : "Restore this version"}
                  </Button>
                </div>

                <TabsContent
                  value="preview"
                  className="flex-1 m-0 overflow-auto"
                >
                  <div className="p-4">
                    <h1 className="text-3xl font-bold mb-4">
                      {selectedVersion.title}
                    </h1>
                    <PreviewEditor markdownContent={selectedVersion.content} />
                  </div>
                </TabsContent>

                <TabsContent
                  value="changes"
                  className="flex-1 m-0 overflow-auto"
                >
                  <div className="p-4">{diffView}</div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a version to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
