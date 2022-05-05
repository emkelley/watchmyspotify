import { TRACK_META } from "@/interfaces/TRACK_META";
import { initializeApp } from "firebase/app";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";

const config = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: "auth.mvdb.one",
  projectId: "wms-saas",
  storageBucket: "wms-saas.appspot.com",
  messagingSenderId: "2283260631",
  appId: "1:2283260631:web:f48df16306bdaf69bbfe92",
};

initializeApp(config);

const db = getFirestore();

// * Cache Stuff * \\
const cacheRef = collection(db, "songs");

export const checkCache = async (
  TRACK_META: TRACK_META
): Promise<TRACK_META | null> => {
  let result: TRACK_META | null = null;
  const q = query(cacheRef, where("spotify", "==", TRACK_META.spotify));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => (result = doc.data() as TRACK_META));
  return result;
};

export const cacheResults = async (TRACK_META: TRACK_META): Promise<string> => {
  const docRef = await addDoc(cacheRef, {
    added: Date.now(),
    name: TRACK_META.name,
    artist: TRACK_META.artist,
    album: TRACK_META.album,
    image: TRACK_META.image,
    spotify: TRACK_META.spotify,
    youtube: TRACK_META.youtube,
  });
  return docRef.id;
};
// export const cacheResults = async (TRACK_META: TRACK_META): Promise<string> => {
//   try {
//     const docRef = await addDoc(cacheRef, {
//       added: Date.now(),
//       name: TRACK_META.name,
//       artist: TRACK_META.artist,
//       album: TRACK_META.album,
//       image: TRACK_META.image,
//       spotify: TRACK_META.spotify,
//       youtube: TRACK_META.youtube,
//     });
//     return docRef.id;
//   } catch (error) {
//     return error as string;
//   }
// };
