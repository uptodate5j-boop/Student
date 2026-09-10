import React from 'react';
import { Printer, X } from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getTodayPersianFormatted,
  toPersianDigits,
  calculateStudentSessionStats,
  compareSessionDateWithToday,
  getFirstUpcomingSessionIndex,
  getSessionColorCategory,
} from '../utils/persianDate';

interface Props {
  student: Student | null;
  teacherSettings: TeacherSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintModal: React.FC<Props> = ({ student, teacherSettings, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  const today = getTodayPersianFormatted();
  const stats = calculateStudentSessionStats(student);
  const firstUpcomingIdx = getFirstUpcomingSessionIndex(student.sessionsList || []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Top actions bar inside modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">پیش‌نمایش چاپ فیش و کارت برنامه کلاسی</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-modal-trigger-print"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ / ذخیره PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area preview */}
        <div className="p-8 bg-slate-100 flex justify-center">
          <div className="w-full max-w-xl bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-blue-600 pb-4 mb-5 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {teacherSettings.instituteName || 'برنامه جلسات کلاس آموزشی'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  مدرس: {teacherSettings.teacherName || 'استاد محترم'}
                  {teacherSettings.phone ? ` • شماره تماس: ${toPersianDigits(teacherSettings.phone)}` : ''}
                </p>
              </div>
              <div className="text-left">
                <div className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-semibold">
                  کارت برنامه کلاسی
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  تاریخ صدور: {toPersianDigits(today.full)}
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs text-slate-700">
              <div>
                <span className="text-slate-500">نام و نام‌خانوادگی:</span>{' '}
                <strong className="text-slate-900 font-bold text-sm">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">شماره تماس:</span>{' '}
                <span className="font-semibold" dir="ltr">{student.phone ? toPersianDigits(student.phone) : '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">ماه دوره:</span>{' '}
                <strong className="text-blue-700 font-bold">{student.month}</strong>
              </div>
              <div>
                <span className="text-slate-500">جلسات دوره:</span>{' '}
                <strong className="text-slate-900 font-bold">
                  کل: {toPersianDigits(stats.total)} • باقی‌مانده: {toPersianDigits(stats.remaining)}
                </strong>
              </div>
              {student.subject && (
                <div className="col-span-2">
                  <span className="text-slate-500">درس / موضوع:</span>{' '}
                  <span className="font-medium text-slate-800">{student.subject}</span>
                </div>
              )}
              {student.fee && (
                <div>
                  <span className="text-slate-500">شهریه ماهانه:</span>{' '}
                  <span className="font-semibold text-emerald-700">{student.fee}</span>
                </div>
              )}
              {student.paymentStatus && (
                <div>
                  <span className="text-slate-500">وضعیت پرداخت:</span>{' '}
                  <strong
                    className={`font-bold ${
                      student.paymentStatus === 'پرداخت شده' || student.paymentStatus === 'تسویه'
                        ? 'text-emerald-700'
                        : student.paymentStatus === 'بدهکار'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {student.paymentStatus}
                  </strong>
                </div>
              )}
            </div>

            {/* Schedule List */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-800">زمان‌بندی و برنامه جلسات:</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> اولین جلسه آینده (سبز)
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> روز گذشته (قرمز)
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> جلسات آینده (زرد)
                  </span>
                </div>
              </div>

              {student.sessionsList && student.sessionsList.length > 0 ? (
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                      <th className="py-2 px-2.5 rounded-tr-md">جلسه</th>
                      <th className="py-2 px-2.5">روز هفته</th>
                      <th className="py-2 px-2.5">تاریخ</th>
                      <th className="py-2 px-2.5">ساعت</th>
                      <th className="py-2 px-2.5">وضعیت جلسه</th>
                      <th className="py-2 px-2.5 rounded-tl-md">موضوع / توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {student.sessionsList.map((item, idx) => {
                      const category = getSessionColorCategory(item, idx, firstUpcomingIdx);
                      const dateStatus = compareSessionDateWithToday(item.date);

                      let rowBg = 'bg-amber-50/70 text-amber-950';
                      let numStyle = 'bg-amber-200 text-amber-900';
                      let badgeText = '🟡 آینده';
                      let badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-medium';

                      if (category === 'first_upcoming') {
                        rowBg = 'bg-emerald-50 text-emerald-950 font-semibold border-y border-emerald-300';
                        numStyle = 'bg-emerald-600 text-white font-extrabold';
                        badgeText = dateStatus === 'today' ? '🟢 امروز (اولین)' : '🟢 اولین جلسه آینده';
                        badgeClass = 'bg-emerald-600 text-white font-extrabold shadow-2xs';
                      } else if (category === 'past') {
                        rowBg = 'bg-rose-50/80 text-rose-950';
                        numStyle = 'bg-rose-200 text-rose-800 font-bold';
                        badgeText = '🔴 گذشته';
                        badgeClass = 'bg-rose-100 text-rose-800 border border-rose-300 font-bold';
                      }

                      return (
                        <tr key={item.id || idx} className={`${rowBg} transition-colors border-b border-slate-200`}>
                          <td className="py-2 px-2.5 font-bold">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] ${numStyle}`}>
                              {toPersianDigits(item.sessionNumber || idx + 1)}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-medium">{item.dayOfWeek}</td>
                          <td className="py-2 px-2.5 font-mono font-medium">{toPersianDigits(item.date) || '-'}</td>
                          <td className="py-2 px-2.5 font-semibold">{toPersianDigits(item.time) || '-'}</td>
                          <td className="py-2 px-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-700">{item.topic || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs whitespace-pre-line text-slate-700">
                  {student.sessionsText || 'جلساتی ثبت نشده است.'}
                </div>
              )}
            </div>

            {/* Notes */}
            {student.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900 mb-4">
                <strong>یادداشت مدرس: </strong>
                <span>{student.notes}</span>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-400">
              این برگه جهت هماهنگی و اطلاع شاگرد از زمان برگزاری کلاس‌ها صادر گردیده است.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
