/**
 * Firebase Admin SDK initialization and configuration
 * Sets up the connection to Firebase Firestore database using service account credentials
 * @module firebase
 */

import admin from "firebase-admin";
import path from "path";
import fs from "fs";

/**
 * Path to the Firebase service account key JSON file
 * Resolves to the project root directory from the compiled dist folder
 * @constant {string}
 * @example
 * // Expected file location: /project-root/serviceAccountKey.json
 * // When running from dist/: ../serviceAccountKey.json
 */
const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");

/**
 * Validates that the service account credentials file exists
 * Throws a descriptive error if the file is not found
 * @throws {Error} If serviceAccountKey.json is not found at the expected path
 */
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `serviceAccountKey.json not found at: ${serviceAccountPath}\n` +
    `Place the file in the project root directory.`
  );
}

/**
 * Firebase service account credentials loaded from JSON file
 * Contains private key and project configuration for Firebase Admin SDK
 * @constant {Object}
 * @see {@link https://firebase.google.com/docs/admin/setup#initialize-sdk|Firebase Admin Setup}
 */
const serviceAccount = require(serviceAccountPath);

/**
 * Initialize Firebase Admin SDK with service account credentials
 * This establishes the connection to Firebase services (Firestore, Auth, etc.)
 * @function initializeApp
 * @see {@link https://firebase.google.com/docs/admin/setup|Firebase Admin SDK Documentation}
 */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Firestore database instance
 * Provides access to the Firestore NoSQL database for storing and retrieving chat messages
 * @constant {admin.firestore.Firestore}
 * @exports db
 * @example
 * import { db } from './firebase';
 * 
 * // Access a collection
 * const messagesRef = db.collection('rooms').doc('room123').collection('messages');
 * 
 * // Add a document
 * await messagesRef.add({
 *   sender: 'user1',
 *   message: 'Hello!',
 *   timestamp: new Date()
 * });
 */
export const db = admin.firestore();