import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuth } from '../firebase/config';
import { Student, TeacherSettings } from '../types';
import {
  loadStudents,
  saveStudents,
  loadSettings,
  saveSettings,
} from '../utils/storage';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

export interface SyncStatusInfo {
  status: SyncStatus;
  lastSyncTime: number | null;
  errorMessage?: string;
}

type StatusListener = (info: SyncStatusInfo) => void;

class FirebaseSyncService {
  private status: SyncStatus = 'idle';
  private lastSyncTime: number | null = null;
  private errorMessage: string | undefined = undefined;
  private listeners: Set<StatusListener> = new Set();
  private studentsUnsubscribe: Unsubscribe | null = null;
  private settingsUnsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  private onStudentsCallback?: (students: Student[]) => void;
  private onSettingsCallback?: (settings: TeacherSettings) => void;

  constructor() {
    // Listen to browser network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateStatus('syncing');
        this.performFullSync().catch((err) => console.warn('Sync on online error:', err));
      });
      window.addEventListener('offline', () => {
        this.updateStatus('offline');
      });
    }
  }

  // Subscribe to status updates
  public subscribeStatus(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener({
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      errorMessage: this.errorMessage,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SyncStatusInfo {
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      errorMessage: this.errorMessage,
    };
  }

  private updateStatus(status: SyncStatus, errorMsg?: string) {
    this.status = status;
    if (errorMsg !== undefined) {
      this.errorMessage = errorMsg;
    }
    if (status === 'synced') {
      this.lastSyncTime = Date.now();
      this.errorMessage = undefined;
    }
    const info = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(info);
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }

  // Clean object for Firestore (strip undefined values)
  private sanitizeData<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Start bidirectional real-time synchronization
   */
  public async initSync(options?: {
    onStudentsUpdated?: (students: Student[]) => void;
    onSettingsUpdated?: (settings: TeacherSettings) => void;
  }): Promise<void> {
    if (options?.onStudentsUpdated) {
      this.onStudentsCallback = options.onStudentsUpdated;
    }
    if (options?.onSettingsUpdated) {
      this.onSettingsCallback = options.onSettingsUpdated;
    }

    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    if (!navigator.onLine) {
      this.updateStatus('offline');
      return;
    }

    this.updateStatus('syncing');

    try {
      await ensureAuth();
      await this.performFullSync();
      this.setupRealtimeListeners();
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Firebase initSync encountered an issue (offline fallback active):', err);
      this.updateStatus('offline', err?.message || 'خطا در ارتباط با سرور فایربیس');
    }
  }

  /**
   * Setup realtime Firestore listeners
   */
  private setupRealtimeListeners() {
    try {
      // 1. Students collection listener
      const studentsCol = collection(db, 'students');
      this.studentsUnsubscribe = onSnapshot(
        studentsCol,
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites) {
            // Local write not yet acknowledged by server
            return;
          }

          const localStudents = loadStudents();
          const localMap = new Map<string, Student>();
          localStudents.forEach((s) => localMap.set(s.id, s));

          let hasChanges = false;
          const remoteList: Student[] = [];

          snapshot.forEach((docSnap) => {
            const remoteData = docSnap.data() as Student;
            remoteList.push(remoteData);

            const local = localMap.get(remoteData.id);
            if (!local) {
              localMap.set(remoteData.id, remoteData);
              hasChanges = true;
            } else {
              const remoteTime = Number(remoteData.updatedAt || remoteData.createdAt || 0);
              const localTime = Number(local.updatedAt || local.createdAt || 0);

              if (remoteTime > localTime) {
                localMap.set(remoteData.id, remoteData);
                hasChanges = true;
              }
            }
          });

          if (hasChanges) {
            const updatedStudents = Array.from(localMap.values());
            // Sort by createdAt descending
            updatedStudents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            saveStudents(updatedStudents);
            if (this.onStudentsCallback) {
              this.onStudentsCallback(updatedStudents);
            }
          }

          this.updateStatus('synced');
        },
        (error) => {
          console.warn('Firestore students listener error:', error);
          this.updateStatus('offline', error.message);
        }
      );

      // 2. Settings document listener
      const settingsDocRef = doc(db, 'settings', 'general');
      this.settingsUnsubscribe = onSnapshot(
        settingsDocRef,
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites || !snapshot.exists()) {
            return;
          }
          const remoteSettings = snapshot.data() as TeacherSettings & { updatedAt?: number };
          const localSettings = loadSettings();

          const remoteTime = Number(remoteSettings.updatedAt || 0);
          const localTime = Number((localSettings as any).updatedAt || 0);

          if (remoteTime > localTime) {
            saveSettings(remoteSettings);
            if (this.onSettingsCallback) {
              this.onSettingsCallback(remoteSettings);
            }
          }
        },
        (error) => {
          console.warn('Firestore settings listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to setup realtime listeners:', err);
    }
  }

  /**
   * Perform initial two-way reconciliation
   */
  public async performFullSync(): Promise<void> {
    if (!navigator.onLine) {
      this.updateStatus('offline');
      return;
    }

    this.updateStatus('syncing');

    try {
      await ensureAuth();

      // Sync Students
      const localStudents = loadStudents();
      const localMap = new Map<string, Student>();
      localStudents.forEach((s) => localMap.set(s.id, s));

      const studentsCol = collection(db, 'students');
      const snapshot = await getDocs(studentsCol);

      let localUpdated = false;

      // 1. Process remote docs
      const remoteIds = new Set<string>();
      for (const docSnap of snapshot.docs) {
        const remoteData = docSnap.data() as Student;
        remoteIds.add(remoteData.id);

        const local = localMap.get(remoteData.id);
        if (!local) {
          // New student from cloud -> save locally
          localMap.set(remoteData.id, remoteData);
          localUpdated = true;
        } else {
          const remoteTime = Number(remoteData.updatedAt || remoteData.createdAt || 0);
          const localTime = Number(local.updatedAt || local.createdAt || 0);

          if (remoteTime > localTime) {
            // Cloud is newer -> update local
            localMap.set(remoteData.id, remoteData);
            localUpdated = true;
          } else if (localTime > remoteTime) {
            // Local is newer -> push to cloud
            await setDoc(doc(db, 'students', local.id), this.sanitizeData(local));
          }
        }
      }

      // 2. Upload any local students not in remote
      for (const local of localStudents) {
        if (!remoteIds.has(local.id)) {
          await setDoc(doc(db, 'students', local.id), this.sanitizeData(local));
        }
      }

      if (localUpdated) {
        const mergedList = Array.from(localMap.values());
        mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        saveStudents(mergedList);
        if (this.onStudentsCallback) {
          this.onStudentsCallback(mergedList);
        }
      }

      // Sync Settings
      const settingsDocRef = doc(db, 'settings', 'general');
      const settingsSnap = await getDoc(settingsDocRef);
      const localSettings = loadSettings();

      if (!settingsSnap.exists()) {
        // Push local settings to cloud
        await setDoc(settingsDocRef, this.sanitizeData({
          ...localSettings,
          updatedAt: Date.now(),
        }));
      } else {
        const remoteSettings = settingsSnap.data() as TeacherSettings & { updatedAt?: number };
        const remoteTime = Number(remoteSettings.updatedAt || 0);
        const localTime = Number((localSettings as any).updatedAt || 0);

        if (remoteTime > localTime) {
          saveSettings(remoteSettings);
          if (this.onSettingsCallback) {
            this.onSettingsCallback(remoteSettings);
          }
        } else if (localTime > remoteTime) {
          await setDoc(settingsDocRef, this.sanitizeData({
            ...localSettings,
            updatedAt: Date.now(),
          }));
        }
      }

      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Full sync error:', err);
      this.updateStatus('error', err?.message || 'خطا در همگام‌سازی');
      throw err;
    }
  }

  /**
   * Sync a single student save to Firestore
   */
  public async syncStudentToCloud(student: Student): Promise<void> {
    if (!navigator.onLine) return;
    try {
      await ensureAuth();
      const studentWithTimestamp = {
        ...student,
        updatedAt: student.updatedAt || Date.now(),
      };
      await setDoc(doc(db, 'students', student.id), this.sanitizeData(studentWithTimestamp));
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Failed to sync student to cloud:', err);
      this.updateStatus('error', err?.message);
    }
  }

  /**
   * Delete a student from Firestore
   */
  public async deleteStudentFromCloud(studentId: string): Promise<void> {
    if (!navigator.onLine) return;
    try {
      await ensureAuth();
      await deleteDoc(doc(db, 'students', studentId));
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Failed to delete student from cloud:', err);
      this.updateStatus('error', err?.message);
    }
  }

  /**
   * Sync settings update to Firestore
   */
  public async syncSettingsToCloud(settings: TeacherSettings): Promise<void> {
    if (!navigator.onLine) return;
    try {
      await ensureAuth();
      await setDoc(doc(db, 'settings', 'general'), this.sanitizeData({
        ...settings,
        updatedAt: Date.now(),
      }));
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Failed to sync settings to cloud:', err);
      this.updateStatus('error', err?.message);
    }
  }

  /**
   * Batch push all local data to cloud (e.g. after restoring backup)
   */
  public async uploadAllLocalToCloud(students: Student[], settings?: TeacherSettings): Promise<void> {
    if (!navigator.onLine) return;
    this.updateStatus('syncing');
    try {
      await ensureAuth();
      for (const student of students) {
        await setDoc(doc(db, 'students', student.id), this.sanitizeData(student));
      }
      if (settings) {
        await setDoc(doc(db, 'settings', 'general'), this.sanitizeData({
          ...settings,
          updatedAt: Date.now(),
        }));
      }
      this.updateStatus('synced');
    } catch (err: any) {
      console.warn('Failed to upload all to cloud:', err);
      this.updateStatus('error', err?.message);
    }
  }

  /**
   * Cleanup listeners
   */
  public destroy() {
    if (this.studentsUnsubscribe) {
      this.studentsUnsubscribe();
      this.studentsUnsubscribe = null;
    }
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const firebaseSync = new FirebaseSyncService();
