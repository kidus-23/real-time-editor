"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{t("inviteUser.title")}</DialogTitle>
                    <DialogDescription>
                        {t("inviteUser.description")}
                    </DialogDescription>
                </DialogHeader>
                <form className="flex gap-2" onSubmit={handleInvite}>
                    <Input
                        type="email"
                        placeholder={t("inviteUser.placeholder")}
                        className="w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="submit" disabled={!email || isPending}>
                        {isPending ? t("inviteUser.inviting") : t("inviteUser.button")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
export default InviteUser