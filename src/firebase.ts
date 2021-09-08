import { CacheItem } from "./types/CacheItem";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const config = {
  apiKey: process.env.VITE_FIREBASE,
  authDomain: "watchmyspotify.firebaseapp.com",
  projectId: "watchmyspotify",
  storageBucket: "watchmyspotify.appspot.com",
  messagingSenderId: "580427405342",
  appId: "1:580427405342:web:15e1864b0705e95379360f",
};

const firebaseApp = initializeApp(config);
const db = getFirestore();
const cacheRef = collection(db, "cache");

export const checkCache = async (trackURL: string) => {
  let result = {} as CacheItem;
  const q = query(cacheRef, where("spotifyURL", "==", trackURL));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => (result = doc.data() as CacheItem));
  return result.ytID;
};

export const cacheResults = async (
  trackName: string,
  ytID: string,
  spotifyURL: string
) => {
  const docRef = await addDoc(cacheRef, {
    ["track-name"]: trackName,
    ["track-yt"]: ytID,
    ["track-spotify"]: spotifyURL,
  });
  console.log(`💾 Song cached: ${ytID} - ${docRef.id}`);
  return docRef.id;
};
