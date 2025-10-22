import { adminDB } from "@/firebase-admin";
import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import stringToColor from "@/lib/stringToColor";

export async function POST(req: NextRequest) {
    try {
        const sessionAuth = await auth();

        const { sessionClaims } = sessionAuth;

        // Validate user email
        if (!sessionClaims?.email) {
            return NextResponse.json(
                { message: "Unauthorized: No email found in session" },
                { status: 401 }
            );
        }

        // Parse request body safely
        let room: string | undefined;
        try {
            const body = await req.json();
            room = body.room;
        } catch {
            // If no body or invalid JSON, room will be undefined
            room = undefined;
        }

        // Generate a consistent color for this user based on their email
        const userColor = stringToColor(sessionClaims.email);

        const session = liveblocks.prepareSession(sessionClaims.email, {
            userInfo: {
                name: sessionClaims.fullName || sessionClaims.email,
                email: sessionClaims.email,
                avatar: sessionClaims.image || "",
                color: userColor,
            },
        });

        // If no room is specified, authorize for user-level features (like inbox notifications)
        // Use wildcard permissions for resources outside rooms
        if (!room) {
            // Grant access to user's own notifications and inbox
            session.allow(`${sessionClaims.email}:*`, session.READ_ACCESS);
            session.allow(`notifications:${sessionClaims.email}`, session.FULL_ACCESS);
            const { body, status } = await session.authorize();
            return new Response(body, { status });
        }

        // If room is specified, check user has access to that room
        const usersInRoom = await adminDB
            .collectionGroup("rooms")
            .where("userId", "==", sessionClaims.email)
            .get();

        const userInRoom = usersInRoom.docs.find((doc) => doc.id === room);

        if (userInRoom?.exists) {
            session.allow(room, session.FULL_ACCESS);
            const { body, status } = await session.authorize();
            return new Response(body, { status });
        } else {
            return NextResponse.json(
                { message: "You are not allowed/Removed from this room." },
                { status: 403 }
            );
        }
    } catch (error) {
        console.error("Liveblocks auth error:", error);
        return NextResponse.json(
            { message: "Authentication failed", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}