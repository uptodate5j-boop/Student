import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={install}
      id="btn-install-pwa"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all hover:shadow cursor-pointer"
      title="نصب برنامه روی گوشی یا کامپیوتر برای اجرای مستقیم آفلاین"
    >
      <Download className="w-3.5 h-3.5" />
      <span>نصب برنامه روی دستگاه</span>
    </button>
  );
};
