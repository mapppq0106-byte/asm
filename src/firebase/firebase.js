// CÁCH SỬA (Sử dụng cú pháp module hiện đại)
import firebase from 'firebase/compat/app'; // Dùng compat app
import 'firebase/compat/firestore';        // Dùng compat firestore
import 'firebase/compat/auth';             // Dùng compat auth
import 'firebase/compat/storage';          // Dùng compat storage
// HOẶC, nếu bạn muốn dùng cú pháp mới nhất (nhưng phức tạp hơn trong config)
// bạn phải dùng cú pháp: import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDAmCEfsbqTnC6jjGz02YDFlmvYBshns58",
  authDomain: "poly-6bb26.firebaseapp.com",
  projectId: "poly-6bb26",
  storageBucket: "poly-6bb26.firebasestorage.app",
  messagingSenderId: "212196766720",
  appId: "1:212196766720:web:e8cde78f538e4b253554e5",
  measurementId: "G-JZN6KERPGR"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Đảm bảo db được export
export { db, auth, storage };