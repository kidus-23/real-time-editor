'use client'

import { useMyPresence, useOthers } from "@liveblocks/react/suspense";
import { PointerEvent, useCallback, useMemo } from "react";
import FollowPointer from "./FollowPointer";

function LiveCursorProvider({ children }: { children: React.ReactNode }) {
    const [, updateMyPresence] = useMyPresence();
    const others = useOthers();

    // Memoize the filtered others to avoid unnecessary re-renders
    const othersWithCursor = useMemo(() =>
        others.filter((other) => other.presence.cursor !== null),
        [others]
    );

    // Use useCallback to memoize event handlers
    const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const cursor = { x: Math.floor(e.pageX), y: Math.floor(e.pageY) };
        updateMyPresence({ cursor });
    }, [updateMyPresence]);

    const handlePointerLeave = useCallback(() => {
        updateMyPresence({ cursor: null });
    }, [updateMyPresence]);

    return (
        <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{ height: '100%', width: '100%' }}
        >
            {othersWithCursor.map(({ connectionId, presence, info }) => (
                <FollowPointer
                    key={connectionId}
                    info={info}
                    x={presence.cursor!.x}
                    y={presence.cursor!.y}
                />
            ))}
            {children}
        </div>
    );
}
export default LiveCursorProvider;