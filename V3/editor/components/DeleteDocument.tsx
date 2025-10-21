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
            <DialogContent onClick={e => e.stopPropagation()} className="glass-intense rounded-3xl border-0">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{t("deleteDocument.title")}</DialogTitle>
                    <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mt-2">
                        {t("deleteDocument.description")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end gap-3 mt-6">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" size="lg" className="hover-scale">{t("deleteDocument.close")}</Button>
                    </DialogClose>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending} size="lg" className="hover-scale">
                        {isPending ? t("deleteDocument.deleting") : t("deleteDocument.button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
export default DeleteDocument