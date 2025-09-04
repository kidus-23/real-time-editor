'use client'

import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { useState, useEffect } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./ui/button";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css"
import "@blocknote/core/fonts/inter.css"
import { useCreateBlockNote } from "@blocknote/react";
import stringToColor from "@/lib/stringToColor";
import { BlockNoteEditor } from "@blocknote/core";

type EditorProps = {
    doc: Y.Doc;
    provider: LiveblocksYjsProvider;
    darkMode: boolean;
}
function BlockNote({ doc, provider, darkMode }: EditorProps) {
    const userInfo = useSelf((me) => me.info);

    const editor: BlockNoteEditor = useCreateBlockNote({
        collaboration: {
            fragment: doc.getXmlFragment("root"),
            user: {
                name: userInfo?.name,
                color: stringToColor(userInfo?.email || "1"),
            },
            provider,
        },
    })
    return (
        <div className="relative max-w-6xl mx-auto">
            <BlockNoteView
                className="min-h-screen"
                editor={editor}
                theme={darkMode ? "dark" : "light"}
            />
        </div>
    )
}

function Editor() {
    const room = useRoom();
    const [doc, setdoc] = useState<Y.Doc>()
    const [provider, setProvider] = useState<LiveblocksYjsProvider>()
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const yDoc = new Y.Doc();
        const yProvider = new LiveblocksYjsProvider(room, yDoc);
        setdoc(yDoc);
        setProvider(yProvider);

        return () => {
            yProvider?.destroy();
            yDoc?.destroy();
        }
    }, [room]);
    if (!doc || !provider) {
        return null;
    }

    const style = `hover:text-white ${darkMode ?
        "text-gray-300 bg-gray-700 hover:text-gray-700 hover:bg-gray-100" :
        "text-gray-700 bg-gray-300 hover:text-gray-300 hover:bg-gray-700"}`;
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 justify-end mb-10">
                {/*Summerization/Translation AI*/}
                {/*Chat to doc AI*/}

                {/*Dark Mode*/}
                <Button className={style} onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <SunIcon /> : <MoonIcon />}
                </Button>


            </div>

            {/*Block Notes*/}
               <BlockNote doc={doc} provider={provider} darkMode={darkMode} />

        </div>
    )
}

export default Editor;