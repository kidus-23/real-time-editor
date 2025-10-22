"use client";

import {
  FormEvent,
  useEffect,
  useState,
  useTransition,
  useCallback,
  useRef,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import {
  doc,
  updateDoc,
  setDoc,
  collection,
  Timestamp,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useDocumentData } from "react-firebase-hooks/firestore";
import useOwner from "@/lib/useOwner";
import Editor from "./Editor";
import DeleteDocument from "./DeleteDocument";
import InviteUser from "./InviteUser";
import ManageUsers from "./ManageUsers";
import Avatars from "./Avatars";
import {
  Crown,
  MoreHorizontal,
  User,
  X,
  Plus,
  Wand2,
  MessageSquare,
  ChevronRight,
  Clock,
  FileText,
  Users2,
  UserPlus,
  Users,
  Trash2, Maximize2, Minimize2, Expand, List,
  Undo,
  Redo,
} from "lucide-react";
import { generateTags } from "@/actions/actions";
import { updateLastOpened } from "@/actions/actions";
import { useTheme } from "next-themes";
import CommentsSidebar from "./CommentsSidebar";
import AddCommentDialog from "./AddCommentDialog";
import InlineTableOfContents from "./InlineTableOfContents";
import { query, where, onSnapshot } from "firebase/firestore";
import { Comment } from "@/types/comment";
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
import VersionHistory from "./VersionHistory";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import * as Y from "yjs";

type FirestoreDocument = {
  title?: string;
  content?: string;
  tags?: string[];
  [key: string]: unknown;
};

function Document({
  id,
  initialData,
}: {
  id: string;
  initialData?: FirestoreDocument | null;
}) {
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
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    string | null
  >(null);
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOwner = useOwner();
  const { theme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  const [blockEditor, setBlockEditor] = useState<BlockNoteEditor | null>(null);
<<<<<<< HEAD
  const { zenMode, setZenMode } = useZenMode();
  const [fullWidth, setFullWidth] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const titleFormRef = useRef<HTMLFormElement>(null);
=======
    const { zenMode, setZenMode } = useZenMode();
    const [fullWidth, setFullWidth] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const titleFormRef = useRef<HTMLFormElement>(null);
>>>>>>> 63e53d5 (css)

  // Memoize fullWidth toggle to prevent lag
  const toggleFullWidth = useCallback(() => {
    setFullWidth(prev => !prev);
  }, []);

  // Memoize TOC toggle to prevent lag
  const toggleToc = useCallback(() => {
    setIsTocOpen(prev => !prev);
  }, []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ============================================
  // UNDO/REDO STATE - USING YJS UNDOMANAGER ONLY
  // ============================================
  const [undoManager, setUndoManager] = useState<Y.UndoManager | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const data = liveData ?? initialData ?? null;

  const handleCommentClick = useCallback((text: string) => {
    setSelectedText(text);
    setIsAddCommentDialogOpen(true);
  }, []);

  useEffect(() => {
    if (typeof data?.title === "string") {
      setInput(data.title);
    }
  }, [data?.title]);

  // ============================================
  // CORRECT IMPLEMENTATION: Listen to Yjs UndoManager events
  // ============================================
  // This is the ONLY way to track undo/redo state in collaborative mode
  // DO NOT try to access _tiptapEditor - it will cause errors
  useEffect(() => {
    if (!undoManager) return;

    const updateUndoRedoState = () => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };

    // Set initial state
    updateUndoRedoState();

    // Listen for stack changes
    undoManager.on("stack-item-added", updateUndoRedoState);
    undoManager.on("stack-item-popped", updateUndoRedoState);

    return () => {
      undoManager.off("stack-item-added", updateUndoRedoState);
      undoManager.off("stack-item-popped", updateUndoRedoState);
    };
  }, [undoManager]);

  // ============================================
  // KEYBOARD SHORTCUTS FOR UNDO/REDO
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl+Z (Undo)
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (undoManager && undoManager.canUndo()) {
          undoManager.undo();
        }
        return;
      }

      // Handle Ctrl+Y or Ctrl+Shift+Z (Redo)
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        if (undoManager && undoManager.canRedo()) {
          undoManager.redo();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undoManager]);

  // ============================================
  // REMOVED: Incorrect useEffect that caused the error
  // ============================================
  // THIS CODE WAS DELETED (DO NOT ADD IT BACK):
  //
  // useEffect(() => {
  //   if (!blockEditor) return;
  //
  //   const tipTapEditor = (blockEditor as any)._tiptapEditor;
  //   if (!tipTapEditor) return;
  //
  //   const updateState = () => {
  //     setCanUndo(tipTapEditor.can().undo());  // ❌ ERROR: This doesn't exist in collaborative mode
  //     setCanRedo(tipTapEditor.can().redo());  // ❌ ERROR: This doesn't exist in collaborative mode
  //   };
  //
  //   updateState();
  //   tipTapEditor.on('transaction', updateState);
  //
  //   return () => {
  //     tipTapEditor.off('transaction', updateState);
  //   };
  // }, [blockEditor]);

  // ============================================
  // REMOVED: Incorrect handler functions
  // ============================================
  // THESE FUNCTIONS WERE DELETED (DO NOT ADD THEM BACK):
  //
  // const handleUndo = () => {
  //   if (!blockEditor) return;
  //   const tipTapEditor = (blockEditor as any)._tiptapEditor;
  //   if (tipTapEditor && tipTapEditor.can().undo()) {  // ❌ ERROR: Doesn't exist
  //     tipTapEditor.commands.undo();
  //   }
  // };
  //
  // const handleRedo = () => {
  //   if (!blockEditor) return;
  //   const tipTapEditor = (blockEditor as any)._tiptapEditor;
  //   if (tipTapEditor && tipTapEditor.can().redo()) {  // ❌ ERROR: Doesn't exist
  //     tipTapEditor.commands.redo();
  //   }
  // };

  useEffect(() => {
    if (!id) return;

    const commentsRef = collection(db, "documents", id, "comments");
    const q = query(commentsRef, where("resolved", "==", false));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActiveCommentsCount(snapshot.size);

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
        setActiveCommentsCount(0);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (id) {
      startTransition(async () => {
        await updateLastOpened(id);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!data || !user) return;

    const currentContent = typeof data.content === "string" ? data.content : "";
    const currentTitle = typeof data.title === "string" ? data.title : "";

    setLastSavedContent(currentContent);
    setLastSavedTitle(currentTitle);

    const autoSaveInterval = 5 * 60 * 1000;

    const createSnapshot = async () => {
      if (
        currentContent !== lastSavedContent ||
        currentTitle !== lastSavedTitle
      ) {
        try {
          const versionRef = doc(collection(db, "documents", id, "versions"));
          await setDoc(versionRef, {
            content: lastSavedContent,
            title: lastSavedTitle,
            timestamp: Timestamp.now(),
            userId: user.id,
            userName: user.fullName || user.username || user.id,
          });

          setLastSavedContent(currentContent);
          setLastSavedTitle(currentTitle);

          console.log("Auto-saved document snapshot");
        } catch (error) {
          console.error("Error creating snapshot:", error);
        }
      }
    };

    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(createSnapshot, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [id, data?.content, data?.title, user, lastSavedContent, lastSavedTitle, data]);

  useEffect(() => {
    const cleanupOldVersions = async () => {
      if (!id) return;

      try {
        const versionsRef = collection(db, "documents", id, "versions");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const q = query(
          versionsRef,
          where("timestamp", "<", Timestamp.fromDate(sevenDaysAgo))
        );
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

  useEffect(() => {
    if (!highlightedCommentId) {
      document.querySelectorAll(".comment-highlight-active").forEach((el) => {
        el.classList.remove("comment-highlight-active");
      });
      return;
    }

    const comment = allComments.find((c) => c.id === highlightedCommentId);
    if (!comment) return;

    const editorElement = document.querySelector(".bn-container");
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

    const searchText = comment.highlightedText;

    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const index = text.indexOf(searchText);

      if (index !== -1 && textNode.parentElement) {
        textNode.parentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        const parentEl = textNode.parentElement;
        parentEl.classList.add("comment-highlight-active");

        setTimeout(() => {
          parentEl.classList.remove("comment-highlight-active");
          parentEl.style.backgroundColor = "";
          parentEl.style.borderLeft = "";
          parentEl.style.paddingLeft = "";
          setHighlightedCommentId(null);
        }, 3000);

        break;
      }
    }
  }, [highlightedCommentId, allComments]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
        </div>
        <div className="text-muted-foreground text-sm font-medium">
          {t("document.status.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 dark:text-red-400 text-lg">
          {t("document.status.errorWithMessage", { message: error.message })}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          {t("document.status.notFound")}
        </div>
      </div>
    );
  }

  const updateTitle = (e: FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      startTransition(async () => {
        await updateDoc(doc(db, "documents", id), {
          title: input,
        });
      });
    }
  };

  const handleAddTag = async (e: FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      const newTags = [...(data.tags || []), newTag.trim()];
      startTransition(async () => {
        await updateDoc(doc(db, "documents", id), { tags: newTags });
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = async (index: number) => {
    const newTags = (data.tags || []).filter(
      (_: string, i: number) => i !== index
    );
    startTransition(async () => {
      await updateDoc(doc(db, "documents", id), { tags: newTags });
    });
  };

  const handleGenerateTags = async () => {
    if (!data?.content) {
      console.error("No content available to generate tags");
      return;
    }

    if (!id) {
      console.error("Document ID is required");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const contentToAnalyze = data.content;
      const result = await generateTags(id, contentToAnalyze);
      if (!result.success) {
        throw new Error(result.error || "Failed to generate tags");
      }
      console.log("Tags generated successfully:", result.tags);

      const newTags = result.tags;
      if (Array.isArray(newTags)) {
        startTransition(async () => {
          await updateDoc(doc(db, "documents", id), {
            tags: newTags,
          });
        });
      }
    } catch (error) {
      console.error("Failed to generate tags:", error);
      setIsGeneratingTags(false);
      return;
    }

    setIsGeneratingTags(false);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0f0f0f] transition-colors duration-300">
      {/* Header with document controls */}
      <header className="sticky top-0 z-10 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-gray-800 px-6 py-3 transition-all duration-300">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4">
            {/* Document title form */}
            <form
              ref={titleFormRef}
              className="flex-1 flex items-center gap-3 group relative"
              onSubmit={updateTitle}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="font-bold text-3xl border-0 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-0 bg-transparent px-3 py-2 h-auto w-full max-w-3xl tracking-tight transition-all rounded-lg"
                placeholder={t("document.placeholders.title")}
                style={{ fontFamily: "'Recursive', 'Inter', system-ui", fontWeight: 700 }}
              />
              <Button
                disabled={isUpdating}
                type="submit"
                variant="ghost"
                size="sm"
                className="opacity-70 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                {isUpdating ? t("document.actions.saving") : t("document.actions.save")}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              {/* ============================================
                  UNDO/REDO BUTTONS - CORRECT IMPLEMENTATION
                  ============================================
                  These buttons now call undoManager directly
                  No need for intermediate handler functions
              */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => undoManager?.undo()}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="h-8 w-8"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => undoManager?.redo()}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                  className="h-8 w-8"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-200/20 dark:border-gray-700/20">
                {isOwner ? (
                  <div className="flex items-center gap-2">
                    <Crown size={15} className="text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold">
                      {t("document.roles.owner")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold">
                      {t("document.roles.editor")}
                    </span>
                  </div>
                )}
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setZenMode(!zenMode)}
                      variant="ghost"
                      size="icon"
                      className="hover:scale-105 active:scale-95 transition-transform rounded-full"
                    >
                      {zenMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0">
                    <p className="font-semibold text-sm">{zenMode ? t("zenMode.exit") : t("zenMode.enter")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:scale-105 active:scale-95 transition-transform rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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

                  <DropdownMenuItem
                    onSelect={() => setIsCommentsSidebarOpen(true)}
                  >
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

                  <DropdownMenuItem onSelect={() => setIsHistoryOpen(true)}>
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
                  {/* Full Width Toggle */}
                  <DropdownMenuItem onSelect={toggleFullWidth}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Expand className="h-4 w-4" />
                        <span>Full Width</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors ${fullWidth ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} relative`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${fullWidth ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {/* Table of Contents Toggle */}
                  <DropdownMenuItem onSelect={toggleToc}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span>Table of Contents</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors ${isTocOpen ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} relative`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isTocOpen ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem>
                        <div className="flex items-center justify-between w-full">
                          <span>Document Tags</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="w-56">
                      {data.tags && data.tags.length > 0 ? (
                        data.tags.map((tag: string, index: number) => (
                          <DropdownMenuItem
                            key={index}
                            onSelect={(e) => e.preventDefault()}
                          >
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
                          <span className="text-muted-foreground">
                            No tags yet
                          </span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="focus:bg-transparent hover:bg-transparent"
                      >
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
                            placeholder="Add new tag"
                            className="h-7"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
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
                          <Wand2
                            size={14}
                            className={isGeneratingTags ? "animate-pulse" : ""}
                          />
                          <span>
                            {isGeneratingTags
                              ? "Generating tags..."
                              : !data?.content
                                ? "Add content first"
                                : "Generate Tags with AI"}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <main className={`w-full px-4 md:px-8 lg:px-12 py-6 relative ${
                fullWidth ? 'max-w-full' : 'max-w-[1400px]'
            } mx-auto transition-[max-width] duration-150 ease-out`}>
                <div className="min-h-[80vh]">
            <Editor
          darkMode={theme === "dark"}
          onEditorReady={setBlockEditor}
          onCommentClick={handleCommentClick}
          onUndoManagerReady={setUndoManager}
        />
                </div>
      </main>

      {/* Table of Contents - Sticky top-right */}
      {isTocOpen && <InlineTableOfContents key="toc" containerSelector=".bn-container" />}

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

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
          </SheetHeader>

          {blockEditor && (
            <VersionHistory
              documentId={id}
              editor={blockEditor}
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default Document;
