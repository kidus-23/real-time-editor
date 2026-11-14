"use server";

import { adminDB } from "@/firebase-admin";
import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";
import { requireRoomAccess } from "./roomAuth";

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
      .collection("users")
      .doc(sessionClaims.email)
      .collection("rooms")
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
  await requireRoomAccess(roomId, "owner");

  try {
    // Delete the main document
    await adminDB.collection("documents").doc(roomId).delete();

    // Delete all user-room relationships
    const usersQuery = await adminDB
      .collectionGroup("rooms")
      .where("roomId", "==", roomId)
      .get();

    const batch = adminDB.batch();
    usersQuery.forEach((doc: import("firebase-admin/firestore").QueryDocumentSnapshot) => {
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
  await requireRoomAccess(roomId, "owner");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    throw new Error("Invalid email address");
  }

  try {
    await adminDB
      .collection("users")
      .doc(email)
      .collection("rooms")
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
  // Only the room owner may remove members.
  await requireRoomAccess(roomId, "owner");

  try {
    await adminDB
      .collection("users")
      .doc(email)
      .collection("rooms")
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
      .collection("users")
      .doc(email)
      .collection("rooms")
      .doc(roomId)
      .update({
        lastOpened: new Date(),
      });
    return { success: true };
  } catch (error) {
    console.error("Error updating last opened timestamp:", error);
    return { success: false };
  }
}

// Function to save document content
export async function saveDocumentContent(roomId: string, content: string) {
  await requireRoomAccess(roomId);

  try {
    // Update the document with content
    await adminDB.collection("documents").doc(roomId).update({
      content: content,
      lastUpdated: new Date(),
    });

    return {
      success: true,
      message: "Document content saved successfully",
    };
  } catch (error) {
    console.error("Error saving document content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to generate tags using AI
export async function generateTags(roomId: string, content: string) {
  await requireRoomAccess(roomId);

  try {
    if (!content.trim()) {
      throw new Error("No content provided");
    }

    // Make request to the Cloudflare backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/generate-tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || `Failed to generate tags: ${response.statusText}`
      );
    }

    if (!result.success || !Array.isArray(result.tags)) {
      console.error("Invalid tag generation response:", result);
      throw new Error("Invalid response from tag generation");
    }

    // Validate tags
    if (!result.tags.length || result.tags.length < 5) {
      throw new Error("Expected at least 5 tags from generation");
    }

    // Update document with new tags
    await adminDB.collection("documents").doc(roomId).update({
      tags: result.tags,
    });

    return {
      success: true,
      tags: result.tags,
      message: "Tags generated and saved successfully",
    };
  } catch (error) {
    console.error("Error generating tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Comment-related actions
export async function createComment(
  roomId: string,
  commentData: {
    content: string;
    highlightedText: string;
    blockId?: string;
    position?: { start: number; end: number };
  }
) {
  const email = await requireRoomAccess(roomId);
  const { sessionClaims } = await auth();

  try {
    const commentRef = await adminDB
      .collection("documents")
      .doc(roomId)
      .collection("comments")
      .add({
        content: typeof commentData.content === "string" ? commentData.content.slice(0, 5000) : "",
        highlightedText:
          typeof commentData.highlightedText === "string"
            ? commentData.highlightedText.slice(0, 5000)
            : "",
        blockId: typeof commentData.blockId === "string" ? commentData.blockId.slice(0, 200) : undefined,
        position:
          commentData.position &&
          typeof commentData.position.start === "number" &&
          typeof commentData.position.end === "number"
            ? { start: commentData.position.start, end: commentData.position.end }
            : undefined,
        createdBy: {
          email,
          name: sessionClaims?.fullName || email,
        },
        createdAt: new Date(),
        resolved: false,
        roomId: roomId,
      });

    return { success: true, commentId: commentRef.id };
  } catch (error) {
    console.error("Error creating comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function resolveComment(
  commentId: string,
  roomId: string,
  resolved: boolean
) {
  await requireRoomAccess(roomId);

  try {
    await adminDB
      .collection("documents")
      .doc(roomId)
      .collection("comments")
      .doc(commentId)
      .update({ resolved });

    return { success: true };
  } catch (error) {
    console.error("Error resolving comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteComment(commentId: string, roomId: string) {
  await requireRoomAccess(roomId);

  try {
    await adminDB
      .collection("documents")
      .doc(roomId)
      .collection("comments")
      .doc(commentId)
      .delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Room invitation notifications
export async function sendRoomInviteNotification(
  roomId: string,
  inviteeEmail: string
) {
  // Only the owner may send invites for a room (spam/abuse vector otherwise).
  const inviterEmail = await requireRoomAccess(roomId, "owner");
  const { sessionClaims } = await auth();

  try {
    // Get document title
    const docSnap = await adminDB.collection("documents").doc(roomId).get();
    const docData = docSnap.data();
    const documentTitle = docData?.title || "Untitled Document";

    // Get inviter name
    const inviterName = sessionClaims?.fullName || inviterEmail;

    // Send notification via Liveblocks
    await liveblocks.triggerInboxNotification({
      userId: inviteeEmail,
      kind: "$roomInvite",
      subjectId: roomId,
      activityData: {
        roomId,
        documentTitle,
        inviterEmail: inviterEmail,
        inviterName,
        invitedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending room invite notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function acceptRoomInvite(roomId: string, inviteeEmail: string, notificationId: string) {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.email || sessionClaims.email !== inviteeEmail) {
        throw new Error("Unauthorized");
    }

    try {
        // Add user to room
        await adminDB
            .collection('users')
            .doc(inviteeEmail)
            .collection('rooms')
            .doc(roomId)
            .set({
                userId: inviteeEmail,
                role: "editor",
                createAt: new Date(),
                roomId: roomId,
                lastOpened: new Date(),
            });

        // Delete the notification since the invite is accepted
        await liveblocks.deleteInboxNotification({
            userId: inviteeEmail,
            inboxNotificationId: notificationId,
        });

        return { success: true };
    } catch (error) {
        console.error("Error accepting room invite:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function declineRoomInvite(
  inviteeEmail: string,
  notificationId: string
) {
  const { sessionClaims } = await auth();
  if (!sessionClaims?.email || sessionClaims.email !== inviteeEmail) {
    throw new Error("Unauthorized");
  }

    try {
        // Just delete the notification since the invite is declined
        await liveblocks.deleteInboxNotification({
            userId: inviteeEmail,
            inboxNotificationId: notificationId,
        });

        return { success: true };
    } catch (error) {
        console.error("Error declining room invite:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
