// src/services/apis/auth.js

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  getIdToken,
} from "firebase/auth";

/**
 * Inicia sesión con email y contraseña.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function login({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Registra un nuevo usuario con email y contraseña.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function register({ email, password }) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Cierra la sesión del usuario actual.
 * @returns {Promise<void>}
 */
export function logout() {
  return firebaseSignOut(auth);
}

/**
 * Callback para cambios en el estado de autenticación.
 * @param {(user: import("firebase/auth").User|null) => void} callback
 * @returns {() => void} función para desuscribirse
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Solicita un email de recuperación de contraseña.
 * @param {string} email
 * @returns {Promise<void>}
 */
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Reautentica al usuario antes de operaciones sensibles (p.ej. cambiar contraseña).
 * @param {string} currentPassword
 * @returns {Promise<void>}
 */
export async function reauthenticate(currentPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No hay un usuario autenticado");
  }
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
}

/**
 * Cambia la contraseña del usuario ya autenticado (debe reautenticarse antes).
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export function changePassword(newPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay un usuario autenticado");
  }
  return fbUpdatePassword(user, newPassword);
}

/**
 * Devuelve el usuario actualmente autenticado (o null si no hay).
 * @returns {import("firebase/auth").User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtiene el token de Firebase para el usuario actual (útil para llamadas a tus propias Functions).
 * @returns {Promise<string|null>}
 */
export async function getIdTokenForUser() {
  const user = auth.currentUser;
  if (!user) return null;
  return getIdToken(user, /* forceRefresh=*/ false);
}
