import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, HardDriveDownload, Cloud, RefreshCw, CloudOff, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { firebaseSync, SyncStatusInfo } from '../services/firebaseSync';

interface Props {
  onDownloadHtml: () => void;
}

export const OfflineIndicator: React.FC<Props> = ({ onDownloadHtml }) => {
  const { isOnline } = usePWAInstall();
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(firebaseSync.getStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsub = firebaseSync.subscribeStatus((info) => {
      setSyncInfo(info);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await firebaseSync.performFullSync();
    } catch (err) {
      console.warn('Manual sync error:', err);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isSyncing = syncInfo.status === 'syncing' || isManualSyncing;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Network status */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}
        title={isOnline ? 'اینترنت متصل است؛ ذخیره محلی و همگام‌سازی ابری فعال می‌باشد' : 'شما در حالت آفلاین هستید، برنامه بدون مشکل از حافظه محلی کار می‌کند'}
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
            <span>حالت کاملاً آفلاین</span>
          </>
        )}
      </div>

      {/* Firebase Cloud Sync Status */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border transition-colors ${
          isSyncing
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : syncInfo.status === 'synced'
            ? 'bg-teal-50 text-teal-800 border-teal-200'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
        title={
          isSyncing
            ? 'در حال همگام‌سازی با پایگاه داده ابری Firebase Firestore...'
            : syncInfo.status === 'synced'
            ? 'داده‌ها با پایگاه داده ابری Firestore همگام هستند.'
            : 'داده‌ها به صورت محلی ذخیره شده‌اند و با اتصال اینترنت همگام خواهند شد.'
        }
      >
        {isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>در حال همگام‌سازی...</span>
          </>
        ) : syncInfo.status === 'synced' ? (
          <>
            <Cloud className="w-3.5 h-3.5 text-teal-600" />
            <span>همگام با فایربیس ابری</span>
            <Check className="w-3 h-3 text-teal-600" />
          </>
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 text-slate-500" />
            <span>فایربیس (آفلاین)</span>
          </>
        )}

        {isOnline && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="hover:text-blue-600 ml-0.5 p-0.5 rounded cursor-pointer transition-colors"
            title="همگام‌سازی فوری با Firebase"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Standalone HTML download */}
      <button
        type="button"
        onClick={onDownloadHtml}
        id="btn-download-standalone-html"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-colors cursor-pointer text-xs"
        title="دریافت فایل تک‌برگی HTML که می‌توانید در کامپیوتر یا گوشی خود بدون نیاز به اینترنت یا هاست باز کنید"
      >
        <HardDriveDownload className="w-3.5 h-3.5 text-blue-600" />
        <span>دریافت نسخه تک‌فایل HTML</span>
      </button>
    </div>
  );
};
