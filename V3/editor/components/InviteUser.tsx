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
import { inviteUserToDocument } from "@/actions/actions";
import { toast } from "sonner";
import { Input } from "./ui/input";

function InviteUser() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const [email, setEmail] = useState("");

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();
        const roomId = pathname.split("/").pop();
        if (!roomId) return;

        startTransition(async () => {
            const { success } = await inviteUserToDocument(roomId, email);
            if (success) {
                setIsOpen(false);
                setEmail('');
                toast.success("User Added to room successfully");
            } else {
                toast.error("Failed to Add user to the room!");
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
                Invite
            </div>
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Invite a User to collaborate!</DialogTitle>
                    <DialogDescription>
                        Enter the email address of the user you want to invite.
                    </DialogDescription>
                </DialogHeader>
                <form className="flex gap-2" onSubmit={handleInvite}>
                    <Input
                        type="email"
                        placeholder="email@example.com"
                        className="w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="submit" disabled={!email || isPending}>
                        {isPending ? "Inviting..." : "Invite"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
export default InviteUser