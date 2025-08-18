import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const servicekey = require("@/service_key.json");

let app: App;

if (getApps().length === 0) {
    app = initializeApp({
        credential: cert(servicekey),
    });
}
else {
    app = getApp();
}

const adminDB = getFirestore(app);

export { app as adminApp, adminDB };

