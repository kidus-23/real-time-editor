'use client'

import { ClientSideSuspense, RoomProvider as RoomProviderWrapper } from "@liveblocks/react/suspense";
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
            // Enable faster initial connection
            initialStorage={{}}
        >
            <ClientSideSuspense
                fallback={
                    <div className="flex flex-col items-center justify-center h-screen gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                        </div>
                        <div className="text-muted-foreground text-sm font-medium">Connecting...</div>
                    </div>
                }
            >
                <LiveCursorProvider>
                    {children}
                </LiveCursorProvider>
            </ClientSideSuspense>
        </RoomProviderWrapper>
    )
}

export default RoomProvider