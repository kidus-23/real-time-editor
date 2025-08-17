import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeqB1IL3DENo3pRQ8B_0ozMLRcQn1Ppzk",
  authDomain: "real-time-editor-8824b.firebaseapp.com",
  projectId: "real-time-editor-8824b",
  storageBucket: "real-time-editor-8824b.firebasestorage.app",
  messagingSenderId: "166772649209",
  appId: "1:166772649209:web:cef9b2e515f842aa6c0628"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };