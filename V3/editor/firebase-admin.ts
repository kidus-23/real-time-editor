import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

// Lazy initialization: importing this module must never throw at build
// time — Next.js loads route modules during build-time page-data
// collection, before runtime env vars are available. The app is created
// on first use instead.
let app: App | undefined;

function getAdminApp(): App {
    if (!app) {
        if (getApps().length === 0) {
            const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : undefined;

            if (!serviceKey) {
                throw new Error("Firebase service account key is not configured");
            }

            app = initializeApp({
                credential: cert(serviceKey),
            });
        }
        else {
            app = getApp();
        }
    }
    return app;
}

// Proxies keep the existing call sites (`adminDB.collection(...)`,
// `adminApp`) unchanged while deferring initialization to first access.
// Methods are bound to the REAL instance so that any class-private
// internals work the same as direct calls.
export const adminApp: App = new Proxy({} as App, {
    get(_target, prop) {
        const instance = getAdminApp();
        const value = Reflect.get(instance as unknown as object, prop, instance);
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

export const adminDB: Firestore = new Proxy({} as Firestore, {
    get(_target, prop) {
        const instance = getFirestore(getAdminApp());
        const value = Reflect.get(instance as unknown as object, prop, instance);
        return typeof value === "function" ? value.bind(instance) : value;
    },
});
