import React, { useState } from 'react';
import { Share2, Link, Copy, Check, MessageSquare, ExternalLink, X, Send } from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import { generateShareUrl, formatStudentMessage } from '../utils/storage';

interface Props {
  student: Student | null;
  teacherSettings: TeacherSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentView: (student: Student) => void;
}

export const ShareModal: React.FC<Props> = ({
  student,
  teacherSettings,
  isOpen,
  onClose,
  onOpenStudentView,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !student) return null;

  const shareUrl = generateShareUrl(student, teacherSettings);
  const formattedMessage = formatStudentMessage(student, teacherSettings, true);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const input = document.getElementById('share-url-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '98' + cleanPhone.substring(1);
    }
    const encoded = encodeURIComponent(formattedMessage);
    const targetUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right my-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">ارسال برنامه به شاگرد: {student.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Section 1: Direct Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              🔗 لینک صفحه اختصاصی شاگرد (شامل تاریخ روز، مشخصات و لیست جلسات):
            </label>
            <div className="flex items-center gap-2">
              <input
                id="share-url-input"
                type="text"
                readOnly
                dir="ltr"
                value={shareUrl}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-600 font-mono select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                id="btn-copy-link"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  copiedLink ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'کپی شد!' : 'کپی لینک'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              شاگرد با باز کردن این لینک، صفحه اختصاصی خود با تاریخ روز و جدول جلسات را می‌بیند.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              id="btn-modal-whatsapp"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال مستقیم به واتساپ</span>
            </button>

            <button
              type="button"
              id="btn-preview-student-page"
              onClick={() => {
                onClose();
                onOpenStudentView(student);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs border border-slate-300 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>پیش‌نمایش صفحه شاگرد</span>
            </button>
          </div>

          {/* Section 2: Formatted Text Preview */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>متن پیام ارسالی (مناسب برای پیامک، ایتا، بله یا تلگرام):</span>
              </label>
              <button
                type="button"
                id="btn-copy-full-text"
                onClick={handleCopyText}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'متن کپی شد!' : 'کپی کل متن'}</span>
              </button>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-normal whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed select-all">
              {formattedMessage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
