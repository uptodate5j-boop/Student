import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Settings,
  Database,
  Calendar,
  CheckCircle2,
  BookOpen,
  Sliders,
  Code2,
  Cloud,
  AlertCircle,
  Plus,
  LogOut,
  ShieldCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Student, TeacherSettings, ActiveTab } from './types';
import {
  decodeStudentFromUrl,
  INITIAL_SAMPLE_STUDENTS,
} from './utils/storage';
import {
  subscribeAllStudents,
  subscribeSingleStudent,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  subscribeTeacherSettings,
  saveSettingsToFirestore,
  testFirestoreConnection,
} from './services/studentFirestore';
import {
  signInTeacherWithGoogle,
  signOutTeacher,
  subscribeTeacherAuth,
} from './firebase/config';
import { downloadStandaloneHtml } from './utils/exportHtml';
import { getTodayPersianFormatted, toPersianDigits } from './utils/persianDate';
import { THEME_PALETTES } from './utils/theme';
import { StudentForm } from './components/StudentForm';
import { StudentTable } from './components/StudentTable';
import { StudentView } from './components/StudentView';
import { PrintModal } from './components/PrintModal';
import { ShareModal } from './components/ShareModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { TeacherSettingsModal } from './components/TeacherSettingsModal';
import { BackupModal } from './components/BackupModal';
import { AdminControlPanelModal } from './components/AdminControlPanelModal';
import { BackendControlPanel } from './components/BackendControlPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  // Teacher Auth State
  const [teacherUser, setTeacherUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [isTeacherLoading, setIsTeacherLoading] = useState(true);
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>({
    teacherName: 'استاد محترم',
    instituteName: 'کلاس‌های آموزشی و خصوصی',
    phone: '',
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Modals state
  const [shareStudent, setShareStudent] = useState<Student | null>(null);
  const [printStudent, setPrintStudent] = useState<Student | null>(null);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminControlOpen, setIsAdminControlOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Public Student View State (when student opens ?studentId=...)
  // Students must not log in and only view their own information
  const [publicStudentId, setPublicStudentId] = useState<string | null>(null);
  const [publicStudent, setPublicStudent] = useState<Student | null>(null);
  const [isPublicStudentLoading, setIsPublicStudentLoading] = useState(false);

  // Legacy fallback for ?data=...
  const [urlStudentData, setUrlStudentData] = useState<{
    student: Student;
    teacherSettings: TeacherSettings;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Detect URL parameters on mount
  useEffect(() => {
    const parseUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);

      // Check studentId query parameter
      const sid = searchParams.get('studentId') || searchParams.get('id');
      if (sid) {
        setPublicStudentId(sid);
        return;
      }

      // Check URL hash for studentId
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\??/, '');
        const hashParams = new URLSearchParams(hash);
        const hashSid = hashParams.get('studentId') || hashParams.get('id');
        if (hashSid) {
          setPublicStudentId(hashSid);
          return;
        }
        if (hash.startsWith('student=')) {
          setPublicStudentId(hash.substring(8));
          return;
        }
      }

      // Legacy ?data=... fallback
      let dataParam = '';
      if (searchParams.has('data')) {
        dataParam = searchParams.get('data') || '';
      } else if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\??/, '');
        const hashParams = new URLSearchParams(hash);
        dataParam = hashParams.get('data') || (hash.startsWith('data=') ? hash.substring(5) : '');
      }

      if (dataParam) {
        const decoded = decodeStudentFromUrl(dataParam);
        if (decoded) {
          setUrlStudentData(decoded);
          return;
        }
      }

      // No student ID in URL -> Teacher Panel Mode
      setPublicStudentId(null);
    };

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, []);

  // 2. Track Firebase Auth state for Teachers
  useEffect(() => {
    const unsubAuth = subscribeTeacherAuth((user) => {
      // Anonymous users are not counted as authenticated teachers
      if (user && !user.isAnonymous) {
        setTeacherUser(user);
      } else {
        setTeacherUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubAuth();
  }, []);

  // 3. If student opened a public link with studentId:
  // Subscribe to that single student document in Firestore (NO login required for students)
  useEffect(() => {
    if (!publicStudentId) return;

    setIsPublicStudentLoading(true);

    const unsubStudent = subscribeSingleStudent(
      publicStudentId,
      (student) => {
        setPublicStudent(student);
        setIsPublicStudentLoading(false);
      },
      (error) => {
        console.error('Error fetching single student from Firestore:', error);
        setIsPublicStudentLoading(false);
      }
    );

    const unsubSettings = subscribeTeacherSettings((settings) => {
      setTeacherSettings(settings);
    });

    return () => {
      unsubStudent();
      unsubSettings();
    };
  }, [publicStudentId]);

  // 4. If in Teacher Mode (no publicStudentId) and Teacher is Authenticated:
  // Subscribe to all students and settings from Firestore in real-time
  useEffect(() => {
    if (publicStudentId || urlStudentData) return;
    if (!teacherUser) {
      setStudents([]);
      setIsTeacherLoading(false);
      return;
    }

    testFirestoreConnection();
    setIsTeacherLoading(true);

    const unsubStudents = subscribeAllStudents(
      (loadedStudents) => {
        setStudents(loadedStudents);
        setIsTeacherLoading(false);
      },
      (err) => {
        console.warn('Firestore students listener notice:', err);
        setIsTeacherLoading(false);
      }
    );

    const unsubSettings = subscribeTeacherSettings((loadedSettings) => {
      setTeacherSettings(loadedSettings);
    });

    return () => {
      unsubStudents();
      unsubSettings();
    };
  }, [publicStudentId, urlStudentData, teacherUser]);

  // Handle Teacher Google Sign-In
  const handleTeacherGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const user = await signInTeacherWithGoogle();
      setTeacherUser(user);
      showToast(`خوش آمدید، استاد ${user.displayName || user.email}`);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('پنجره ورود توسط شما بسته شد.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('مرورگر باز شدن پنجره پاپ‌آپ گوگل را مسدود کرد. لطفاً اجازه باز شدن پنجره را بدهید یا برنامه را در برگه جدید باز کنید.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setAuthError(err.message || 'خطا در ارتباط با حساب گوگل. لطفاً مجدداً تلاش نمایید.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Teacher Sign-Out
  const handleTeacherSignOut = async () => {
    try {
      await signOutTeacher();
      setTeacherUser(null);
      setStudents([]);
      showToast('با موفقیت از حساب کاربری مربی خارج شدید.');
    } catch (err: any) {
      console.error('Sign-out error:', err);
      showToast('خطا در خروج از حساب.');
    }
  };

  // Save student to Firestore (Authenticated Teacher action)
  const handleSaveStudent = async (studentData: Student) => {
    if (!teacherUser) {
      showToast('برای ثبت یا ویرایش اطلاعات باید وارد حساب مربی شوید.');
      return;
    }

    const studentToSave: Student = {
      ...studentData,
      updatedAt: Date.now(),
    };

    try {
      await saveStudentToFirestore(studentToSave);
      showToast(`شاگرد «${studentToSave.name}» در Firestore ذخیره و همگام شد.`);
      setActiveTab('list');
      setEditingStudent(null);
    } catch (err: any) {
      console.error('Failed to save student to Firestore:', err);
      showToast('خطا در ذخیره اطلاعات شاگرد در پایگاه داده ابری.');
    }
  };

  // Start editing student
  const handleStartEdit = (student: Student) => {
    setEditingStudent(student);
    setActiveTab('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit or add
  const handleCancelForm = () => {
    setEditingStudent(null);
    setActiveTab('list');
  };

  // Delete student from Firestore (Authenticated Teacher action)
  const handleConfirmDelete = async (id: string) => {
    if (!teacherUser) {
      showToast('برای حذف اطلاعات باید وارد حساب مربی شوید.');
      return;
    }

    const target = students.find((s) => s.id === id);
    try {
      await deleteStudentFromFirestore(id);
      showToast(target ? `شاگرد «${target.name}» از Firestore حذف گردید.` : 'شاگرد حذف شد.');
    } catch (err: any) {
      console.error('Failed to delete student from Firestore:', err);
      showToast('خطا در حذف شاگرد از پایگاه داده ابری.');
    }
    setDeleteTargetStudent(null);
  };

  // Quick update payment status in Firestore (Authenticated Teacher action)
  const handleUpdatePaymentStatus = async (studentId: string, newStatus: string) => {
    if (!teacherUser) {
      showToast('برای تغییر وضعیت مالی باید وارد حساب مربی شوید.');
      return;
    }

    const target = students.find((s) => s.id === studentId);
    if (target) {
      const updated: Student = {
        ...target,
        paymentStatus: newStatus,
        updatedAt: Date.now(),
      };
      try {
        await saveStudentToFirestore(updated);
        showToast(`وضعیت مالی «${target.name}» در Firestore به «${newStatus}» تغییر یافت.`);
      } catch (err: any) {
        console.error('Failed to update payment in Firestore:', err);
        showToast('خطا در بروزرسانی وضعیت مالی در سرور.');
      }
    }
  };

  // Update teacher settings in Firestore (Authenticated Teacher action)
  const handleSaveSettings = async (newSettings: TeacherSettings) => {
    if (!teacherUser) {
      showToast('جهت ذخیره تنظیمات باید وارد حساب مربی شوید.');
      return;
    }

    const settingsWithTimestamp = { ...newSettings, updatedAt: Date.now() };
    setTeacherSettings(settingsWithTimestamp);
    try {
      await saveSettingsToFirestore(settingsWithTimestamp);
      showToast('تنظیمات با موفقیت در پایگاه داده ابری Firestore ذخیره شد.');
    } catch (err) {
      console.error('Failed to save settings to Firestore:', err);
    }
  };

  // Update full admin settings in Firestore (Authenticated Teacher action)
  const handleSaveAdminSettings = async (newSettings: TeacherSettings) => {
    if (!teacherUser) {
      showToast('جهت ذخیره تنظیمات باید وارد حساب مربی شوید.');
      return;
    }

    const settingsWithTimestamp = { ...newSettings, updatedAt: Date.now() };
    setTeacherSettings(settingsWithTimestamp);
    try {
      await saveSettingsToFirestore(settingsWithTimestamp);
      showToast('تنظیمات، فیلدها و تم با موفقیت در Firestore ذخیره شد.');
    } catch (err) {
      console.error('Failed to save admin settings to Firestore:', err);
    }
  };

  // Restore backup directly to Firestore (Authenticated Teacher action)
  const handleRestoreBackup = async (restoredList: Student[]) => {
    if (!teacherUser) {
      showToast('برای بازیابی داده‌ها باید وارد حساب مربی شوید.');
      return;
    }

    showToast('در حال بارگذاری شاگردان در پایگاه داده ابری Firestore...');
    try {
      for (const s of restoredList) {
        await saveStudentToFirestore(s);
      }
      showToast(`تعداد ${toPersianDigits(restoredList.length)} شاگرد در پایگاه ابری فایربیس ذخیره شدند.`);
    } catch (err) {
      console.error('Failed to restore to Firestore:', err);
      showToast('خطا در بازیابی اطلاعات در پایگاه داده.');
    }
  };

  // Seed initial sample student into Firestore
  const handleLoadSampleToFirestore = async () => {
    if (!teacherUser) {
      showToast('برای ثبت نمونه باید وارد حساب مربی شوید.');
      return;
    }

    showToast('در حال ثبت شاگرد نمونه در پایگاه داده ابری...');
    try {
      for (const s of INITIAL_SAMPLE_STUDENTS) {
        await saveStudentToFirestore(s);
      }
      showToast('شاگرد نمونه با موفقیت در Firestore ثبت شد.');
    } catch (err) {
      console.error('Failed to load sample student to Firestore:', err);
      showToast('خطا در ذخیره شاگرد نمونه.');
    }
  };

  // Download standalone HTML
  const handleDownloadHtml = () => {
    downloadStandaloneHtml(students);
    showToast('فایل HTML با موفقیت دانلود شد.');
  };

  const today = getTodayPersianFormatted();

  const isDark = !!teacherSettings.theme?.isDark;
  const themeColor = teacherSettings.theme?.color || 'crimson';
  const themePalette = THEME_PALETTES[themeColor] || THEME_PALETTES.crimson;
  const appTitle = teacherSettings.theme?.appTitle || 'سامانه مدیریت وضعیت و برنامه کلاس شاگردان';
  const appSubtitle =
    teacherSettings.theme?.appSubtitle ||
    (teacherSettings.instituteName
      ? `${teacherSettings.instituteName} • مدرس: ${teacherSettings.teacherName}`
      : 'متصل به پایگاه داده ابری Firebase Firestore (همگام‌سازی لحظه‌ای)');

  // ==========================================
  // VIEW 1: PUBLIC STUDENT LINK (Real-time Firestore)
  // Students must not log in.
  // Students can only view their own page using their unique link.
  // ==========================================
  if (publicStudentId) {
    if (isPublicStudentLoading) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 text-center max-w-sm w-full">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-sm">در حال بارگذاری اطلاعات کلاس...</h3>
            <p className="text-xs text-slate-500 mt-1">اتصال به پایگاه داده ابری Firebase Firestore</p>
          </div>
        </div>
      );
    }

    if (!publicStudent) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 text-center max-w-md w-full">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">اطلاعات شاگرد یافت نشد</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              شاگرد با شناسه «{publicStudentId}» در پایگاه داده ابری یافت نشد. ممکن است توسط مربی حذف شده باشد یا لینک نادرست باشد.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      );
    }

    return (
      <StudentView
        student={publicStudent}
        teacherSettings={teacherSettings}
        isStandaloneView={true}
      />
    );
  }

  // Legacy fallback for ?data=...
  if (urlStudentData) {
    return (
      <StudentView
        student={urlStudentData.student}
        teacherSettings={urlStudentData.teacherSettings}
        isStandaloneView={true}
      />
    );
  }

  // Teacher preview of student card
  if (previewStudent) {
    return (
      <StudentView
        student={previewStudent}
        teacherSettings={teacherSettings}
        isStandaloneView={false}
        onBackToAdmin={() => setPreviewStudent(null)}
      />
    );
  }

  // ==========================================
  // VIEW 2: TEACHER AUTHENTICATION CHECK / LOGIN
  // Only authenticated teachers can create, update, list, or delete
  // ==========================================
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 text-center max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">در حال بررسی احراز هویت مربی...</h3>
        </div>
      </div>
    );
  }

  // If Teacher is not logged in: Show Teacher Google Sign-In Screen
  if (!teacherUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {appTitle}
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                ورود اختصاصی مربی و اساتید با حساب گوگل (Firebase Authentication)
              </p>
            </div>

            {authError && (
              <div className="mt-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-bold mb-1">خطا در احراز هویت:</p>
                  <p>{authError}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>باز کردن در پنجره جدید (خارج از فریم)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                id="btn-google-signin"
                onClick={handleTeacherGoogleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>{isSigningIn ? 'در حال اتصال به حساب گوگل...' : 'ورود با حساب گوگل (Google Sign-In)'}</span>
              </button>
            </div>

            {/* Security Notice for Students and Teachers */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-right space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>امنیت پایگاه داده ابری:</strong> فقط مربیان تاییدشده از طریق Google Auth امکان ثبت، ویرایش، حذف یا لیست کردن شاگردان را دارند.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>دسترسی دانش‌آموزان:</strong> شاگردان برای مشاهده اطلاعات خود نیازی به ورود با حساب کاربری ندارند و با کلیک روی لینک اختصاصی ارسالی از طرف مربی، صرفاً وضعیت کارت خود را مشاهده می‌کنند.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 py-2">
          سامانه هوشمند کلاسی • پشتیبانی‌شده توسط Google Firebase Firestore & Auth
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: AUTHENTICATED TEACHER DASHBOARD
  // ==========================================
  return (
    <div className={`min-h-screen pb-16 transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Bar: Connectivity, Cloud Status & Teacher User Profile */}
      <div className={`border-b px-4 sm:px-8 py-2.5 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <OfflineIndicator onDownloadHtml={handleDownloadHtml} />

          <div className="flex items-center gap-3">
            {/* Authenticated Teacher User Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
              {teacherUser.photoURL ? (
                <img
                  src={teacherUser.photoURL}
                  alt={teacherUser.displayName || 'مربی'}
                  className="w-5 h-5 rounded-full object-cover border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {(teacherUser.displayName || teacherUser.email || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold max-w-[140px] truncate" title={teacherUser.email || ''}>
                {teacherUser.displayName || teacherUser.email}
              </span>
              <button
                type="button"
                id="btn-signout"
                onClick={handleTeacherSignOut}
                className="hover:text-rose-600 transition-colors cursor-pointer mr-1 p-0.5"
                title="خروج از حساب مربی"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>امروز: {toPersianDigits(today.full)}</span>
            </div>
            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`border-b shadow-2xs transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs ${themePalette.primary}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {appTitle}
                  </h1>
                  <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Cloud className="w-3.5 h-3.5 text-teal-600" />
                    <span>{appSubtitle}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-nav-list"
                onClick={() => {
                  setActiveTab('list');
                  setEditingStudent(null);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? `${themePalette.buttonBg} text-white shadow-xs`
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>لیست شاگردان</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'list' ? 'bg-black/20 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {toPersianDigits(students.length)}
                </span>
              </button>

              <button
                type="button"
                id="btn-nav-add"
                onClick={() => {
                  setEditingStudent(null);
                  setActiveTab('add');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'add' || activeTab === 'edit'
                    ? `${themePalette.buttonBg} text-white shadow-xs`
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{editingStudent ? 'ویرایش شاگرد' : 'ثبت شاگرد جدید'}</span>
              </button>

              <button
                type="button"
                id="btn-nav-backend"
                onClick={() => {
                  setEditingStudent(null);
                  setActiveTab('backend');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'backend'
                    ? `${themePalette.buttonBg} text-white shadow-xs`
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="مدیریت بک‌اند، ویرایش تمام متن‌های اپلیکیشن و سفارشی‌سازی خروجی شاگرد"
              >
                <Code2 className="w-4 h-4 text-blue-500" />
                <span>مدیریت بک‌اند و کاستومایز</span>
              </button>

              {/* Admin Control Panel Button */}
              <button
                type="button"
                id="btn-open-admin-control"
                onClick={() => setIsAdminControlOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                  isDark
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-600/40'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title="پنل مدیریت: تغییر نام فیلدها، افزودن فیلد جدید و تغییر تم صفحه"
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>پنل تنظیمات و تم</span>
              </button>

              <button
                type="button"
                id="btn-open-settings"
                onClick={() => setIsSettingsOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="تنظیم نام مدرس و آموزشگاه"
              >
                <Settings className="w-4 h-4" />
                <span>مدرس</span>
              </button>

              <button
                type="button"
                id="btn-open-backup"
                onClick={() => setIsBackupOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="پشتیبان‌گیری و بازیابی داده‌ها در Firestore"
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <span>پشتیبان‌گیری</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'list' ? (
          isTeacherLoading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 text-sm">در حال بارگذاری شاگردان از پایگاه داده ابری Firestore...</h3>
              <p className="text-xs text-slate-500 mt-1">همگام‌سازی مستقیم و امن</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">پایگاه داده ابری Firestore آماده است</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                شاگردی در دیتابیس ابری فایربیس ثبت نشده است. می‌توانید اولین شاگرد را اضافه کنید یا با شاگرد نمونه آزمایشی شروع کنید.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت اولین شاگرد</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleToFirestore}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>ایجاد شاگرد نمونه در Firestore</span>
                </button>
              </div>
            </div>
          ) : (
            <StudentTable
              students={students}
              teacherSettings={teacherSettings}
              onEdit={handleStartEdit}
              onDeleteRequest={(std) => setDeleteTargetStudent(std)}
              onOpenShareModal={(std) => setShareStudent(std)}
              onOpenPrintModal={(std) => setPrintStudent(std)}
              onOpenStudentView={(std) => setPreviewStudent(std)}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )
        ) : activeTab === 'backend' ? (
          <BackendControlPanel
            settings={teacherSettings}
            students={students}
            onSaveSettings={handleSaveAdminSettings}
            onUpdateStudentsList={async (newList) => {
              for (const s of newList) {
                await saveStudentToFirestore(s);
              }
              showToast('دیتابیس شاگردان در Firestore بروزرسانی شد.');
            }}
            onPreviewSampleStudent={() => {
              if (students.length > 0) {
                setPreviewStudent(students[0]);
              } else {
                setPreviewStudent(INITIAL_SAMPLE_STUDENTS[0]);
              }
            }}
          />
        ) : (
          <StudentForm
            initialStudent={editingStudent}
            teacherSettings={teacherSettings}
            onSave={handleSaveStudent}
            onCancel={handleCancelForm}
          />
        )}
      </main>

      {/* Modals */}
      <AdminControlPanelModal
        settings={teacherSettings}
        isOpen={isAdminControlOpen}
        onClose={() => setIsAdminControlOpen(false)}
        onSave={handleSaveAdminSettings}
      />
      <ShareModal
        student={shareStudent}
        teacherSettings={teacherSettings}
        isOpen={!!shareStudent}
        onClose={() => setShareStudent(null)}
        onOpenStudentView={(std) => {
          setShareStudent(null);
          setPreviewStudent(std);
        }}
      />

      <PrintModal
        student={printStudent}
        teacherSettings={teacherSettings}
        isOpen={!!printStudent}
        onClose={() => setPrintStudent(null)}
      />

      <DeleteConfirmModal
        student={deleteTargetStudent}
        isOpen={!!deleteTargetStudent}
        onClose={() => setDeleteTargetStudent(null)}
        onConfirm={handleConfirmDelete}
      />

      <TeacherSettingsModal
        settings={teacherSettings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <BackupModal
        students={students}
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onRestore={handleRestoreBackup}
        onDownloadHtml={handleDownloadHtml}
      />
    </div>
  );
}
