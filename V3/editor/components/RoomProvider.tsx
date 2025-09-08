'use client'

import { ClientSideSuspense, RoomProvider as RoomProviderWrapper } from "@liveblocks/react/suspense";
import LoadingSpinner from "./LoadingSpinner";
import LiveCursorProvider from "./LiveCursorProvider";

function RoomProvider({ roomId, children }: {
    roomId: string;
    children: React.ReactNode;
}) {
    if (!roomId) {
        throw new Error("RoomProvider requires a valid roomId");
    }

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