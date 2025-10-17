'use client'

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import stringToColor from "@/lib/stringToColor";
import { BlockNoteEditor } from "@blocknote/core";
import TranslateDocument from "./TranslateDocument";
import Summarize from "./Summarize";
import Composer from "./Composer";
import QuestionGenerator from "./QuestionGenerator";
import { saveDocumentContent } from "@/actions/actions";

type EditorProps = {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
  darkMode: boolean;
  editor: BlockNoteEditor;
};

function BlockNote({ doc, provider, darkMode, editor, roomId }: EditorProps & { roomId: string }) {
  const userInfo = useSelf((me) => me.info);

  // Add state to track content changes
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
  const [contentChanged, setContentChanged] = useState<boolean>(false);

  // Memoize collaboration config to prevent unnecessary re-renders
  const collaborationConfig = useMemo(
    () => ({
      fragment: doc.getXmlFragment("root"),
      user: {
        name: userInfo?.name || "Anonymous",
        color: userInfo?.color || stringToColor(userInfo?.email || "1"),
      },
      provider,
    }),
    [doc, provider, userInfo?.name, userInfo?.email, userInfo?.color]
  );

  // Debounced save function for better performance
  const saveContent = useCallback(async () => {
    try {
      // Get document content from DOM similar to Chatbar component
      const editorContent = document.querySelector('.bn-container')?.textContent || '';

      if (editorContent.trim()) {
        const result = await saveDocumentContent(roomId, editorContent);
        if (result.success) {
          setLastSaveTime(Date.now());
          setContentChanged(false);
          console.log('Document content saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving document content:', error);
    }
  }, [roomId]);

  // Save content periodically if changed
  useEffect(() => {
    if (!contentChanged) return;

    // Save content every 30 seconds if there are changes
    const saveInterval = setInterval(() => {
      if (contentChanged && Date.now() - lastSaveTime > 30000) {
        saveContent();
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [contentChanged, lastSaveTime, roomId, saveContent]);

  // Save content when editor changes are detected
  useEffect(() => {
    if (!editor) return;

    // Listen for changes in the editor
    const handleEditorChange = () => {
      setContentChanged(true);
    };

    // Subscribe to editor changes
    editor.onChange(handleEditorChange);

    // No cleanup needed as BlockNote handles this internally
    return () => { };
  }, [editor]);

  // Save content when window is closed/refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (contentChanged) {
        saveContent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      if (contentChanged) {
        saveContent();
      }
    };
  }, [contentChanged, saveContent]);

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

      // Undo: Ctrl + Z
      if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        // Check if the target is an input or textarea element
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isFormElement = tagName === 'input' || tagName === 'textarea';

        // Only prevent default and handle undo if not in a form element
        if (!isFormElement) {
          e.preventDefault();
          if (editor) {
            try {
              editor.undo();
              console.log('Undo executed');
            } catch (error) {
              console.error('Error during undo:', error);
            }
          }
        }
      }

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        // Check if the target is an input or textarea element
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isFormElement = tagName === 'input' || tagName === 'textarea';

        // Only prevent default and handle redo if not in a form element
        if (!isFormElement) {
          e.preventDefault();
          if (editor) {
            try {
              editor.redo();
              console.log('Redo executed');
            } catch (error) {
              console.error('Error during redo:', error);
            }
          }
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
        className="min-h-screen"
        editor={editor}
        theme={darkMode ? "dark" : "light"}
      />
    </div>
  );
}

function Editor({ darkMode = false }: { darkMode?: boolean }) {
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);

    const initializeEditor = async () => {
      try {
        const blockNoteEditor = await BlockNoteEditor.create({
          collaboration: {
            fragment: yDoc.getXmlFragment("root"),
            user: {
              name: room.getSelf()?.info?.name || "Anonymous",
              color: room.getSelf()?.info?.color || stringToColor(room.getSelf()?.info?.email || "1"),
            },
            provider: yProvider,
          },
        });
        setEditor(blockNoteEditor);
        setDoc(yDoc);
        setProvider(yProvider);
      } catch (error) {
        console.error("Failed to create BlockNote editor:", error);
      }
    };

    initializeEditor();

    return () => {
      yProvider?.destroy();
      yDoc?.destroy();
    };
  }, [room]);

  if (!room) {
    return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">No room available</div>;
  }

  if (!doc || !provider || !editor) {
    return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">Loading editor...</div>;
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
        <BlockNote doc={doc} provider={provider} editor={editor} darkMode={darkMode} roomId={room.id} />
      </div>
    </div>
  );
}

export default Editor;