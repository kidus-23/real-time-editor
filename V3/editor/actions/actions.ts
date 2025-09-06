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
    auth().protect();
    try {
        await adminDB.collection("documents").doc(roomId).delete();

        const query = await adminDB
            .collection('rooms')
            .where('roomId', '==', roomId)
            .get();

        const batch = adminDB.batch();  

        query.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();

        await liveblocks.deleteRoom(roomId);
        return { success: true };
    } catch (error) {
        return { success: false };
    }        
}

export async function inviteUserToDocument(roomId: string, email: string) {
    auth().protect();
    try{
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
    }catch(error){
        console.log("Error inviting user to document:", error);
        return { success: false };
    }  
}