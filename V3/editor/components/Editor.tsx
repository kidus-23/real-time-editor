'use client'

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useState, useEffect, useMemo } from "react";
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

type EditorProps = {
  doc: Y.Doc;
  provider: LiveblocksYjsProvider;
  darkMode: boolean;
  editor: BlockNoteEditor;
};

function BlockNote({ doc, provider, darkMode, editor }: EditorProps) {
  const userInfo = useSelf((me) => me.info);

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
  }, []);

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
        <BlockNote doc={doc} provider={provider} editor={editor} darkMode={darkMode} />
      </div>
    </div>
  );
}

export default Editor;