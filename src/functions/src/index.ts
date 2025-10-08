
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

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
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user document in Firestore, assigning a role.
 * If the user is the designated admin, they get full permissions.
 */
export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userDocRef = admin.firestore().collection("users").doc(uid);

  // Check if the new user is the designated admin
  if (uid === ADMIN_USER_UID) {
    console.log(`Admin user ${email} detected. Provisioning with full permissions.`);
    const adminData = {
      id: uid,
      email: email || ADMIN_USER_EMAIL,
      name: displayName || 'Admin Kaique Miranda',
      role: 'Admin',
      permissions: allPermissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    return userDocRef.set(adminData);
  } 
  
  // For all other users, assign the 'Atendente' role by default
  else {
    console.log(`New user ${email} detected. Creating standard user document.`);
    const newUser = {
      id: uid,
      email: email,
      name: displayName || email || 'Novo Usuário',
      role: "Atendente",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    return userDocRef.set(newUser);
  }
});
