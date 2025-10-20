'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createComment } from "@/actions/actions"
import { toast } from "sonner"
import { CommentFormData } from "@/types/comment"
import { useUser } from "@clerk/nextjs"
import stringToColor from "@/lib/stringToColor"
import { useTranslation } from "@/hooks/useTranslation"

interface AddCommentDialogProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
    selectedText: string
}

export default function AddCommentDialog({
    isOpen,
    onClose,
    roomId,
    selectedText,
}: AddCommentDialogProps) {
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useUser()
    const { t } = useTranslation()

    // Get user's unique color
    const userColor = user?.emailAddresses[0]?.emailAddress
        ? stringToColor(user.emailAddresses[0].emailAddress)
        : "#FECA57"

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error(t("addCommentDialog.toast.required"))
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createComment(roomId, {
                content: comment.trim(),
                highlightedText: selectedText,
            })

            if (result.success) {
                toast.success(t("addCommentDialog.toast.success"))
                setComment("")
                onClose()
            } else {
                toast.error(result.error || t("addCommentDialog.toast.failure"))
            }
        } catch (error) {
            toast.error(t("addCommentDialog.toast.error"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setComment("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("addCommentDialog.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t("addCommentDialog.labels.selectedText")}
                        </label>
                        <div
                            className="p-3 rounded-md border-l-4"
                            style={{
                                backgroundColor: `${userColor}15`,
                                borderLeftColor: userColor
                            }}
                        >
                            <p className="text-sm italic">"{selectedText}"</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("addCommentDialog.labels.yourComment")}</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("addCommentDialog.placeholder")}
                            className="min-h-[100px] resize-none"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        {t("addCommentDialog.buttons.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? t("addCommentDialog.buttons.submitting") : t("addCommentDialog.buttons.submit")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
