'use client';

import { useState, useEffect, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/firebase.User
                const userRef = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserProfile({ ...firebaseUser, ...doc.data() } as UserProfile);
                    } else {
                        // Handle case where user exists in Auth but not Firestore
                        setUserProfile(firebaseUser as UserProfile);
                    }
                     setLoading(false);
                });
                return () => unsubProfile();
            } else {
                // User is signed out
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const value = { user, userProfile, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
