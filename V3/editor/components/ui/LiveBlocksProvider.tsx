'use client'

import { LiveBlocksProvider } from "@liveblocks/react/Suspense";

function LiveBlocksProvider({ childern }: { childern: React.ReactNode }) {
    if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY) {
        throw new Error("live blocks public key not set");
    }
    return (
        
    )
}
export default LiveBlocksProvider