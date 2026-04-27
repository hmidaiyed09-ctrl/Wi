import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA2yPx9b3DOxQAry7N8FzHIikZROFNZmsw',
  authDomain: 'quiz-tower-hj4k3.firebaseapp.com',
  projectId: 'quiz-tower-hj4k3',
  storageBucket: 'quiz-tower-hj4k3.firebasestorage.app',
  messagingSenderId: '190127005685',
  appId: '1:190127005685:web:900e6e6f39f7431900cabc',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();

let firestoreConfigured = false;
if (!firestoreConfigured) {
  firestore.settings({
    experimentalAutoDetectLongPolling: true,
  });
  firestoreConfigured = true;
}

export { firebase };
