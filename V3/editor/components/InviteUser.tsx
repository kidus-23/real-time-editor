"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FormEvent, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { sendRoomInviteNotification } from "@/actions/actions";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useTranslation } from "@/hooks/useTranslation";

function InviteUser() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const [email, setEmail] = useState("");

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();
        const roomId = pathname.split("/").pop();
        if (!roomId) return;

        startTransition(async () => {
            const { success } = await sendRoomInviteNotification(roomId, email);
            if (success) {
                setIsOpen(false);
                setEmail('');
                toast.success(t("notifications.inviteSent"));
            } else {
                toast.error(t("notifications.inviteError"));
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
                {t("inviteUser.button")}
            </div>
            <DialogContent onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{t("inviteUser.title")}</DialogTitle>
                    <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                        {t("inviteUser.description")}
                    </DialogDescription>
                </DialogHeader>
                <form className="flex gap-3 mt-4" onSubmit={handleInvite}>
                    <Input
                        type="email"
                        placeholder={t("inviteUser.placeholder")}
                        className="w-full h-12 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="submit" disabled={!email || isPending} size="lg" className="hover-scale">
                        {isPending ? t("inviteUser.inviting") : t("inviteUser.button")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
export default InviteUser