
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "engvision-7u54g",
  "appId": "1:14737109805:web:b89aaa0518912f25bfd9a4",
  "storageBucket": "engvision-7u54g.firebasestorage.app",
  "apiKey": "AIzaSyCAFwcvx-zJygrbvbL77NLuFwjRIvEc1hs",
  "authDomain": "engvision-7u54g.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "14737109805"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
