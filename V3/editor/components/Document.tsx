'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useDocumentData } from "react-firebase-hooks/firestore";
import useOwner from "@/lib/useOwner";
import Editor from "./Editor";
import DeleteDocument from "./DeleteDocument";
import InviteUser from "./InviteUser";
import ManageUsers from "./ManageUsers";
import Avatars from "./Avatars";
import { Crown, User, MoonIcon, SunIcon } from "lucide-react";
import { updateLastOpened } from "@/actions/actions";
import TranslateDocument from "./TranslateDocument";

function Document({ id }: { id: string }) {
    const [data, loading, error] = useDocumentData(doc(db, "documents", id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const isOwner = useOwner();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (data) {
            setInput(data.title);
        }
    }, [data]);
    
    // Update last opened timestamp when document is loaded
    useEffect(() => {
        if (id) {
            startTransition(async () => {
                await updateLastOpened(id);
            });
        }
    }, [id]);
    
    // Apply dark mode to body
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }

        return () => {
            document.body.classList.remove('dark');
        };
    }, [darkMode]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500 dark:text-gray-400 text-lg">Loading document...</div>
        </div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-red-500 dark:text-red-400 text-lg">Error loading document: {error.message}</div>
        </div>;
    }

    if (!data) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500 dark:text-gray-400 text-lg">Document not found</div>
        </div>;
    }

    const updateTitle = (e: FormEvent) => {
        e.preventDefault();

        if (input.trim()) {
            startTransition(async () => {
                await updateDoc(doc(db, "documents", id), {
                    title: input,
                });
            })
        }
    }

    return (
        <div className="min-h-screen w-full bg-white dark:bg-[#020618] transition-colors duration-200">
            {/* Header with document controls */}
            <header className="sticky top-0 z-10 bg-white/90 dark:bg-[#020618]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                <div className="w-full">
                    <div className="flex items-center justify-between gap-4">
                        {/* Document title form */}
                        <form className="flex-1 flex items-center gap-2" onSubmit={updateTitle}>
                            <Input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                className="font-medium text-xl border-transparent focus-visible:ring-0 focus-visible:border-transparent bg-transparent px-1 py-1 h-auto w-full max-w-md"
                                placeholder="Untitled"
                            />
                            <Button 
                                disabled={isUpdating} 
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {isUpdating ? "Saving..." : "Save"}
                            </Button>
                        </form>
                        
                        {/* Document controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-md">
                                {isOwner ? (
                                    <div className="flex items-center gap-1.5">
                                        <Crown size={14} className="text-amber-500" />
                                        <span className="font-medium">Owner</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <User size={14} className="text-blue-500" />
                                        <span className="font-medium">Editor</span>
                                    </div>
                                )}
                            </div>
                            <ManageUsers />
                            <InviteUser />
                            <DeleteDocument />
                        </div>
                    </div>
                    
                    {/* Collaboration info */}
                    <div className="flex justify-end mt-2 items-center">
                        <Button
                            className={`${darkMode ? 
                                "text-gray-100 bg-gray-800/90 hover:bg-gray-700/90 border-gray-700" : 
                                "text-gray-700 bg-white/90 hover:bg-gray-50/90 border-gray-200"} 
                                border rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm transition-all duration-200 backdrop-blur-sm mr-3`}
                            onClick={() => setDarkMode(!darkMode)}
                            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {darkMode ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                        </Button>
                        <Avatars />
                    </div>
                </div>
            </header>

            {/* Main editor area with proper padding */}
            <main className="w-full px-5 py-6">
                <Editor darkMode={darkMode} />
            </main>
        </div>
    )
}

export default Document