
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user document in Firestore.
 */
export const createUserDocument = functions.auth.user().onCreate((user) => {
  const { uid, email } = user;

  // Reference to the new user document in the 'users' collection
  const userDocRef = admin.firestore().collection("users").doc(uid);

  // Data to be saved in the new document
  const userData = {
    email: email,
    role: "User", // Default role for new users
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    id: uid, // Storing the UID in the document as well
  };

  // Set the document in Firestore
  return userDocRef.set(userData)
    .then(() => {
      console.log(`Successfully created user document for UID: ${uid}`);
      return null;
    })
    .catch((error) => {
      console.error(`Error creating user document for UID: ${uid}`, error);
      // Throwing an error is important for retries and visibility in logs
      throw new functions.https.HttpsError("internal", "Could not create user document.");
    });
});
