// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqV2MqEoeaLJMI40Ud-wSA7VXo39RqBbA",
  authDomain: "codefest2025---insightloan.firebaseapp.com",
  projectId: "codefest2025---insightloan",
  storageBucket: "codefest2025---insightloan.firebasestorage.app",
  messagingSenderId: "461130606784",
  appId: "1:461130606784:web:e74a290ae8c0f8456c6525",
  measurementId: "G-XF476EL15K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Auth
const auth = getAuth(app);

export { app, analytics, auth };
