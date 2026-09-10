import React, { useState } from 'react';
import { Settings, X, Check, Building2, User, Phone } from 'lucide-react';
import { TeacherSettings } from '../types';

interface Props {
  settings: TeacherSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TeacherSettings) => void;
}

export const TeacherSettingsModal: React.FC<Props> = ({ settings, isOpen, onClose, onSave }) => {
  const [teacherName, setTeacherName] = useState(settings.teacherName || '');
  const [instituteName, setInstituteName] = useState(settings.instituteName || '');
  const [phone, setPhone] = useState(settings.phone || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      teacherName: teacherName.trim(),
      instituteName: instituteName.trim(),
      phone: phone.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">تنظیمات مدرس و آموزشگاه</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 mb-2">
            این اطلاعات در بالای برگه چاپ فیش، کارت اختصاصی شاگرد و پیام‌های ارسالی درج می‌شود.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              عنوان آموزشگاه یا مرکز آموزشی:
            </label>
            <div className="relative">
              <input
                type="text"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="مثال: کلاس‌ /کلیستنیکس / پارکور / ژیمناستیک / رزمی "
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              نام مدرس / استاد:
            </label>
            <div className="relative">
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مثال: استاد بهروز "
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              شماره تماس هماهنگی مدرس:
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 09120000000"
                dir="ltr"
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره تنظیمات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
