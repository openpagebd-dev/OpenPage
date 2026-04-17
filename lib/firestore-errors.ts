import { auth } from '@/lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessageText = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessageText,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  const errorMessage = JSON.stringify(errInfo);
  
  // CRITICAL: We only throw for non-benign errors to avoid breaking the retry/listener logic.
  // "CANCELLED" / "idle stream" errors are common in the sandbox environment and are handled by SDK retries.
  const isBenign = errorMessageText.toLowerCase().includes('cancelled') || 
                   errorMessageText.toLowerCase().includes('idle stream');

  if (!isBenign) {
    console.error('Firestore Error:', errorMessage);
    throw new Error(errorMessage);
  } else {
    // Log as info/warn to reduce "error noise" for expected connection cycling
    console.info('Firestore Stream Cycle:', errorMessage);
    console.warn('Suppressing benign Firestore stream cancellation error to maintain connection stability.');
  }
}
