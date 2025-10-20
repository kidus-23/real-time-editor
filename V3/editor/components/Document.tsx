'use client';

import { FormEvent, useEffect, useState, useTransition, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button";
import { doc, updateDoc, setDoc, collection, Timestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useDocumentData } from "react-firebase-hooks/firestore";
import useOwner from "@/lib/useOwner";
import Editor from "./Editor";
import DeleteDocument from "./DeleteDocument";
import InviteUser from "./InviteUser";
import ManageUsers from "./ManageUsers";
import Avatars from "./Avatars";
import { Crown, MoreHorizontal, User, X, Plus, Wand2, MessageSquare } from "lucide-react";
import { generateTags } from "@/actions/actions";
import { updateLastOpened } from "@/actions/actions";
import { useTheme } from "next-themes";
import CommentsSidebar from "./CommentsSidebar";
import AddCommentDialog from "./AddCommentDialog";
import { query, where, onSnapshot } from "firebase/firestore";
import { Comment } from "@/types/comment";
import stringToColor from "@/lib/stringToColor";
import { useUser } from "@clerk/nextjs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ImportExportMenu from "./ImportExportMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { BlockNoteEditor } from "@blocknote/core";

type FirestoreDocument = {
    title?: string;
    content?: string;
    tags?: string[];
    [key: string]: unknown;
};

function Document({ id, initialData }: { id: string; initialData?: FirestoreDocument | null }) {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const [liveData, loading, error] = useDocumentData(doc(db, "documents", id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const [newTag, setNewTag] = useState("");
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
    const [isAddCommentDialogOpen, setIsAddCommentDialogOpen] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [activeCommentsCount, setActiveCommentsCount] = useState(0);
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
    const [lastSavedContent, setLastSavedContent] = useState("");
    const [lastSavedTitle, setLastSavedTitle] = useState("");
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isOwner = useOwner();
    const { theme } = useTheme();
    const { user } = useUser();
    const { t } = useTranslation();
    const [blockEditor, setBlockEditor] = useState<BlockNoteEditor | null>(null);

    // Use initialData for immediate rendering, fall back to liveData
    const data = liveData ?? initialData ?? null;

    // Handler for comment button click in formatting toolbar
    const handleCommentClick = useCallback((text: string) => {
        setSelectedText(text);
        setIsAddCommentDialogOpen(true);
    }, []);

    useEffect(() => {
        if (typeof data?.title === "string") {
            setInput(data.title);
        }
    }, [data?.title]);

    // Track active comments count with optimized query
    useEffect(() => {
        if (!id) return;

        const commentsRef = collection(db, "documents", id, "comments");
        const q = query(
            commentsRef,
            where("resolved", "==", false),
            // Add limit to prevent loading too many comments at once
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                setActiveCommentsCount(snapshot.size);

                // Also store all comments for highlighting (memoized)
                const comments: Comment[] = [];
                snapshot.forEach((doc) => {
                    comments.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Comment);
                });
                setAllComments(comments);
            },
            (error) => {
                console.error("Error fetching comments:", error);
                // Fallback to 0 if error occurs
                setActiveCommentsCount(0);
            }
        );

        return () => unsubscribe();
    }, [id]);

    // Update last opened timestamp when document is loaded
    useEffect(() => {
        if (id) {
            startTransition(async () => {
                await updateLastOpened(id);
            });
        }
    }, [id]);

    // Auto-save snapshots every 5 minutes when content changes
    useEffect(() => {
        if (!data || !user) return;

        const currentContent = typeof data.content === "string" ? data.content : "";
        const currentTitle = typeof data.title === "string" ? data.title : "";

        // Store initial content
        setLastSavedContent(currentContent);
        setLastSavedTitle(currentTitle);

        // Set up auto-save timer
        const autoSaveInterval = 5 * 60 * 1000; // 5 minutes

        const createSnapshot = async () => {
            // Only create snapshot if content has changed
            if (currentContent !== lastSavedContent || currentTitle !== lastSavedTitle) {
                try {
                    // Create a new version in the versions subcollection
                    const versionRef = doc(collection(db, "documents", id, "versions"));
                    await setDoc(versionRef, {
                        content: lastSavedContent,
                        title: lastSavedTitle,
                        timestamp: Timestamp.now(),
                        userId: user.id,
                        userName: user.fullName || user.username || user.id
                    });

                    // Update saved content reference
                    setLastSavedContent(currentContent);
                    setLastSavedTitle(currentTitle);

                    console.log("Auto-saved document snapshot");
                } catch (error) {
                    console.error("Error creating snapshot:", error);
                }
            }
        };

        // Clear any existing timer
        if (autoSaveTimerRef.current) {
            clearInterval(autoSaveTimerRef.current);
        }

        // Set new timer
        autoSaveTimerRef.current = setInterval(createSnapshot, autoSaveInterval);

        // Cleanup on unmount
        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [id, data?.content, data?.title, user, lastSavedContent, lastSavedTitle]);

    // Clean up old versions (older than 7 days) on component mount
    useEffect(() => {
        const cleanupOldVersions = async () => {
            if (!id) return;

            try {
                const versionsRef = collection(db, "documents", id, "versions");
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const q = query(versionsRef, where("timestamp", "<", Timestamp.fromDate(sevenDaysAgo)));
                const snapshot = await getDocs(q);

                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });

                console.log(`Cleaned up ${snapshot.size} old versions`);
            } catch (error) {
                console.error("Error cleaning up old versions:", error);
            }
        };

        cleanupOldVersions();
    }, [id]);

    // Highlight text in the editor when a comment is selected
    useEffect(() => {
        if (!highlightedCommentId) {
            // Remove all highlights
            document.querySelectorAll('.comment-highlight-active').forEach(el => {
                el.classList.remove('comment-highlight-active');
            });
            return;
        }

        const comment = allComments.find(c => c.id === highlightedCommentId);
        if (!comment) return;

        // Find and highlight the text in the editor
        const editorElement = document.querySelector('.bn-container');
        if (!editorElement) return;

        const textNodes: Node[] = [];
        const walker = document.createTreeWalker(
            editorElement,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        // Search for the commented text
        const searchText = comment.highlightedText;

        for (const textNode of textNodes) {
            const text = textNode.textContent || '';
            const index = text.indexOf(searchText);

            if (index !== -1 && textNode.parentElement) {
                // Scroll to the element
                textNode.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add flash highlight class
                const parentEl = textNode.parentElement;
                parentEl.classList.add('comment-highlight-active');

                // Remove highlight after animation completes (3 seconds)
                setTimeout(() => {
                    parentEl.classList.remove('comment-highlight-active');
                    parentEl.style.backgroundColor = '';
                    parentEl.style.borderLeft = '';
                    parentEl.style.paddingLeft = '';
                    setHighlightedCommentId(null);
                }, 3000);

                break;
            }
        }
    }, [highlightedCommentId, allComments]);

    // NOW safe to do conditional returns after all hooks are called
    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                </div>
                <div className="text-muted-foreground text-sm font-medium">{t("document.status.loading")}</div>
            </div>
        );
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-red-500 dark:text-red-400 text-lg">{t("document.status.errorWithMessage", { message: error.message })}</div>
        </div>;
    }

    if (!data) {
        return <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500 dark:text-gray-400 text-lg">{t("document.status.notFound")}</div>
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
            // Optimistic UI update
            startTransition(async () => {
                await updateDoc(doc(db, "documents", id), { tags: newTags });
            });
            setNewTag("");
        }
    };

    const handleRemoveTag = async (index: number) => {
        const newTags = (data.tags || []).filter((_: string, i: number) => i !== index);
        // Optimistic UI update
        startTransition(async () => {
            await updateDoc(doc(db, "documents", id), { tags: newTags });
        });
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
                        <form className="flex-1 flex items-center gap-2 group" onSubmit={updateTitle}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="font-medium text-xl border-transparent focus-visible:ring-0 focus-visible:border-transparent bg-transparent px-1 py-1 h-auto w-full max-w-md"
                                placeholder={t("document.placeholders.title")}
                            />
                            <Button
                                disabled={isUpdating}
                                type="submit"
                                variant="outline"
                                size="sm"
                            >
                                {isUpdating ? t("document.actions.saving") : t("document.actions.save")}
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
                                    placeholder={t("document.placeholders.addTag")}
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
                                title={t("document.actions.generateTagsTitle")}
                            >
                                <Wand2 size={14} className={isGeneratingTags ? 'animate-pulse' : ''} />
                            </Button>
                        </div>

                        {/* Document controls */}
                        <div className="flex items-center gap-3">
                            <ImportExportMenu editor={blockEditor} />

                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-md">
                                {isOwner ? (
                                    <div className="flex items-center gap-1.5">
                                        <Crown size={14} className="text-amber-500" />
                                        <span className="font-medium">{t("document.roles.owner")}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <User size={14} className="text-blue-500" />
                                        <span className="font-medium">{t("document.roles.editor")}</span>
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
                                    <DropdownMenuItem onSelect={() => setIsCommentsSidebarOpen(true)}>
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                {t("document.actions.viewComments")}
                                            </div>
                                            {activeCommentsCount > 0 && (
                                                <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                    {activeCommentsCount}
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => window.location.href = `/doc/${id}/history`}>
                                        {t("document.menu.versionHistory")}
                                    </DropdownMenuItem>
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
            <main className="w-full px-5 py-6 relative">
                <Editor darkMode={theme === 'dark'} onEditorReady={setBlockEditor} onCommentClick={handleCommentClick} />
            </main>

            {/* Comment Components */}
            <CommentsSidebar
                isOpen={isCommentsSidebarOpen}
                onClose={() => setIsCommentsSidebarOpen(false)}
                roomId={id}
                onCommentClick={(commentId) => {
                    setHighlightedCommentId(commentId);
                    setIsCommentsSidebarOpen(false);
                }}
            />

            <AddCommentDialog
                isOpen={isAddCommentDialogOpen}
                onClose={() => {
                    setIsAddCommentDialogOpen(false);
                    setSelectedText("");
                }}
                roomId={id}
                selectedText={selectedText}
            />
        </div>
    )
}

export default Document