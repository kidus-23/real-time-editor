'use client'

import { useRoom } from "@liveblocks/react/suspense";
import { useState, useEffect, useCallback, memo } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import stringToColor from "@/lib/stringToColor";
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
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
  editor: BlockNoteEditor;
  onCommentClick?: (selectedText: string) => void;
};

const BlockNote = memo(function BlockNote({ darkMode, editor, roomId, onCommentClick }: Omit<EditorProps, 'doc' | 'provider'> & { roomId: string }) {

  // Enable automatic link preview detection
  useLinkPreviewDetection(editor);

  // Memoize save function
  const saveContent = useCallback(async () => {
    try {
      // Get document content from DOM similar to Chatbar component
      const editorContent = document.querySelector('.bn-container')?.textContent || '';

      if (editorContent.trim()) {
        const result = await saveDocumentContent(roomId, editorContent);
        if (result.success) {
          console.log('Document content saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving document content:', error);
    }
  }, [roomId]);

  // Use unified auto-save hook with 2s debounce
  const { triggerSave } = useAutoSave({
    saveFunction: saveContent,
    debounceMs: 2000,    // Save 2 seconds after typing stops
    minIntervalMs: 30000 // Minimum 30 seconds between saves
  });

  // Trigger save when editor changes
  useEffect(() => {
    if (!editor) return;

    // Subscribe to editor changes
    const unsubscribe = editor.onChange(() => {
      triggerSave();
    });

    return unsubscribe;
  }, [editor, triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut for AI Composer: Ctrl + Shift + C
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const composerDialog = document.querySelector('button:has(svg[data-lucide="pencil"])') as HTMLButtonElement;
        if (composerDialog) {
          composerDialog.click();
        }
      }
      // Shortcut for Question Generator: Ctrl + Shift + Q
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        const questionDialog = document.querySelector('button:has(svg[data-lucide="help-circle"])') as HTMLButtonElement;
        if (questionDialog) {
          questionDialog.click();
        }
      }

      // Markdown shortcut: '---' + Enter creates horizontal divider
      if (e.key === 'Enter' && editor) {
        const currentBlock = editor.getTextCursorPosition().block;
        const blockContent = Array.isArray(currentBlock?.content) 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? currentBlock.content.map((c: any) => c.text || '').join('') 
          : '';
        
        if (blockContent.trim() === '---') {
          e.preventDefault();
          // Replace current block with a divider (using a paragraph with special styling)
          editor.updateBlock(currentBlock, {
            type: 'paragraph',
            content: [{ type: 'text', text: '─'.repeat(50), styles: { textColor: 'gray' } }],
          });
          // Insert a new paragraph below for continued typing
          editor.insertBlocks(
            [{ type: 'paragraph' }],
            editor.getTextCursorPosition().block,
            'after'
          );
        }
      }

      // Handle BlockNote suggestion menu scrolling
      const menuOpen = document.querySelector('.bn-suggestion-menu, [data-suggestion-menu], .bn-menu');
      if (menuOpen && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const targetInMenu = menuOpen.contains(e.target as Node);
        const menuHasFocus = menuOpen.querySelector('[data-selected="true"], [aria-selected="true"], .selected');
        if (targetInMenu || menuHasFocus) {
          const handleScroll = (scrollEvent: Event) => {
            scrollEvent.preventDefault();
          };
          document.addEventListener('scroll', handleScroll, { passive: false, once: true });
          setTimeout(() => {
            document.removeEventListener('scroll', handleScroll);
          }, 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  return (
    <div className={`relative mx-auto ${darkMode ? 'dark' : ''}`}>
      <BlockNoteView
        className="min-h-[60vh] notion-editor"
        editor={editor}
        theme={darkMode ? "dark" : "light"}
        formattingToolbar={false}
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar>
              <BlockTypeSelect key="blockTypeSelect" />
              <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
              <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
              <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
              <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
              <BasicTextStyleButton basicTextStyle="code" key="codeStyleButton" />
              <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
              <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
              <TextAlignButton textAlignment="right" key="textAlignRightButton" />
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
};

function Editor({ darkMode = false, onEditorReady, onCommentClick }: EditorComponentProps) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editor, setEditor] = useState<BlockNoteEditor<any> | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);

    const initializeEditor = async () => {
      try {
        // Create custom block schema with link preview and improved video/image blocks
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
            fragment: yDoc.getXmlFragment("root"),
            user: {
              name: room.getSelf()?.info?.name || "Anonymous",
              color: room.getSelf()?.info?.color || stringToColor(room.getSelf()?.info?.email || "1"),
            },
            provider: yProvider,
          },
          // Enable default keyboard shortcuts including undo/redo
          _tiptapOptions: {
            editorProps: {
              attributes: {
                spellcheck: 'false',
              },
            },
          },
        });
        setEditor(blockNoteEditor);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEditorReady?.(blockNoteEditor as any);
        setDoc(yDoc);
        setProvider(yProvider);
      } catch (error) {
        console.error("Failed to create BlockNote editor:", error);
      }
    };

    initializeEditor();

    return () => {
      onEditorReady?.(null);
      yProvider?.destroy();
      yDoc?.destroy();
    };
  }, [onEditorReady, room]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Initializing workspace...</div>
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
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
        <TranslateDocument doc={doc} editor={editor} />
        <Summarize editor={editor} />
        <Composer editor={editor} />
        <QuestionGenerator editor={editor} />
      </div>
      <div className="pt-4">
        <BlockNote editor={editor} darkMode={darkMode} roomId={room.id} onCommentClick={onCommentClick} />
      </div>
    </div>
  );
}

export default Editor;