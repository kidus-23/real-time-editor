'use client'

import { useUser } from '@clerk/nextjs';
import { useRoom } from '@liveblocks/react/suspense';
import { useEffect, useState } from 'react';
import { collectionGroup, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/firebase';

function useOwner() {
    const { user } = useUser();
    const room = useRoom();
    const [isOwner, setIsOwner] = useState(false);
    const [userInRoom] = useCollection(
        user && query(collectionGroup(db, "rooms"), where("roomId", "==", room.id))
    );

    useEffect(() => {
        if (userInRoom?.docs && userInRoom.docs.length > 0) {
            const owners = userInRoom.docs.filter((doc) => doc.data().role === "Owner");
            if (
                owners.some((owner) => owner.data().userId === user?.emailAddresses[0].toString())
            ) {
                setIsOwner(true);
            }
        }
    }, [userInRoom, user]);

    return isOwner;
}

export default useOwner;