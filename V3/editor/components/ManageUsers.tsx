"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { removeUserFromDocument } from "@/actions/actions";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import useOwner from "@/lib/useOwner";
import { useRoom } from "@liveblocks/react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collectionGroup, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useTranslation } from "@/hooks/useTranslation";

function ManageUsers() {
    const { t } = useTranslation();
    const { user } = useUser()
    const room = useRoom();
    const isOwner = useOwner();
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition();

    const [userInRoom] = useCollection(
        user && query(collectionGroup(db, "rooms"), where("roomId", "==", room.id))
    );

    const handleDelete = (userId: string) => {
        startTransition(async () => {
            if (!user) return;
            const { success } = await removeUserFromDocument(room.id, userId);
            if (success) {
                toast.success(t("manageUsers.success"));
            } else {
                toast.error(t("manageUsers.error"));
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
                {t("manageUsers.button")}({userInRoom?.docs.length})
            </div>
            <DialogContent onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">{t("manageUsers.title")}</DialogTitle>
                    <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                        {t("manageUsers.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent my-4" />
                <div className="flex flex-col space-y-3">
                    {userInRoom?.docs.map((doc) => (
                        <div
                            key={doc.data().userId}
                            className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 flex justify-between items-center border border-gray-200 dark:border-gray-700 transition-all">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {doc.data().userId === user?.emailAddresses[0].toString() ?
                                    `${t("manageUsers.you")} (${doc.data().userId})` : doc.data().userId}
                            </p>

                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="capitalize">{doc.data().role}</Button>
                                {isOwner &&
                                    doc.data().userId !== user?.emailAddresses[0].toString() && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDelete(doc.data().userId)}
                                            disabled={isPending}
                                            size="sm"
                                            className="hover-scale"
                                        >
                                            {isPending ? t("manageUsers.removing") : t("manageUsers.remove")}
                                        </Button>
                                    )}
                            </div>

                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default ManageUsers