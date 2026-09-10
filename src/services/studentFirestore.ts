import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  Unsubscribe,
  getDocFromServer,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Student, TeacherSettings } from '../types';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Clean object for Firestore (strip undefined values)
export function sanitizeData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Test connection to Firestore on app startup
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or unreachable.');
    }
    return false;
  }
}

/**
 * Subscribe to all students in real-time (for Teacher Panel)
 * No localStorage used.
 */
export function subscribeAllStudents(
  onData: (students: Student[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const collectionPath = 'students';
  try {
    const studentsCol = collection(db, collectionPath);
    return onSnapshot(
      studentsCol,
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Student;
          list.push({
            ...data,
            id: docSnap.id || data.id,
          });
        });
        // Sort by creation or update date descending
        list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        onData(list);
      },
      (error) => {
        console.error('Error listening to students collection in Firestore:', error);
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
    return () => {};
  }
}

/**
 * Subscribe to a single student in real-time (for Student Public Link)
 * Students see only their own information. No login required.
 */
export function subscribeSingleStudent(
  studentId: string,
  onData: (student: Student | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docPath = `students/${studentId}`;
  try {
    const docRef = doc(db, 'students', studentId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        const data = snapshot.data() as Student;
        onData({
          ...data,
          id: snapshot.id || data.id || studentId,
        });
      },
      (error) => {
        console.error(`Error listening to student ${studentId} in Firestore:`, error);
        if (onError) {
          onError(error);
        } else {
          handleFirestoreError(error, OperationType.GET, docPath);
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
    return () => {};
  }
}

/**
 * Fetch a single student once (fallback or initial fetch)
 */
export async function fetchSingleStudent(studentId: string): Promise<Student | null> {
  const docPath = `students/${studentId}`;
  try {
    const docRef = doc(db, 'students', studentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as Student;
    return {
      ...data,
      id: snap.id || data.id || studentId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

/**
 * Save or update student information in Firestore (Teacher action)
 * Automatically syncs with Firestore. No localStorage used.
 */
export async function saveStudentToFirestore(student: Student): Promise<void> {
  const docPath = `students/${student.id}`;
  try {
    const docRef = doc(db, 'students', student.id);
    const payload = sanitizeData({
      ...student,
      updatedAt: Date.now(),
    });
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a student from Firestore (Teacher action)
 */
export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  const docPath = `students/${studentId}`;
  try {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Subscribe to Teacher Settings in real-time
 */
export function subscribeTeacherSettings(
  onData: (settings: TeacherSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docPath = 'settings/general';
  try {
    const docRef = doc(db, 'settings', 'general');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as TeacherSettings);
        }
      },
      (error) => {
        console.warn('Error listening to teacher settings in Firestore:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to settings:', err);
    return () => {};
  }
}

/**
 * Save Teacher Settings to Firestore
 */
export async function saveSettingsToFirestore(settings: TeacherSettings): Promise<void> {
  const docPath = 'settings/general';
  try {
    const docRef = doc(db, 'settings', 'general');
    const payload = sanitizeData({
      ...settings,
      updatedAt: Date.now(),
    });
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
