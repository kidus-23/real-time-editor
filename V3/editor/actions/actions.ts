'use server'

import { adminDB } from "@/firebase-admin";
import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";

export async function createNewDocument() {

    //auth().protect();   protect() kept showing errors
    //const { sessionClaims } = await auth();

    const session = await auth();

    const { sessionClaims } = session;

    const docCollectionRef = adminDB.collection("documents");
    const docRef = await docCollectionRef.add({
        title: "New Doc"
    })

    await adminDB
        .collection('users')
        .doc(sessionClaims?.email!)
        .collection('rooms')
        .doc(docRef.id)
        .set({
            userId: sessionClaims?.email,
            role: "owner",
            createAt: new Date(),
            roomId: docRef.id,
        });

    return { docId: docRef.id };
}

export async function deleteDocument(roomId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // Delete the main document
        await adminDB.collection("documents").doc(roomId).delete();

        // Delete all user-room relationships
        const usersQuery = await adminDB.collectionGroup('rooms')
            .where('roomId', '==', roomId)
            .get();

        const batch = adminDB.batch();
        usersQuery.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        // Delete the Liveblocks room
        await liveblocks.deleteRoom(roomId);

        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false };
    }
}

export async function inviteUserToDocument(roomId: string, email: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        await adminDB
            .collection('users')
            .doc(email)
            .collection('rooms')
            .doc(roomId)
            .set({
                userId: email,
                role: "editor",
                createAt: new Date(),
                roomId,
            });
        return { success: true };
    } catch (error) {
        console.log("Error inviting user to document:", error);
        return { success: false };
    }
}