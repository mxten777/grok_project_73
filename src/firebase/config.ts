import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApTdQ8ToMbU6edIWwjE2zYHmM43pfuDrw",
  authDomain: "grok-project-73.firebaseapp.com",
  projectId: "grok-project-73",
  storageBucket: "grok-project-73.firebasestorage.app",
  messagingSenderId: "113755337126",
  appId: "1:113755337126:web:33e0683c60b995fd895f67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);