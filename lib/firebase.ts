import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Suppress transient connection logs from polluting the console
setLogLevel('error');

// Use initializeFirestore to set experimentalForceLongPolling for better stability in iframe/proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    // Explicitly check from server to ensure we bypass cache and verify path
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    } else {
      console.warn("Firestore warmup check failed (expected if 'test/connection' doc doesn't exist, but verifies reachability):", error);
    }
  }
}
testConnection();
