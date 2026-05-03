import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBgcljCjBrEhgm4hdwqmmwKZjuDjPd966A",
  authDomain: "gen-lang-client-0611447978.firebaseapp.com",
  projectId: "gen-lang-client-0611447978",
  storageBucket: "gen-lang-client-0611447978.firebasestorage.app",
  messagingSenderId: "1093124345535",
  appId: "1:1093124345535:web:c03896e94f0b34ebeec00a",
  measurementId: "G-YX2L48Y15W"
};

export const firebaseApp = initializeApp(firebaseConfig);

export const analyticsPromise = isSupported().then((supported) => (
  supported ? getAnalytics(firebaseApp) : null
));
