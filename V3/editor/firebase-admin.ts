import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Deleted:const servicekey = require("@/service_key.json");

let app: App;

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

const adminDB = getFirestore(app);

export { app as adminApp, adminDB };