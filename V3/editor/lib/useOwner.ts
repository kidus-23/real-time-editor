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
        if (userInRoom?.docs && userInRoom.docs.length > 0 && user) {
            const userEmail = user.emailAddresses[0].emailAddress;
            const userDoc = userInRoom.docs.find((doc) => doc.data().userId === userEmail);

            if (userDoc && userDoc.data().role === "owner") {
                setIsOwner(true);
            } else {
                setIsOwner(false);
            }
        } else {
            setIsOwner(false);
        }
    }, [userInRoom, user]);

    return isOwner;
}

export default useOwner;