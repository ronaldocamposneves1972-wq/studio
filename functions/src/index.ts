
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


const ADMIN_USER_UID = "zt6xq8RcNGX1Ct8OwysKCGY8H7s2";
const ADMIN_USER_EMAIL = "kaiqueguilhermepereiramiranda@gmail.com";

const allPermissions = {
  clients: { create: true, read: true, update: true, delete: true },
  products: { create: true, read: true, update: true, delete: true },
  sales_proposals: { create: true, read: true, update: true, delete: true },
  transactions: { create: true, read: true, update: true, delete: true },
  users: { create: true, read: true, update: true, delete: true },
  suppliers: { create: true, read: true, update: true, delete: true },
  cost_centers: { create: true, read: true, update: true, delete: true },
  expense_categories: { create: true, read: true, update: true, delete: true },
  quizzes: { create: true, read: true, update: true, delete: true },
  financial_institutions: { create: true, read: true, update: true, delete: true },
  commissions: { create: true, read: true, update: true, delete: true },
};

/**
 * An HTTP-callable function to provision or update the admin user.
 * Can be called manually or from a script for setup.
 */
export const provisionAdmin = functions.https.onCall(async (data, context) => {
  const adminDocRef = admin.firestore().collection("users").doc(ADMIN_USER_UID);

  try {
    await adminDocRef.set({
      id: ADMIN_USER_UID,
      firstName: 'Kaique',
      lastName: 'Miranda',
      name: 'Kaique Miranda',
      email: ADMIN_USER_EMAIL,
      role: 'Admin',
      permissions: allPermissions
    }, { merge: true });

    console.log(`Admin user ${ADMIN_USER_EMAIL} provisioned successfully.`);
    return { success: true, message: "Admin user provisioned." };
  } catch (error) {
    console.error(`Failed to provision admin user:`, error);
    throw new functions.https.HttpsError("internal", "Could not provision admin user.", error);
  }
});
