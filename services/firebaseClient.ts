import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA2yPx9b3DOxQAry7N8FzHIikZROFNZmsw',
  authDomain: 'quiz-tower-hj4k3.firebaseapp.com',
  databaseURL: 'https://quiz-tower-hj4k3-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId: 'quiz-tower-hj4k3',
  storageBucket: 'quiz-tower-hj4k3.firebasestorage.app',
  messagingSenderId: '190127005685',
  appId: '1:190127005685:web:900e6e6f39f7431900cabc',
};

export const firebaseAuthConfig = {
  googleWebClientId: '190127005685-4fnu1nfr3k5f4sjnacvesmupqr0k1hjr.apps.googleusercontent.com',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const realtimeDb = firebase.database();
export const firestore = firebase.firestore();

let firestoreConfigured = false;
if (!firestoreConfigured) {
  firestore.settings({
    experimentalAutoDetectLongPolling: true,
  });
  firestoreConfigured = true;
}

export { firebase };
