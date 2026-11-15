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
//
// Methods are bound to the REAL instance before being returned: the
// Liveblocks class uses true private fields (`#private`), and a method
// invoked with `this` set to the Proxy itself would throw
// "Cannot read private member ... from an object whose class did not
// declare it". (This exact bug shipped once — the editor stuck on
// "Connecting..." because /auth-endpoint 500'd at prepareSession.)
const liveblocksClient = new Proxy({} as Liveblocks, {
    get(_target, prop) {
        const instance = getInstance();
        const value = Reflect.get(
            instance as unknown as object,
            prop,
            instance
        );
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

export default liveblocksClient;
