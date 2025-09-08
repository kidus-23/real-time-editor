'use client'

import { ClientSideSuspense, RoomProvider as RoomProviderWrapper } from "@liveblocks/react/suspense";
import LoadingSpinner from "./LoadingSpinner";
import LiveCursorProvider from "./LiveCursorProvider";

function RoomProvider({ roomId, children }: {
    roomId: string;
    children: React.ReactNode;
}) {
    console.log("=== RoomProvider START ===");
    console.log("RoomProvider - roomId:", roomId);
    console.log("RoomProvider - children:", children);

    if (!roomId) {
        throw new Error("RoomProvider requires a valid roomId");
    }

    console.log("RoomProvider - About to render RoomProviderWrapper");
    return (
        <RoomProviderWrapper
            id={roomId}
            initialPresence={{
                cursor: null
            }}
        >
            <ClientSideSuspense fallback={<LoadingSpinner />}>
                <LiveCursorProvider>
                    {children}
                </LiveCursorProvider>
            </ClientSideSuspense>
        </RoomProviderWrapper>
    )
}
export default RoomProvider