"use server";
import { adminDB as db } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { Timestamp } from "firebase-admin/firestore";

// Create a snapshot of the document with Markdown content
export async function createSnapshot(
  documentId: string,
  title: string,
  markdownContent: string
) {
  // Ensure auth errors are handled gracefully (auth() can throw if Clerk isn't available)
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("Auth error in createSnapshot:", err);
    return { success: false, error: "Authentication error" };
  }

  const userId = (session as any)?.userId;
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  if (!documentId) {
    return { success: false, error: "Missing documentId" };
  }

  try {
    const docRef = db.collection("documents").doc(documentId);

    // Create a new version in the versions subcollection
    const versionRef = docRef.collection("versions").doc();
    await versionRef.set({
      content: markdownContent, // Store as Markdown string
      title: title,
      timestamp: Timestamp.now(),
      userId: userId,
      userName: userId, // You can enhance this with actual user name if available
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating snapshot:", error);
    const msg = (error as any)?.message || String(error);
    return { success: false, error: `Failed to create snapshot: ${msg}` };
  }
}

// Delete versions older than 7 days
export async function cleanupOldVersions(documentId: string) {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("Auth error in cleanupOldVersions:", err);
    return { success: false, error: "Authentication error" };
  }

  const userId = (session as any)?.userId;
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const docRef = db.collection("documents").doc(documentId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldVersionsQuery = await docRef
      .collection("versions")
      .where("timestamp", "<", Timestamp.fromDate(sevenDaysAgo))
      .get();

    const batch = db.batch();
    oldVersionsQuery.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      success: true,
      deletedCount: oldVersionsQuery.size,
    };
  } catch (error) {
    console.error("Error cleaning up old versions:", error);
    return { success: false, error: "Failed to clean up old versions" };
  }
}

// Restore a specific version
export async function restoreVersion(documentId: string, versionId: string) {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("Auth error in restoreVersion:", err);
    return { success: false, error: "Authentication error" };
  }

  const userId = (session as any)?.userId;
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const docRef = db.collection("documents").doc(documentId);
    const versionRef = docRef.collection("versions").doc(versionId);
    const versionSnap = await versionRef.get();

    if (!versionSnap.exists) {
      return { success: false, error: "Version not found" };
    }

    const versionData = versionSnap.data();

    // The server action should only read the historical version and return it.
    return {
      success: true,
      markdownContent: versionData?.content || "",
      title: versionData?.title || "Untitled",
    };
  } catch (error) {
    console.error("Error restoring version:", error);
    return { success: false, error: "Failed to restore version" };
  }
}
