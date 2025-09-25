import { adminDB } from "@/firebase-admin";
import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import stringToColor from "@/lib/stringToColor";

export async function POST(req: NextRequest) {
    const sessionAuth = await auth();

    const { sessionClaims } = sessionAuth;
    const { room } = await req.json();

    // Generate a consistent color for this user based on their email
    const userColor = stringToColor(sessionClaims?.email || "fallback");

    const session = liveblocks.prepareSession(sessionClaims?.email!, {
        userInfo: {
            name: sessionClaims?.fullName!,
            email: sessionClaims?.email!,
            avatar: sessionClaims?.image!,
            color: userColor,
        },
    });

    const usersInRoom = await adminDB
        .collectionGroup("rooms")
        .where("userId", "==", sessionClaims?.email)
        .get();

    const userInRoom = usersInRoom.docs.find((doc) => doc.id === room);

    if (userInRoom?.exists) {
        session.allow(room, session.FULL_ACCESS);
        const { body, status } = await session.authorize();

        console.log("You are allowed to access this room.")

        return new Response(body, { status });
    } else {
        return NextResponse.json(
            { message: "You are not allowed/Removed form this room." },
            { status: 403 }
        );
    }

}