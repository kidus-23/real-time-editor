'use client'

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useState, useEffect, useMemo } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css"
import "@blocknote/core/fonts/inter.css"
import { useCreateBlockNote } from "@blocknote/react";
import stringToColor from "@/lib/stringToColor";
import { BlockNoteEditor } from "@blocknote/core";
import TranslateDocument from "./TranslateDocument";

type EditorProps = {
    doc: Y.Doc;
    provider: LiveblocksYjsProvider;
    darkMode: boolean;
}
function BlockNote({ doc, provider, darkMode }: EditorProps) {
    const userInfo = useSelf((me) => me.info);

    // Memoize the collaboration config to prevent unnecessary re-creations
    const collaborationConfig = useMemo(() => ({
        fragment: doc.getXmlFragment("root"),
        user: {
            name: userInfo?.name || "Anonymous",
            color: userInfo?.color || stringToColor(userInfo?.email || "1"),
        },
        provider,
    }), [doc, provider, userInfo?.name, userInfo?.email, userInfo?.color]);

    const editor: BlockNoteEditor = useCreateBlockNote({
        collaboration: collaborationConfig,
    });

    // Prevent page scrolling when slash command menu is open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if slash command menu is open and visible
            const menuOpen = document.querySelector('.bn-suggestion-menu, [data-suggestion-menu], .bn-menu');

            if (menuOpen && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                // Only intercept if the event target is within the menu or if menu has focus
                const targetInMenu = menuOpen.contains(e.target as Node);
                const menuHasFocus = menuOpen.querySelector('[data-selected="true"], [aria-selected="true"], .selected');

                // Check if the menu is actually being navigated (has a selected item)
                if (targetInMenu || menuHasFocus) {
                    // Only prevent page scrolling, not the arrow key functionality
                    const handleScroll = (scrollEvent: Event) => {
                        scrollEvent.preventDefault();
                    };

                    // Temporarily prevent page scroll
                    document.addEventListener('scroll', handleScroll, { passive: false, once: true });

                    // Clean up after a short delay
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
    )
}

function Editor({ darkMode = false }: { darkMode?: boolean }) {
    const room = useRoom();
    const [doc, setdoc] = useState<Y.Doc>()
    const [provider, setProvider] = useState<LiveblocksYjsProvider>()

    useEffect(() => {
        if (!room) {
            return;
        }

        const yDoc = new Y.Doc();
        const yProvider = new LiveblocksYjsProvider(room, yDoc);
        setdoc(yDoc);
        setProvider(yProvider);

        return () => {
            yProvider?.destroy();
            yDoc?.destroy();
        }
    }, [room]);

    // Dark mode is now managed by the parent Document component

    if (!room) {
        return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">No room available</div>;
    }

    if (!doc || !provider) {
        return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">Loading editor...</div>;
    }

    return (
        <div className="relative">
            <TranslateDocument doc={doc} />
            {/* Editor content */}
            <div className="pt-2">
                <BlockNote doc={doc} provider={provider} darkMode={darkMode} />
            </div>
        </div>
    )
} export default Editor;