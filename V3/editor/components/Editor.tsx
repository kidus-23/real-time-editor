"use client";

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useState, useEffect, useCallback, memo } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import stringToColor from "@/lib/stringToColor";
import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import TranslateDocument from "./TranslateDocument";
import Summarize from "./Summarize";
import Composer from "./Composer";
import QuestionGenerator from "./QuestionGenerator";
import { saveDocumentContent } from "@/actions/actions";
import { LinkPreview } from "./embed/LinkPreview";
import { useLinkPreviewDetection } from "./embed/useLinkPreviewDetection";
import { VideoEmbed } from "./embed/VideoEmbed";
import { ImageEmbed } from "./embed/ImageEmbed";
import { MessageSquare } from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";
import {
  FormattingToolbar,
  FormattingToolbarController,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
} from "@blocknote/react";

type EditorProps = {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
  darkMode: boolean;
  editor: any;
  onCommentClick?: (selectedText: string) => void;
};

const BlockNote = memo(function BlockNote({
  doc,
  provider,
  darkMode,
  editor,
  roomId,
  onCommentClick,
}: EditorProps & { roomId: string }) {
  void doc;
  void provider;
  useSelf((me) => me.info);

  useLinkPreviewDetection(editor);

  const saveContent = useCallback(async () => {
    try {
      const editorContent =
        document.querySelector(".bn-container")?.textContent || "";

      if (editorContent.trim()) {
        const result = await saveDocumentContent(roomId, editorContent);
        if (result.success) {
          console.log("Document content saved successfully");
        }
      }
    } catch (error) {
      console.error("Error saving document content:", error);
    }
  }, [roomId]);

  const { triggerSave } = useAutoSave({
    saveFunction: saveContent,
    debounceMs: 2000,
    minIntervalMs: 30000,
  });

  useEffect(() => {
    if (!editor) return;

    const unsubscribe = editor.onChange(() => {
      triggerSave();
    });

    return unsubscribe;
  }, [editor, triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        const composerDialog = document.querySelector(
          'button:has(svg[data-lucide="pencil"])'
        ) as HTMLButtonElement;
        if (composerDialog) {
          composerDialog.click();
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === "Q") {
        e.preventDefault();
        const questionDialog = document.querySelector(
          'button:has(svg[data-lucide="help-circle"])'
        ) as HTMLButtonElement;
        if (questionDialog) {
          questionDialog.click();
        }
      }

      const menuOpen = document.querySelector(
        ".bn-suggestion-menu, [data-suggestion-menu], .bn-menu"
      );
      if (menuOpen && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        const targetInMenu = menuOpen.contains(e.target as Node);
        const menuHasFocus = menuOpen.querySelector(
          '[data-selected="true"], [aria-selected="true"], .selected'
        );
        if (targetInMenu || menuHasFocus) {
          const handleScroll = (scrollEvent: Event) => {
            scrollEvent.preventDefault();
          };
          document.addEventListener("scroll", handleScroll, {
            passive: false,
            once: true,
          });
          setTimeout(() => {
            document.removeEventListener("scroll", handleScroll);
          }, 100);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  return (
    <div className={`relative mx-auto ${darkMode ? "dark" : ""}`}>
      <BlockNoteView
        className="min-h-screen"
        editor={editor}
        theme={darkMode ? "dark" : "light"}
        formattingToolbar={false}
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              <BlockTypeSelect key="blockTypeSelect" />
              <BasicTextStyleButton
                basicTextStyle="bold"
                key="boldStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="italic"
                key="italicStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="underline"
                key="underlineStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="strike"
                key="strikeStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="code"
                key="codeStyleButton"
              />
              <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
              <TextAlignButton
                textAlignment="center"
                key="textAlignCenterButton"
              />
              <TextAlignButton
                textAlignment="right"
                key="textAlignRightButton"
              />
              <ColorStyleButton key="colorStyleButton" />
              <NestBlockButton key="nestBlockButton" />
              <UnnestBlockButton key="unnestBlockButton" />
              <CreateLinkButton key="createLinkButton" />
              <button
                className="bn-button bn-toolbar-button"
                data-test="comment-button"
                aria-label="Add Comment"
                onClick={() => {
                  const selectedText = editor?.getSelectedText() || "";
                  if (selectedText && onCommentClick) {
                    onCommentClick(selectedText);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  minWidth: "28px",
                  minHeight: "28px",
                  borderRadius: "6px",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                key="commentButton"
              >
                <MessageSquare size={18} strokeWidth={2} />
              </button>
            </FormattingToolbar>
          )}
        />
      </BlockNoteView>
    </div>
  );
});

type EditorComponentProps = {
  darkMode?: boolean;
  onEditorReady?: (editor: BlockNoteEditor | null) => void;
  onCommentClick?: (selectedText: string) => void;
  onUndoManagerReady?: (undoManager: Y.UndoManager | null) => void;
};

function Editor({
  darkMode = false,
  onEditorReady,
  onCommentClick,
  onUndoManagerReady,
}: EditorComponentProps) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  const [editor, setEditor] = useState<BlockNoteEditor<any> | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    const yFragment = yDoc.getXmlFragment("root");

    const initializeEditor = async () => {
      try {
        // Create UndoManager for the fragment
        const undoManager = new Y.UndoManager(yFragment);

        // Capture and track the PluginKey origin that BlockNote uses
        let capturedOrigin: any = null;
        yDoc.on("update", (update: Uint8Array, origin: any) => {
          // Capture the first PluginKey origin we see and add it to tracked origins
          if (
            origin &&
            typeof origin === "object" &&
            origin.key === "y-sync$" &&
            !capturedOrigin
          ) {
            capturedOrigin = origin;
            undoManager.trackedOrigins.add(origin);
          }
        });

        const schema = BlockNoteSchema.create({
          blockSpecs: {
            ...defaultBlockSpecs,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            linkPreview: LinkPreview as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            videoEmbed: VideoEmbed as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            imageEmbed: ImageEmbed as any,
          },
        });

        const blockNoteEditor = BlockNoteEditor.create({
          schema,
          collaboration: {
            fragment: yFragment,
            user: {
              name: room.getSelf()?.info?.name || "Anonymous",
              color:
                room.getSelf()?.info?.color ||
                stringToColor(room.getSelf()?.info?.email || "1"),
            },
            provider: yProvider,
          },
          _tiptapOptions: {
            editorProps: {
              attributes: {
                spellcheck: "false",
              },
            },
          },
        });

        // Send UndoManager to parent component
        onUndoManagerReady?.(undoManager);
        console.log("Sent UndoManager to parent component");

        setEditor(blockNoteEditor as BlockNoteEditor<any>);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (onEditorReady as any)?.(blockNoteEditor as any);
        setDoc(yDoc);
        setProvider(yProvider);
      } catch (error) {
        console.error("Failed to create BlockNote editor:", error);
      }
    };

    initializeEditor();

    return () => {
      onEditorReady?.(null);
      onUndoManagerReady?.(null); // Critical: notify parent that UndoManager is no longer available
      yProvider?.destroy();
      yDoc?.destroy();
    };
  }, [onEditorReady, onUndoManagerReady, room]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">
          Initializing workspace...
        </div>
      </div>
    );
  }

  if (!doc || !provider || !editor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
        </div>
        <div className="text-muted-foreground text-sm">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <TranslateDocument doc={doc} editor={editor} />
        <Summarize editor={editor} />
        <Composer editor={editor} />
        <QuestionGenerator editor={editor} />
      </div>
      <div className="pt-2">
        <BlockNote
          doc={doc}
          provider={provider}
          editor={editor}
          darkMode={darkMode}
          roomId={room.id}
          onCommentClick={onCommentClick}
        />
      </div>
    </div>
  );
}

export default Editor;
