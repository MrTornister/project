import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDKhd4kpmwjslXo31vnn5PNiD9__VWuR3Q",
    authDomain: "workflow-c02a5.firebaseapp.com",
    projectId: "workflow-c02a5",
    storageBucket: "workflow-c02a5.firebasestorage.app",
    messagingSenderId: "72326698177",
    appId: "1:72326698177:web:ee801585f24d35d7fab040"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };