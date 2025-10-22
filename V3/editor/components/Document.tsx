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
  Trash2,
  Undo,
  Redo,
} from "lucide-react";
import { generateTags } from "@/actions/actions";
import { updateLastOpened } from "@/actions/actions";
import { useTheme } from "next-themes";
import CommentsSidebar from "./CommentsSidebar";
import AddCommentDialog from "./AddCommentDialog";
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
  }, [id, data?.content, data?.title, user, lastSavedContent, lastSavedTitle]);

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
    <div className="min-h-screen w-full bg-white dark:bg-[#020618] transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-[#020618]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4">
            <form
              className="flex-1 flex items-center gap-2 group"
              onSubmit={updateTitle}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="font-medium text-2xl border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/20 bg-transparent px-3 py-2 h-auto w-full max-w-md tracking-tight transition-all"
                placeholder={t("document.placeholders.title")}
              />
              <Button
                disabled={isUpdating}
                type="submit"
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isUpdating
                  ? t("document.actions.saving")
                  : t("document.actions.save")}
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

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-md">
                {isOwner ? (
                  <div className="flex items-center gap-1.5">
                    <Crown size={14} className="text-amber-500" />
                    <span className="font-medium">
                      {t("document.roles.owner")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-blue-500" />
                    <span className="font-medium">
                      {t("document.roles.editor")}
                    </span>
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Users2 className="h-4 w-4 mr-2" />
                    <ManageUsers />
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    <InviteUser />
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Users className="h-4 w-4 mr-2" />
                    <Avatars />
                  </DropdownMenuItem>

                  <DropdownMenuItem variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    <DeleteDocument />
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
                    <Clock className="h-4 w-4 mr-2" />
                    {t("document.menu.versionHistory")}
                  </DropdownMenuItem>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <DropdownMenuItem>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Import/Export</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="w-56">
                      <ImportExportMenu editor={blockEditor} />
                    </DropdownMenuContent>
                  </DropdownMenu>

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

      <main className="w-full px-5 py-6 relative">
        <Editor
          darkMode={theme === "dark"}
          onEditorReady={setBlockEditor}
          onCommentClick={handleCommentClick}
          onUndoManagerReady={setUndoManager}
        />
      </main>

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
