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
import { collectionGroup, query,where } from "firebase/firestore";
import { db } from "@/firebase";

function ManageUsers() {
    const {user} = useUser() 
    const room = useRoom();
    const isOwner = useOwner();
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition();
    
    const [userInRoom] = useCollection(
        user && query(collectionGroup(db, "rooms"), where("roomId", "==", room.id))
    );

    const handleDelete = (userId: string) => {
        startTransition(async () => {
            if(!user) return;
            const { success } = await removeUserFromDocument(room.id, userId);
            if (success) {
                toast.success("User removed from room successfully");
            } else {
                toast.error("Failed to remove user from the room!");
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
                Users({userInRoom?.docs.length})
            </div>
            <DialogContent onClick={e => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Users with Access</DialogTitle>
                    <DialogDescription>
                        List of users who have access to this document.
                    </DialogDescription>
                </DialogHeader>
               
               <hr className="my-2" />
               <div className="flex flex-col space-y-2">
                   {userInRoom?.docs.map((doc) => (
                       <div 
                       key={doc.data().userId}
                       className="flex justify-between items-center">
                        <p className="font-light">
                            {doc.data().userId === user?.emailAddresses[0].toString() ?
                            `You(${doc.data().userId})` : doc.data().userId}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button variant="outline">{doc.data().role}</Button>
                            {isOwner &&
                            doc.data().userId !== user?.emailAddresses[0].toString() && (
                                <Button
                                variant="destructive"
                                onClick={() => handleDelete(doc.data().userId)}
                                disabled={isPending}
                                size="sm"
                                >
                                    {isPending ? "Removing..." : "X"}
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