import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  partnerId?: string;
  coupleId?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  sharedXP: number;
  streakCount: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: 'active' | 'completed' | 'expired';
  createdBy: string;
  coupleId: string;
  createdAt: any;
}
