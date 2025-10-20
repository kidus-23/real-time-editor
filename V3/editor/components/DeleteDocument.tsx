"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import { deleteDocument } from "@/actions/actions";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

function DeleteDocument() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const router = useRouter();


    const handleDelete = () => {
        const roomId = pathname.split("/").pop();
        if (!roomId) return;
        startTransition(async () => {
            const { success } = await deleteDocument(roomId);
            if (success) {
                setIsOpen(false);
                router.push("/");
                toast.success(t("deleteDocument.success"));
            } else {
                toast.error(t("deleteDocument.error"));
            }
        });
    };
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div onClick={handleClick} className="w-full cursor-pointer">
                {t("deleteDocument.button")}
            </div>
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{t("deleteDocument.title")}</DialogTitle>
                    <DialogDescription>
                        {t("deleteDocument.description")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end gap-2">
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                        {isPending ? t("deleteDocument.deleting") : t("deleteDocument.button")}
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">{t("deleteDocument.close")}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
export default DeleteDocument