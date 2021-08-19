import firebase from 'firebase/app';
import 'firebase/firestore';

const config = {
  apiKey: process.env.VUE_APP_FIREBASE,
  authDomain: 'watchmyspotify.firebaseapp.com',
  projectId: 'watchmyspotify',
  storageBucket: 'watchmyspotify.appspot.com',
  messagingSenderId: '580427405342',
  appId: '1:580427405342:web:15e1864b0705e95379360f',
};

const firebaseApp = firebase.initializeApp(config);

export const db = firebaseApp.firestore();
