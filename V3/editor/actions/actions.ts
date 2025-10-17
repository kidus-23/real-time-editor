'use server'

import { adminDB } from "@/firebase-admin";
import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";

export async function createNewDocument() {
    const { sessionClaims } = await auth();

    if (!sessionClaims?.email) {
        throw new Error("User email not found");
    }

    try {
        // Use batch for faster atomic operations
        const batch = adminDB.batch();
        const timestamp = new Date();

        // Create document reference
        const docRef = adminDB.collection("documents").doc();
        batch.set(docRef, {
            title: "New Doc",
            createdAt: timestamp,
            lastOpened: timestamp,
        });

        // Create user-room relationship
        const userRoomRef = adminDB
            .collection('users')
            .doc(sessionClaims.email)
            .collection('rooms')
            .doc(docRef.id);

        batch.set(userRoomRef, {
            userId: sessionClaims.email,
            role: "owner",
            createAt: timestamp,
            roomId: docRef.id,
            lastOpened: timestamp,
        });

        // Commit both operations at once
        await batch.commit();

        return { docId: docRef.id };
    } catch (error) {
        console.error("Error creating document:", error);
        throw new Error("Failed to create document");
    }
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
                lastOpened: new Date(),
            });
        return { success: true };
    } catch (error) {
        console.log("Error inviting user to document:", error);
        return { success: false };
    }
}

export async function removeUserFromDocument(roomId: string, email: string) {
    //auth().protect();
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
            .delete();
        return { success: true };
    } catch (error) {
        console.log("Error removing user from document:", error);
        return { success: false };
    }
}

export async function updateLastOpened(roomId: string) {
    const session = await auth();
    if (!session || !session.sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    const email = session.sessionClaims.email as string;

    try {
        await adminDB
            .collection('users')
            .doc(email)
            .collection('rooms')
            .doc(roomId)
            .update({
                lastOpened: new Date()
            });
        return { success: true };
    } catch (error) {
        console.error("Error updating last opened timestamp:", error);
        return { success: false };
    }
}

// Function to save document content
export async function saveDocumentContent(roomId: string, content: string) {
    const session = await auth();
    if (!session || !session.sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    try {
        // Update the document with content
        await adminDB
            .collection('documents')
            .doc(roomId)
            .update({
                content: content,
                lastUpdated: new Date()
            });

        return {
            success: true,
            message: 'Document content saved successfully'
        };
    } catch (error) {
        console.error("Error saving document content:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Function to generate tags using AI
export async function generateTags(roomId: string, content: string) {
    const session = await auth();
    if (!session || !session.sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    try {
        if (!content.trim()) {
            throw new Error("No content provided");
        }

        const url = new URL('/api/generate-tags', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to generate tags: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success || !Array.isArray(result.tags)) {
            throw new Error("Invalid response from tag generation");
        }

        // Update document with new tags
        await adminDB
            .collection('documents')
            .doc(roomId)
            .update({
                tags: result.tags
            });

        return {
            success: true,
            tags: result.tags,
            message: 'Tags generated and saved successfully'
        };
    } catch (error) {
        console.error("Error generating tags:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Comment-related actions
export async function createComment(roomId: string, commentData: {
    content: string;
    highlightedText: string;
    blockId?: string;
    position?: { start: number; end: number };
}) {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    try {
        const commentRef = await adminDB
            .collection('documents')
            .doc(roomId)
            .collection('comments')
            .add({
                ...commentData,
                createdBy: {
                    email: sessionClaims.email,
                    name: sessionClaims.fullName || sessionClaims.email,
                },
                createdAt: new Date(),
                resolved: false,
                roomId: roomId,
            });

        return { success: true, commentId: commentRef.id };
    } catch (error) {
        console.error("Error creating comment:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function resolveComment(commentId: string, roomId: string, resolved: boolean) {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    try {
        await adminDB
            .collection('documents')
            .doc(roomId)
            .collection('comments')
            .doc(commentId)
            .update({ resolved });

        return { success: true };
    } catch (error) {
        console.error("Error resolving comment:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function deleteComment(commentId: string, roomId: string) {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.email) {
        throw new Error("Unauthorized");
    }

    try {
        await adminDB
            .collection('documents')
            .doc(roomId)
            .collection('comments')
            .doc(commentId)
            .delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}