
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * This function is a fallback/logging mechanism.
 * The primary user document creation logic has been moved to the client-side
 * registration form to ensure reliability. This function will log the creation
 * and can be extended for other backend-only tasks in the future.
 */
export const createUserDocument = functions.auth.user().onCreate((user) => {
  const { uid, email, displayName } = user;
  console.log(`New user registered: UID=${uid}, Email=${email}, Name=${displayName || 'N/A'}`);
  
  // You can add other backend-only logic here, like sending a welcome email, etc.
  // The Firestore document is now created on the client-side.
  
  return null; // End the function execution.
});
