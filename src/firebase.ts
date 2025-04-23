// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDx360s2ATcx9NkfU0aedHS2Y7Qi5VYFjQ",
  authDomain: "afyaai-b6e4f.firebaseapp.com",
  projectId: "afyaai-b6e4f",
  storageBucket: "afyaai-b6e4f.firebasestorage.app",
  messagingSenderId: "755671451566",
  appId: "1:755671451566:web:b654640de52ae858b26a3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
