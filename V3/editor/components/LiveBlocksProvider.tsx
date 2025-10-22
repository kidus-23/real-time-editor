"use client";

import { LiveblocksProvider } from "@liveblocks/react/suspense";

function LiveBlocksProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY) {
    throw new Error("live blocks public key not set");
  }

  return (
    <LiveblocksProvider
      throttle={100}
      authEndpoint={"/auth-endpoint"}
      // Allow resolving users and room info for notifications
      resolveUsers={async ({ userIds }) => {
        // Return user info for notifications
        return userIds.map((userId) => ({
          name: userId.split("@")[0], // Use email prefix as fallback
          email: userId,
          avatar: undefined as unknown as string,
          color: "#888888",
        }));
      }}
      resolveMentionSuggestions={async () => {
        // Return empty array for now
        return [];
      }}
    >
      {children}
    </LiveblocksProvider>
  );
}
export default LiveBlocksProvider;
