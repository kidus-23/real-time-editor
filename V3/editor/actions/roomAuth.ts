// Shared authorization helper for server actions that take a roomId.
//
// Every server action used to verify only that *a* Clerk session exists, then
// trust the client-supplied roomId — allowing any signed-in user to delete or
// rewrite any document, or to self-invite into any room (which grants
// Liveblocks access via /auth-endpoint). Every roomId-taking action must now
// start by calling requireRoomAccess, which checks the caller's membership
// document in the server-managed `users/{email}/rooms/{roomId}` table.

import { adminDB } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";

export type RoomRole = "editor" | "owner";

const ROLE_RANK: Record<string, number> = {
  editor: 1,
  owner: 2,
};

/**
 * Verifies the caller has a Clerk session AND holds at least `minRole` on
 * `roomId`. Throws "Unauthorized" / "Forbidden" otherwise. Returns the
 * caller's verified email.
 */
export async function requireRoomAccess(
  roomId: string,
  minRole: RoomRole = "editor"
): Promise<string> {
  if (!roomId || typeof roomId !== "string" || roomId.length > 200) {
    throw new Error("Forbidden");
  }

  const { sessionClaims } = await auth();
  const email = sessionClaims?.email;
  if (!email || typeof email !== "string") {
    throw new Error("Unauthorized");
  }

  const snap = await adminDB
    .collection("users")
    .doc(email)
    .collection("rooms")
    .doc(roomId)
    .get();

  if (!snap.exists) {
    throw new Error("Forbidden");
  }

  const role = (snap.get("role") as string | undefined) ?? "editor";
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw new Error("Forbidden");
  }

  return email;
}
