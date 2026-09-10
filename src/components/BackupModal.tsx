import React, { useRef, useState, useEffect } from 'react';
import { Database, Download, Upload, HardDriveDownload, X, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { firebaseSync, SyncStatusInfo } from '../services/firebaseSync';

interface Props {
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (restored: Student[]) => void;
  onDownloadHtml: () => void;
}

export const BackupModal: React.FC<Props> = ({
  students,
  isOpen,
  onClose,
  onRestore,
  onDownloadHtml,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(firebaseSync.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = firebaseSync.subscribeStatus((info) => {
      setSyncInfo(info);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      await firebaseSync.performFullSync();
      setSyncSuccessMsg('همگام‌سازی کامل با پایگاه داده Firebase Firestore با موفقیت انجام شد.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'خطا در ارتباط با سرور ابری');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class-students-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestore(parsed);
          alert(`اطلاعات ${toPersianDigits(parsed.length)} شاگرد با موفقیت بازیابی شد.`);
          onClose();
        } else {
          alert('فرمت فایل نامعتبر است. لطفاً فایل پشتیبان JSON صحیح انتخاب کنید.');
        }
      } catch {
        alert('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">پشتیبان‌گیری و همگام‌سازی ابری</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Cloud Sync with Firebase Firestore */}
          <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-teal-950">
                    همگام‌سازی ابری Firebase Firestore
                  </h4>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    syncInfo.status === 'synced'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : syncInfo.status === 'syncing'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {syncInfo.status === 'synced'
                      ? 'همگام و متصل'
                      : syncInfo.status === 'syncing'
                      ? 'در حال تبادل...'
                      : 'آفلاین (ذخیره محلی)'}
                  </span>
                </div>
                <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                  تغییرات به صورت خودکار در فضای ابری فایربیس ذخیره شده و در دستگاه‌های مختلف هماهنگ می‌شوند. در صورت قطع اینترنت، داده‌ها در حافظه دستگاه ذخیره و به محض اتصال مجدد همگام خواهند شد.
                </p>

                {syncSuccessMsg && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleManualCloudSync}
                  disabled={isSyncing}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی فوری با فایربیس'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Standalone HTML (Zero host, zero domain) */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-950">
                  دریافت نسخه تک‌فایل HTML (کاملاً مستقل از اینترنت)
                </h4>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  یک فایل <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">.html</code> مستقل دانلود می‌شود که می‌توانید بدون هیچ هاست یا دامنه‌ای، روی کامپیوتر یا فلش مموری ذخیره کرده و با دوبار کلیک در هر مرورگری اجرا نمایید. اطلاعات فعلی شما نیز در آن گنجانده شده است.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onDownloadHtml();
                    onClose();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل HTML آفلاین</span>
                </button>
              </div>
            </div>
          </div>

          {/* JSON Backup & Restore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>خروجی فایل پشتیبان (JSON)</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  دانلود نسخه پشتیبان از تمام شاگردان ثبت شده جهت نگهداری امن در کامپیوتر یا هارد دیسک.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود فایل پشتیبان</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>بازیابی فایل پشتیبان (JSON)</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  فایل پشتیبان قبلی خود را انتخاب کنید تا شاگردان به برنامه بازگردند.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>انتخاب فایل و بازیابی</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
