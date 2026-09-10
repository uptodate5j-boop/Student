import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Student } from '../types';

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<Props> = ({ student, isOpen, onClose, onConfirm }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 overflow-hidden text-right"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-rose-600">
          <div className="p-3 bg-rose-50 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">تأیید حذف شاگرد</h3>
            <p className="text-xs text-slate-500 mt-0.5">این عملیات قابل بازگشت نیست</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 text-sm text-slate-700">
          آیا از حذف اطلاعات شاگرد <strong className="text-slate-900 font-bold">«{student.name}»</strong> (ماه {student.month} - {student.totalSessions} جلسه) اطمینان دارید؟
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            id="btn-cancel-delete"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            id="btn-confirm-delete"
            onClick={() => {
              onConfirm(student.id);
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>بله، حذف کن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
