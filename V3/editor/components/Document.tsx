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
import { Crown, MoreHorizontal, User, X, Plus, Wand2, MessageSquare, ChevronRight, Clock, FileText, Users2, UserPlus, Users, Trash2, Tag, Maximize2, Minimize2 } from "lucide-react";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { useZenMode } from "@/contexts/ZenModeContext";

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
    const { zenMode, setZenMode } = useZenMode();

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
        if (!data?.content) {
            console.error('No content available to generate tags');
            return;
        }

        if (!id) {
            console.error('Document ID is required');
            return;
        }

        setIsGeneratingTags(true);
        try {
            const contentToAnalyze = data.content;
            const result = await generateTags(id, contentToAnalyze);

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate tags');
            }

            // Show success message and update UI
            console.log('Tags generated successfully:', result.tags);

            // Update document with new tags directly
            const newTags = result.tags;
            if (Array.isArray(newTags)) {
                startTransition(async () => {
                    await updateDoc(doc(db, "documents", id), {
                        tags: newTags
                    });
                });
            }
        } catch (error) {
            console.error('Failed to generate tags:', error);
            // Reset generating state
            setIsGeneratingTags(false);
            return;
        }

        setIsGeneratingTags(false);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0f0f0f] dark:via-[#1a1a2e] dark:to-[#0f0f0f] transition-colors duration-300">
            {/* Header with document controls */}
            <header className={`sticky top-0 z-10 glass-intense border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4 transition-all duration-300 ${zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="w-full">
                    <div className="flex items-center justify-between gap-4">
                        {/* Document title form */}
                        <form className="flex-1 flex items-center gap-3 group" onSubmit={updateTitle}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="font-semibold text-2xl border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-0 bg-transparent px-4 py-3 h-auto w-full max-w-2xl tracking-tight transition-all rounded-xl"
                                placeholder={t("document.placeholders.title")}
                            />
                            <Button
                                disabled={isUpdating}
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-all hover-scale rounded-xl"
                            >
                                {isUpdating ? t("document.actions.saving") : t("document.actions.save")}
                            </Button>
                        </form>

                        {/* Document controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 glass px-3 py-2 rounded-xl border-0">
                                {isOwner ? (
                                    <div className="flex items-center gap-2">
                                        <Crown size={15} className="text-amber-500 dark:text-amber-400" />
                                        <span className="font-semibold">{t("document.roles.owner")}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <User size={15} className="text-blue-600 dark:text-blue-400" />
                                        <span className="font-semibold">{t("document.roles.editor")}</span>
                                    </div>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover-scale rounded-xl">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {/* User Management */}
                                    <DropdownMenuItem>
                                        <div className="flex items-center gap-2 w-full">
                                            <Users2 className="h-4 w-4" />
                                            <ManageUsers />
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem>
                                        <div className="flex items-center gap-2 w-full">
                                            <UserPlus className="h-4 w-4" />
                                            <InviteUser />
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem>
                                        <div className="flex items-center gap-2 w-full">
                                            <Users className="h-4 w-4" />
                                            <Avatars />
                                        </div>
                                    </DropdownMenuItem>

                                    {/* Delete Document (Destructive Action) */}
                                    <DropdownMenuItem variant="destructive">
                                        <div className="flex items-center gap-2 w-full">
                                            <Trash2 className="h-4 w-4" />
                                            <DeleteDocument />
                                        </div>
                                    </DropdownMenuItem>

                                    {/* Comments */}
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

                                    {/* Version History */}
                                    <DropdownMenuItem onSelect={() => window.location.href = `/doc/${id}/history`}>
                                        <div className="flex items-center gap-2 w-full">
                                            <Clock className="h-4 w-4" />
                                            {t("document.menu.versionHistory")}
                                        </div>
                                    </DropdownMenuItem>

                                    {/* Import/Export - Direct to Dialog */}
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <div className="flex items-center gap-2 w-full">
                                            <FileText className="h-4 w-4" />
                                            <ImportExportMenu editor={blockEditor} asMenuItem />
                                        </div>
                                    </DropdownMenuItem>

                                    {/* Document Tags Submenu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <DropdownMenuItem>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4" />
                                                        <span>{t("documentTags.title")}</span>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="right" className="w-56">
                                            {data.tags && data.tags.length > 0 ? (
                                                data.tags.map((tag: string, index: number) => (
                                                    <DropdownMenuItem key={index} onSelect={(e) => e.preventDefault()}>
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{tag}</span>
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveTag(index);
                                                                }}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 hover:text-red-500"
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))
                                            ) : (
                                                <DropdownMenuItem disabled>
                                                    <span className="text-muted-foreground">{t("documentTags.noTags")}</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent hover:bg-transparent">
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (newTag.trim()) {
                                                            handleAddTag(e);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Input
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        placeholder={t("documentTags.addPlaceholder")}
                                                        className="h-7"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') {
                                                                e.stopPropagation();
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        disabled={!newTag.trim()}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Plus size={14} />
                                                    </Button>
                                                </form>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    handleGenerateTags();
                                                }}
                                                disabled={isGeneratingTags || !data?.content}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Wand2 size={14} className={isGeneratingTags ? 'animate-pulse' : ''} />
                                                    <span>
                                                        {isGeneratingTags
                                                            ? t("documentTags.generating")
                                                            : !data?.content
                                                                ? t("documentTags.addContentFirst")
                                                                : t("documentTags.generateButton")
                                                        }
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Collaboration info */}
                </div>
            </header>

            {/* Floating Zen Mode Toggle Button - Top Right */}
            <div className={`fixed ${zenMode ? 'top-6' : 'top-40'} right-6 z-50 transition-all duration-300`}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setZenMode(!zenMode)}
                                variant="ghost"
                                size="icon"
                                className="glass-intense hover-scale hover-lift rounded-2xl"
                            >
                                {zenMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="glass-intense border-0">
                            <p className="font-medium">{zenMode ? t("zenMode.exit") : t("zenMode.enter")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Main editor area with proper padding */}
            <main className="w-full px-6 md:px-12 py-8 relative max-w-5xl mx-auto">
                <div className="glass-intense rounded-3xl p-8 md:p-12 min-h-[70vh] animate-fade-in">
                    <Editor darkMode={theme === 'dark'} onEditorReady={setBlockEditor} onCommentClick={handleCommentClick} />
                </div>
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