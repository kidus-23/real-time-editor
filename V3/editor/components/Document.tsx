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
import { Crown, MoreHorizontal, User, X, Plus, Wand2 } from "lucide-react";
import { generateTags } from "@/actions/actions";
import { updateLastOpened } from "@/actions/actions";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function Document({ id }: { id: string }) {
    const [data, loading, error] = useDocumentData(doc(db, "documents", id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const [newTag, setNewTag] = useState("");
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const isOwner = useOwner();
    const { theme } = useTheme();

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

    const handleAddTag = async (e: FormEvent) => {
        e.preventDefault();
        if (newTag.trim()) {
            const newTags = [...(data.tags || []), newTag.trim()];
            await updateDoc(doc(db, "documents", id), { tags: newTags });
            setNewTag("");
        }
    };

    const handleRemoveTag = async (index: number) => {
        const newTags = (data.tags || []).filter((_: string, i: number) => i !== index);
        await updateDoc(doc(db, "documents", id), { tags: newTags });
    };

    const handleGenerateTags = async () => {
        if (!data?.content) return;
        
        setIsGeneratingTags(true);
        try {
            const result = await generateTags(id, data.content);
            if (!result.success) {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to generate tags:', error);
        } finally {
            setIsGeneratingTags(false);
        }
    };

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

                        {/* Tags display and management */}
                        <div className="flex items-center gap-2 overflow-x-auto max-w-md">
                            {data.tags?.map((tag: string, index: number) => (
                                <div key={index} className='flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm'>
                                    <span>{tag}</span>
                                    <button
                                        onClick={() => handleRemoveTag(index)}
                                        className='text-gray-500 hover:text-red-500 transition-colors'
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add new tag input */}
                            <form
                                onSubmit={handleAddTag}
                                className='flex items-center gap-1'
                            >
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add tag..."
                                    className="h-7 w-24 text-sm"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                >
                                    <Plus size={14} />
                                </Button>
                            </form>
                            <Button
                                onClick={handleGenerateTags}
                                disabled={isGeneratingTags}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-blue-500 hover:text-blue-600 transition-colors"
                                title="Generate tags with AI"
                            >
                                <Wand2 size={14} className={isGeneratingTags ? 'animate-pulse' : ''} />
                            </Button>
                        </div>

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
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <ManageUsers />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <InviteUser />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive">
                                        <DeleteDocument />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Avatars />
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Collaboration info */}
                </div>
            </header>

            {/* Main editor area with proper padding */}
            <main className="w-full px-5 py-6">
                <Editor darkMode={theme === 'dark'} />
            </main>
        </div>
    )
}

export default Document