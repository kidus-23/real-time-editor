'use server'

import { adminDB } from "@/firebase-admin";
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