'use client'

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { resolveComment, deleteComment } from "@/actions/actions"
import { toast } from "sonner"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/firebase"
import { Comment } from "@/types/comment"
import { Check, Trash2, MessageSquare, CheckCircle2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import stringToColor from "@/lib/stringToColor"

interface CommentsSidebarProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
    onCommentClick?: (commentId: string) => void
}

const CommentsSidebar = memo(function CommentsSidebar({ isOpen, onClose, roomId, onCommentClick }: CommentsSidebarProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const { user } = useUser()

    // Memoize filtered comments to avoid recalculating on every render
    const activeComments = useMemo(() => comments.filter(c => !c.resolved), [comments])
    const resolvedComments = useMemo(() => comments.filter(c => c.resolved), [comments])

    useEffect(() => {
        if (!roomId) return

        const commentsRef = collection(db, "documents", roomId, "comments")
        // Limit to 50 most recent comments, no metadata changes for better performance
        const q = query(commentsRef, orderBy("createdAt", "desc"), limit(50))

        let timeoutId: NodeJS.Timeout
        const unsubscribe = onSnapshot(q, { includeMetadataChanges: false }, (snapshot) => {
            const fetchedComments: Comment[] = []
            snapshot.forEach((doc) => {
                fetchedComments.push({
                    id: doc.id,
                    ...doc.data(),
                } as Comment)
            })

            // Debounce state updates to reduce re-renders (200ms)
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                setComments(fetchedComments)
            }, 200)
        })

        return () => {
            clearTimeout(timeoutId)
            unsubscribe()
        }
    }, [roomId])

    const handleResolve = useCallback(async (commentId: string, resolved: boolean) => {
        const result = await resolveComment(commentId, roomId, resolved)
        if (result.success) {
            toast.success(resolved ? "Comment resolved" : "Comment reopened")
        } else {
            toast.error("Failed to update comment")
        }
    }, [roomId])

    const handleDelete = useCallback(async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return

        const result = await deleteComment(commentId, roomId)
        if (result.success) {
            toast.success("Comment deleted")
        } else {
            toast.error("Failed to delete comment")
        }
    }, [roomId])

    const CommentCard = ({ comment, showResolveButton }: { comment: Comment, showResolveButton: boolean }) => {
        const isOwner = user?.emailAddresses[0].emailAddress === comment.createdBy.email
        const commentUserColor = stringToColor(comment.createdBy.email)

        return (
            <div className="p-4 border rounded-lg space-y-3 bg-card">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                            style={{ backgroundColor: commentUserColor }}
                        >
                            {comment.createdBy.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{comment.createdBy.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {comment.createdAt?.toDate ?
                                    new Date(comment.createdAt.toDate()).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) :
                                    'Just now'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pl-10 space-y-2">
                    <div
                        className="p-2 rounded border-l-4 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                            backgroundColor: `${commentUserColor}15`,
                            borderLeftColor: commentUserColor
                        }}
                        onClick={() => onCommentClick?.(comment.id!)}
                        title="Click to view in document"
                    >
                        <p className="text-xs italic text-muted-foreground">"{comment.highlightedText}"</p>
                    </div>

                    <p className="text-sm">{comment.content}</p>

                    <div className="flex items-center gap-2 pt-2">
                        {showResolveButton && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(comment.id!, true)}
                                className="text-xs"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Resolve
                            </Button>
                        )}

                        {!showResolveButton && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(comment.id!, false)}
                                className="text-xs"
                            >
                                Reopen
                            </Button>
                        )}

                        {isOwner && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(comment.id!)}
                                className="text-xs text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 flex flex-col h-full">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments
                        <Badge variant="secondary">{comments.length}</Badge>
                    </SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="active" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 px-4">
                        <TabsTrigger value="active" className="rounded-none border-b-2 data-[state=active]:border-primary">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Active
                            <Badge variant="secondary" className="ml-2">{activeComments.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="resolved" className="rounded-none border-b-2 data-[state=active]:border-primary">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Resolved
                            <Badge variant="secondary" className="ml-2">{resolvedComments.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="flex-1 m-0 overflow-hidden">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-3">
                                {activeComments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No active comments</p>
                                    </div>
                                ) : (
                                    activeComments.map((comment) => (
                                        <CommentCard key={comment.id} comment={comment} showResolveButton={true} />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="resolved" className="flex-1 m-0 overflow-hidden">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-3">
                                {resolvedComments.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No resolved comments</p>
                                    </div>
                                ) : (
                                    resolvedComments.map((comment) => (
                                        <CommentCard key={comment.id} comment={comment} showResolveButton={false} />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
})

export default CommentsSidebar
