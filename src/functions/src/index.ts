
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

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
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user document in Firestore, assigning 'Admin' role
 * and full permissions to every new user.
 */
export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userDocRef = admin.firestore().collection("users").doc(uid);

  console.log(`New user ${email} detected. Provisioning with full admin permissions.`);
  
  const adminData = {
    id: uid,
    email: email,
    name: displayName || email || 'Novo Admin',
    role: 'Admin',
    permissions: allPermissions,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  return userDocRef.set(adminData);
});
