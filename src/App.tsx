import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Settings,
  Database,
  Calendar,
  CheckCircle2,
  HardDriveDownload,
  BookOpen,
  Sliders,
  Sparkles,
  Code2,
} from 'lucide-react';
import { Student, TeacherSettings, ActiveTab } from './types';
import {
  loadStudents,
  saveStudents,
  loadSettings,
  saveSettings,
  decodeStudentFromUrl,
} from './utils/storage';
import { firebaseSync } from './services/firebaseSync';
import { downloadStandaloneHtml } from './utils/exportHtml';
import { getTodayPersianFormatted, toPersianDigits } from './utils/persianDate';
import { THEME_PALETTES, DEFAULT_FIELD_LABELS } from './utils/theme';
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
  const [students, setStudents] = useState<Student[]>([]);
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

  // Student direct view when loaded with ?data=... or #data=...
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

  // Initial load
  useEffect(() => {
    // 1. Check URL parameters for shared student
    const parseUrl = () => {
      let dataParam = '';
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('data')) {
        dataParam = searchParams.get('data') || '';
      } else if (window.location.hash) {
        // e.g. #data=... or #?data=...
        const hash = window.location.hash.replace(/^#\??/, '');
        const hashParams = new URLSearchParams(hash);
        dataParam = hashParams.get('data') || (hash.startsWith('data=') ? hash.substring(5) : '');
      }

      if (dataParam) {
        const decoded = decodeStudentFromUrl(dataParam);
        if (decoded) {
          setUrlStudentData(decoded);
          return true;
        }
      }
      return false;
    };

    const hasUrlStudent = parseUrl();

    // 2. Load stored students and settings
    const loaded = loadStudents();
    setStudents(loaded);
    const settings = loadSettings();
    setTeacherSettings(settings);

    // 3. Initialize Firebase Firestore synchronization (seamless background sync)
    firebaseSync.initSync({
      onStudentsUpdated: (syncedStudents) => {
        setStudents(syncedStudents);
      },
      onSettingsUpdated: (syncedSettings) => {
        setTeacherSettings(syncedSettings);
      },
    });

    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, []);

  // Save student (create or update)
  const handleSaveStudent = (studentData: Student) => {
    const studentToSave: Student = {
      ...studentData,
      updatedAt: Date.now(),
    };

    let updated: Student[];
    const exists = students.some((s) => s.id === studentToSave.id);

    if (exists) {
      updated = students.map((s) => (s.id === studentToSave.id ? studentToSave : s));
      showToast(`اطلاعات «${studentToSave.name}» با موفقیت بروزرسانی شد.`);
    } else {
      updated = [studentToSave, ...students];
      showToast(`شاگرد جدید «${studentToSave.name}» با موفقیت ثبت شد.`);
    }

    setStudents(updated);
    saveStudents(updated);
    firebaseSync.syncStudentToCloud(studentToSave);
    setActiveTab('list');
    setEditingStudent(null);
  };

  // Start editing
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

  // Delete student confirmed
  const handleConfirmDelete = (id: string) => {
    const target = students.find((s) => s.id === id);
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveStudents(updated);
    firebaseSync.deleteStudentFromCloud(id);
    showToast(target ? `شاگرد «${target.name}» حذف گردید.` : 'شاگرد با موفقیت حذف شد.');
    setDeleteTargetStudent(null);
  };

  // Quick update payment status
  const handleUpdatePaymentStatus = (studentId: string, newStatus: string) => {
    const target = students.find((s) => s.id === studentId);
    const now = Date.now();
    const updated = students.map((s) =>
      s.id === studentId ? { ...s, paymentStatus: newStatus, updatedAt: now } : s
    );
    setStudents(updated);
    saveStudents(updated);
    if (target) {
      firebaseSync.syncStudentToCloud({ ...target, paymentStatus: newStatus, updatedAt: now });
    }
    showToast(
      target
        ? `وضعیت مالی «${target.name}» به «${newStatus}» تغییر یافت.`
        : `وضعیت مالی به «${newStatus}» تغییر یافت.`
    );
  };

  // Update teacher settings
  const handleSaveSettings = (newSettings: TeacherSettings) => {
    const settingsWithTimestamp = { ...newSettings, updatedAt: Date.now() };
    setTeacherSettings(settingsWithTimestamp);
    saveSettings(settingsWithTimestamp);
    firebaseSync.syncSettingsToCloud(settingsWithTimestamp);
    showToast('تنظیمات با موفقیت ذخیره شد.');
  };

  // Update full admin settings (labels, fields, theme)
  const handleSaveAdminSettings = (newSettings: TeacherSettings) => {
    const settingsWithTimestamp = { ...newSettings, updatedAt: Date.now() };
    setTeacherSettings(settingsWithTimestamp);
    saveSettings(settingsWithTimestamp);
    firebaseSync.syncSettingsToCloud(settingsWithTimestamp);
    showToast('تنظیمات پنل مدیریت، فیلدها و تم با موفقیت ذخیره شد.');
  };

  // Restore backup
  const handleRestoreBackup = (restoredList: Student[]) => {
    setStudents(restoredList);
    saveStudents(restoredList);
    firebaseSync.uploadAllLocalToCloud(restoredList, teacherSettings);
    showToast(`تعداد ${toPersianDigits(restoredList.length)} شاگرد با موفقیت بازیابی شدند.`);
  };

  // Download standalone HTML
  const handleDownloadHtml = () => {
    downloadStandaloneHtml(students);
    showToast('فایل HTML آفلاین با موفقیت دانلود شد.');
  };

  const today = getTodayPersianFormatted();

  const isDark = !!teacherSettings.theme?.isDark;
  const themeColor = teacherSettings.theme?.color || 'crimson';
  const themePalette = THEME_PALETTES[themeColor] || THEME_PALETTES.crimson;
  const appTitle = teacherSettings.theme?.appTitle || 'مدیریت برنامه کلاس و تمرینات شاگردان';
  const appSubtitle =
    teacherSettings.theme?.appSubtitle ||
    (teacherSettings.instituteName
      ? `${teacherSettings.instituteName} • مدرس: ${teacherSettings.teacherName}`
      : 'سامانه آفلاین و بدون نیاز به هاست');

  // If viewed via URL as student
  if (urlStudentData) {
    return (
      <StudentView
        student={urlStudentData.student}
        teacherSettings={urlStudentData.teacherSettings}
        isStandaloneView={true}
        onBackToAdmin={() => {
          // Clear query params and show admin panel
          window.history.replaceState({}, '', window.location.pathname);
          setUrlStudentData(null);
        }}
      />
    );
  }

  // If previewing student from admin panel
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

      {/* Top Bar: Connectivity & Standalone action */}
      <div className={`border-b px-4 sm:px-8 py-2.5 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <OfflineIndicator onDownloadHtml={handleDownloadHtml} />

          <div className="flex items-center gap-3">
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
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {appSubtitle}
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
                title="پنل مدیریت کامل: تغییر نام فیلدها، افزودن فیلد جدید و تغییر تم صفحه"
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>پنل تنظیمات و تم</span>
              </button>

              <button
                type="button"
                id="btn-open-settings"
                onClick={() => setIsSettingsOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="پشتیبان‌گیری، بازیابی و دانلود آفلاین"
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
        ) : activeTab === 'backend' ? (
          <BackendControlPanel
            settings={teacherSettings}
            students={students}
            onSaveSettings={handleSaveAdminSettings}
            onUpdateStudentsList={(newList) => {
              setStudents(newList);
              saveStudents(newList);
              firebaseSync.uploadAllLocalToCloud(newList, teacherSettings);
              showToast('دیتابیس شاگردان با موفقیت بروز شد.');
            }}
            onPreviewSampleStudent={() => {
              if (students.length > 0) {
                setPreviewStudent(students[0]);
              } else {
                const dummy: Student = {
                  id: 'sample-preview',
                  name: 'علی محمدی (نمونه شاگرد)',
                  phone: '09121112233',
                  month: 'اردیبهشت ۱۴۰۵',
                  totalSessions: 12,
                  subject: 'ژیمناستیک و انعطاف‌پذیری',
                  paymentStatus: 'پرداخت شده',
                  fee: '۲,۵۰۰,۰۰۰ تومان',
                  notes: 'تمرینات کششی روزانه انجام شود. تغذیه مناسب رعایت گردد.',
                  sessionsText: 'شنبه و دوشنبه ساعت ۱۸:۳۰',
                  sessionsList: [
                    { id: 's1', sessionNumber: 1, dayOfWeek: 'شنبه', date: '۱۴۰۵/۰۲/۰۱', time: '۱۸:۳۰', topic: 'آمادگی جسمانی', isCompleted: true },
                    { id: 's2', sessionNumber: 2, dayOfWeek: 'دوشنبه', date: '۱۴۰۵/۰۲/۰۳', time: '۱۸:۳۰', topic: 'حرکات زمینی', isCompleted: true },
                    { id: 's3', sessionNumber: 3, dayOfWeek: 'چهارشنبه', date: getTodayPersianFormatted().full, time: '۱۸:۳۰', topic: 'تمرینات تعادلی امروز', isCompleted: false },
                    { id: 's4', sessionNumber: 4, dayOfWeek: 'شنبه', date: '۱۴۰۵/۰۲/۰۸', time: '۱۸:۳۰', topic: 'پرش و رول', isCompleted: false },
                  ],
                  createdAt: Date.now(),
                };
                setPreviewStudent(dummy);
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
