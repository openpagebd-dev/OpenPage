'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface FirebaseContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed. User:", user ? `${user.uid} (${user.email})` : "Logged Out");
      setUser(user);
      if (user) {
        // Fetch or create user profile
        const userRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            
            // Correction: If this is the master admin but role is wrong in DB, fix it.
            if (user.email === 'openpagebd@gmail.com' && data.role !== 'admin') {
              console.log("Correcting admin role for master email...");
              setDoc(userRef, { role: 'admin' }, { merge: true }).catch(console.error);
            }
          } else {
            console.log("No profile found. Creating reader profile for:", user.uid);
            // New user, create profile
            setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              role: user.email === 'openpagebd@gmail.com' ? 'admin' : 'contributor',
              bloodGroup: null,
              isDonor: false,
              reputation: 100,
              xp: 0,
              rank: 'Initiate',
              commendationsCount: 0,
              createdAt: serverTimestamp(),
            }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile Sync Error Detail:", error.message, "Path:", `users/${user.uid}`, "Current UID:", user.uid);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'openpagebd@gmail.com',
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
