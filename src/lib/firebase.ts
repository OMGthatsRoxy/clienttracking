import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGs4G8VrT5ooLJy9emlfItMrx447dMzi8",
  authDomain: "client-tracking-system-b5d89.firebaseapp.com",
  projectId: "client-tracking-system-b5d89",
  storageBucket: "client-tracking-system-b5d89.firebasestorage.app",
  messagingSenderId: "211406703842",
  appId: "1:211406703842:web:2669493b1b0e5f68b0e2bb",
  measurementId: "G-1GK1JHRNBC"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);