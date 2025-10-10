
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It immediately throws any received error to be caught by Next.js's global-error.tsx.
 * This component should be placed within a client-side context (like a provider).
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    /**
     * The callback for the 'permission-error' event.
     * When an error is received, it is immediately thrown.
     * @param error The FirestorePermissionError object emitted from the emitter.
     */
    const handleError = (error: FirestorePermissionError) => {
      // Throw the error directly. Next.js's error boundary (global-error.tsx)
      // will catch this and display the development overlay.
      throw error;
    };

    // Subscribe to the 'permission-error' event.
    errorEmitter.on('permission-error', handleError);

    // Cleanup function to unsubscribe from the event when the component unmounts.
    // This is crucial to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // This component does not render any UI.
  return null;
}
