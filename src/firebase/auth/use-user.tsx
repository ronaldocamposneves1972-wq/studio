'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth'; // Corrected import
import { useAuth } from '@/firebase';

export interface UserAuthHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * React hook to observe user authentication state from Firebase.
 *
 * @returns {UserAuthHookResult} An object containing the current user, loading state, and any error.
 */
export const useUser = (): UserAuthHookResult => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // If auth service is not ready, do nothing.
    if (!auth) {
      setIsUserLoading(false); // No auth service, not loading.
      return;
    }

    setIsUserLoading(true); // Start loading when auth is available.
    setUserError(null);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser); // This will be the User object or null.
        setIsUserLoading(false);
      },
      (error) => {
        console.error("useUser: onAuthStateChanged error:", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [auth]); // Re-run effect if the auth instance changes

  return { user, isUserLoading, userError };
};

    