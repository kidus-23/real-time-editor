'use server';

import { db } from "@/firebase-admin";
import { auth } from "@clerk/nextjs";
import { Timestamp } from "firebase-admin/firestore";

// Create a snapshot of the document
export async function createSnapshot(documentId: string) {
  const { userId } = auth();
  
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get the current document data
    const docRef = db.collection("documents").doc(documentId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return { success: false, error: "Document not found" };
    }
    
    const data = docSnap.data();
    
    // Create a new version in the versions subcollection
    const versionRef = docRef.collection("versions").doc();
    await versionRef.set({
      content: data?.content || "",
      title: data?.title || "Untitled",
      timestamp: Timestamp.now(),
      userId: userId,
      userName: data?.userName || userId
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error creating snapshot:", error);
    return { success: false, error: "Failed to create snapshot" };
  }
}

// Delete versions older than 7 days
export async function cleanupOldVersions(documentId: string) {
  const { userId } = auth();
  
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const docRef = db.collection("documents").doc(documentId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldVersionsQuery = await docRef.collection("versions")
      .where("timestamp", "<", Timestamp.fromDate(sevenDaysAgo))
      .get();
    
    const batch = db.batch();
    oldVersionsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return { 
      success: true, 
      deletedCount: oldVersionsQuery.size 
    };
  } catch (error) {
    console.error("Error cleaning up old versions:", error);
    return { success: false, error: "Failed to clean up old versions" };
  }
}

// Restore a specific version
export async function restoreVersion(documentId: string, versionId: string) {
  const { userId } = auth();
  
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
    
    // Update the document with the version data
    await docRef.update({
      content: versionData?.content,
      title: versionData?.title,
      lastUpdated: Timestamp.now()
    });
    
    // Create a new version recording this restoration
    const newVersionRef = docRef.collection("versions").doc();
    await newVersionRef.set({
      content: versionData?.content,
      title: versionData?.title,
      timestamp: Timestamp.now(),
      userId: userId,
      userName: `${userId} (restored version)`,
      restoredFromId: versionId
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error restoring version:", error);
    return { success: false, error: "Failed to restore version" };
  }
}