import { Liveblocks } from "@liveblocks/node";

let instance: Liveblocks | undefined;

function getInstance(): Liveblocks {
    if (!instance) {
        const key = process.env.LIVEBLOCKS_PRIVATE_KEY;
        if (!key) {
            throw new Error("LiveBlocks Private key not set");
        }
        instance = new Liveblocks({
            secret: key,
        });
    }
    return instance;
}

// Lazy proxy: initialization is deferred until the first property access.
// Importing this module used to throw at build time (Next.js loads route
// modules during build-time page-data collection, before runtime env vars
// are available), which broke plain `npm run build` locally. Call sites
// that do `liveblocks.someMethod(...)` are unaffected.
export default new Proxy({} as Liveblocks, {
    get(_target, prop) {
        return (getInstance() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
