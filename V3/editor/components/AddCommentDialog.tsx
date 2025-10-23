'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createComment } from "@/actions/actions"
import { toast } from "sonner"
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
        } catch {
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
            <DialogContent className="sm:max-w-[600px] bg-card border border-border rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{t("addCommentDialog.title")}</DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Add a comment to the selected text.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("addCommentDialog.labels.selectedText")}
                        </label>
                        <div
                            className="p-4 rounded-xl border-l-4"
                            style={{
                                backgroundColor: `${userColor}15`,
                                borderLeftColor: userColor
                            }}
                        >
                            <p className="text-sm italic text-card-foreground">&quot;{selectedText}&quot;</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("addCommentDialog.labels.yourComment")}</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("addCommentDialog.placeholder")}
                            className="min-h-[120px] resize-none rounded-xl text-base"
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 mt-2">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting} size="lg" className="hover-scale">
                        {t("addCommentDialog.buttons.cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="hover-scale">
                        {isSubmitting ? t("addCommentDialog.buttons.submitting") : t("addCommentDialog.buttons.submit")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
