//auth.ts
import { create } from 'zustand';
import { Doctor } from '../types';
import { auth, db } from '../firebase';
import { store } from '../store/store';
import { setUser,clearUser } from '../store/userSlice';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  doctor: Doctor | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (doctor: Omit<Doctor, 'id'> & { password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  doctor: null,
  isAuthenticated: false,
  loading: true, // initially loading

  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const docRef = doc(db, 'doctors', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Doctor profile not found');

    const doctorData = docSnap.data() as Doctor;
    set({ doctor: doctorData, isAuthenticated: true, loading: false });
  },

  logout: async () => {
    await signOut(auth);
    set({ doctor: null, isAuthenticated: false, loading: false });
  // Clear Redux state
  store.dispatch(clearUser());

  console.log('User logged out');  },

  signup: async () => {
    // handled elsewhere
  }
}));

// ✅ Automatically restore auth state on reload
const restoreAuth = async (user: User) => {
  const docRef = doc(db, 'doctors', user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const doctorData = docSnap.data() as Doctor;
    useAuthStore.setState({ doctor: doctorData, isAuthenticated: true, loading: false });
  } else {
    useAuthStore.setState({ doctor: null, isAuthenticated: false, loading: false });
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    restoreAuth(user);
  } else {
    useAuthStore.setState({ doctor: null, isAuthenticated: false, loading: false });
  }
  
});
  