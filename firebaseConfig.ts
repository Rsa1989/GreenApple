
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Substitua os valores abaixo pelas configurações do seu projeto no Console do Firebase
// Vá em Project Settings > General > Your apps > SDK setup and configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAabF5ysInjMP75jKM3fxOS5VegaaqkOjw",
    authDomain: "greenapple-58510.firebaseapp.com",
    projectId: "greenapple-58510",
    storageBucket: "greenapple-58510.firebasestorage.app",
    messagingSenderId: "99006973932",
    appId: "1:99006973932:web:bebd46fbc17f30658ea2c9",
    measurementId: "G-RHQ5G6S5NM"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
