
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { useUser as useAuthUserHook } from './auth/use-user';
import { useDoc } from './firestore/use-doc';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


// Return type for useFirebase()
export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '';
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
}


function BrandingEffect() {
  const firestore = useFirestore();
  const brandingDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'settings', 'branding') : null
  , [firestore]);
  const { data: brandingSettings } = useDoc<{ primaryColor: string, secondaryColor: string }>(brandingDocRef);

  useEffect(() => {
    if (brandingSettings) {
      const root = document.documentElement.style;
      root.setProperty('--primary-hsl', hexToHsl(brandingSettings.primaryColor));
      root.setProperty('--secondary-hsl', hexToHsl(brandingSettings.secondaryColor));
    }
  }, [brandingSettings]);

  return null;
}

/**
 * FirebaseProvider manages and provides Firebase services.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
    };
  }, [firebaseApp, firestore, auth, storage]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <BrandingEffect />
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
    const { storage } = useFirebase();
    return storage;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
