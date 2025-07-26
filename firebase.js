// Import the functions you need from the separate SDKs
import { initializeApp } from "@firebase/app";
import { getAnalytics } from "@firebase/analytics";
// Using separate Firebase SDKs for better bundle optimization
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYolSPx0mv7v5na-Xf6uDgTpg7adp1M_M",
  authDomain: "manage-office-sa.firebaseapp.com",
  projectId: "manage-office-sa",
  storageBucket: "manage-office-sa.firebasestorage.app",
  messagingSenderId: "234432618380",
  appId: "1:234432618380:web:74ddd28404a3ed832640a9",
  measurementId: "G-0VBQ3BKTWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);