import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { AUTHORIZED_ADMIN_UID } from "../adminConfig.js";
import { auth } from "../firebaseAuth.js";

function requireAuth() {
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  return auth;
}

export async function signInAdmin(email, password) {
  const instance = requireAuth();
  const credential = await signInWithEmailAndPassword(instance, email, password);
  if (!isAuthorizedAdmin(credential.user)) {
    await signOut(instance);
    throw new Error("This account is not authorized to access the admin panel.");
  }
  return credential.user;
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(requireAuth(), callback);
}

export async function signOutAdmin() {
  await signOut(requireAuth());
}

export function isAuthorizedAdmin(user) {
  return user?.uid === AUTHORIZED_ADMIN_UID;
}
