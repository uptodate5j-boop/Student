import React from 'react';
import { Wifi, WifiOff, HardDriveDownload, Cloud, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  onDownloadHtml: () => void;
}

export const OfflineIndicator: React.FC<Props> = ({ onDownloadHtml }) => {
  const { isOnline } = usePWAInstall();

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Network status */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}
        title={isOnline ? 'اینترنت متصل است؛ همگام‌سازی ابری خودکار با Firestore فعال می‌باشد' : 'حالت آفلاین'}
      >
        {isOnline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span>آنلاین</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <WifiOff className="w-3.5 h-3.5" />
            <span>آفلاین</span>
          </>
        )}
      </div>

      {/* Firebase Cloud Firestore Status */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border bg-teal-50 text-teal-800 border-teal-200 transition-colors"
        title="داده‌ها مستقیماً در پایگاه داده ابری Firebase Firestore ذخیره و همگام می‌شوند."
      >
        <Cloud className="w-3.5 h-3.5 text-teal-600" />
        <span>دیتابیس ابری Firestore (همگام‌سازی خودکار)</span>
        <Check className="w-3 h-3 text-teal-600" />
      </div>

      {/* Standalone HTML download */}
      <button
        type="button"
        onClick={onDownloadHtml}
        id="btn-download-standalone-html"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-colors cursor-pointer text-xs"
        title="دریافت نسخه تک‌برگی HTML"
      >
        <HardDriveDownload className="w-3.5 h-3.5 text-blue-600" />
        <span>دریافت نسخه تک‌فایل HTML</span>
      </button>
    </div>
  );
};
