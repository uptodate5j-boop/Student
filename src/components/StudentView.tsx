import React from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Printer,
  ArrowRight,
  CheckCircle2,
  User,
  Phone,
  CreditCard,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { Student, TeacherSettings } from '../types';
import {
  getTodayPersianFormatted,
  toPersianDigits,
  calculateStudentSessionStats,
  compareSessionDateWithToday,
} from '../utils/persianDate';
import { DEFAULT_FIELD_LABELS, DEFAULT_STUDENT_VIEW_TEXTS, THEME_PALETTES } from '../utils/theme';

interface Props {
  student: Student;
  teacherSettings?: TeacherSettings;
  isStandaloneView?: boolean;
  onBackToAdmin?: () => void;
}

export const StudentView: React.FC<Props> = ({
  student,
  teacherSettings,
  isStandaloneView = false,
  onBackToAdmin,
}) => {
  const today = getTodayPersianFormatted();
  const labels = { ...DEFAULT_FIELD_LABELS, ...(teacherSettings?.fieldLabels || {}) };
  const stx = { ...DEFAULT_STUDENT_VIEW_TEXTS, ...(teacherSettings?.studentViewTexts || {}) };
  const customFieldDefs = teacherSettings?.customFields || [];
  const stats = calculateStudentSessionStats(student);
  const themeColor = teacherSettings?.theme?.color || 'crimson';
  const palette = THEME_PALETTES[themeColor] || THEME_PALETTES.crimson;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Navigation & Actions bar (hidden in print) */}
        <div className="no-print flex items-center justify-between">
          {onBackToAdmin ? (
            <button
              type="button"
              id="btn-back-to-admin"
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{stx.backButtonText || 'بازگشت به پنل مربی'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            id="btn-print-student-view"
            onClick={handlePrint}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${palette.buttonBg} ${palette.buttonHover} text-white text-xs font-bold shadow-xs transition-colors cursor-pointer`}
          >
            <Printer className="w-4 h-4" />
            <span>{stx.printButtonText || 'چاپ / ذخیره PDF'}</span>
          </button>
        </div>

        {/* Today's Alert Banner if there's a session today */}
        {stats.today > 0 && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{stx.todayAlertTitle || '🎯 امروز جلسه تمرین دارید!'}</h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                {stx.todayAlertDesc || 'طبق برنامه امروز جلسه تمرینی دارید. لطفاً به موقع با وسایل و پوشش ورزشی حاضر شوید.'}
              </p>
            </div>
          </div>
        )}

        {/* Main Printable Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${palette.gradientFrom} ${palette.gradientTo} text-white p-6 sm:p-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-white/90 text-xs font-medium mb-3">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>{stx.badgeText || 'کارت اختصاصی شاگرد'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {teacherSettings?.instituteName || stx.academyName || 'سامانه هوشمند مدیریت کلاس‌های ورزشی'}
                </h1>
                {teacherSettings?.teacherName && (
                  <p className="text-white/80 text-sm mt-1">
                    {stx.coachTitle || 'مربی'}: <strong className="text-white">{teacherSettings.teacherName}</strong>
                  </p>
                )}
              </div>

              <div className="sm:text-left text-xs text-white/80 shrink-0">
                <div>{stx.dateIssuedLabel || 'تاریخ صدور کارت:'}</div>
                <div className="font-semibold text-white mt-0.5">{today.full}</div>
              </div>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/70">
            {/* Session Stats Grid: Total, Remaining, Past */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                  {stx.statTotalLabel || `${labels.totalSessions} کل`}
                </span>
                <span className="text-lg font-black text-slate-800">
                  {toPersianDigits(stats.total)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{stx.statTotalSub || 'جلسه دوره'}</span>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-2xl border border-amber-300 shadow-2xs text-center">
                <span className="text-[11px] text-amber-800 font-bold block mb-1">
                  {stx.statRemainingLabel || 'جلسات باقی‌مانده'}
                </span>
                <span className="text-lg font-black text-amber-900">
                  {toPersianDigits(stats.remaining)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">{stx.statRemainingSub || 'جلسه مانده'}</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                  {stx.statPastLabel || 'برگزار شده'}
                </span>
                <span className="text-lg font-black text-slate-800">
                  {toPersianDigits(stats.past)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{stx.statPastSub || 'جلسه گذشته'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/70">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">{labels.studentName}</div>
                  <div className="text-base font-bold text-slate-900">{student.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/70">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">{labels.month} و تعداد جلسات</div>
                  <div className="text-sm font-bold text-slate-900">
                    {labels.month} <span className="text-blue-600">{student.month}</span> •{' '}
                    <span className="text-emerald-700">{toPersianDigits(student.totalSessions)} {labels.totalSessions}</span>
                  </div>
                </div>
              </div>

              {student.subject && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">{labels.subject}:</span>{' '}
                    <strong className="text-slate-900">{student.subject}</strong>
                  </div>
                </div>
              )}

              {student.paymentStatus && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">{labels.paymentStatus}:</span>{' '}
                    <strong
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        student.paymentStatus === 'پرداخت شده'
                          ? 'text-emerald-700 bg-emerald-50'
                          : student.paymentStatus === 'بدهکار'
                          ? 'text-rose-700 bg-rose-50'
                          : student.paymentStatus === 'تسویه'
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {student.paymentStatus}
                    </strong>
                    {student.fee ? (
                      <span className="text-slate-600 mr-2 font-medium">({student.fee})</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Dynamic Custom Fields */}
              {customFieldDefs.map((def) => {
                const val = student.customValues?.[def.id];
                if (val === undefined || val === '' || val === null) return null;
                const displayVal = typeof val === 'boolean' ? (val ? 'بله' : 'خیر') : String(val);
                return (
                  <div key={def.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">{def.label}:</span>{' '}
                      <strong className="text-slate-900">{displayVal}</strong>
                    </div>
                  </div>
                );
              })}

              {teacherSettings?.phone && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">تلفن هماهنگی:</span>{' '}
                    <span className="font-semibold text-slate-800" dir="ltr">
                      {toPersianDigits(teacherSettings.phone)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Sessions: Day, Date, Time with color-coding */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>{stx.sessionsHeaderTitle || `برنامه زمان‌بندی ${labels.sessions}`}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stx.sessionsHeaderDesc || 'رنگ هر جلسه وضعیت برگزاری آن را مشخص می‌کند.'}
                </p>
              </div>

              {/* Status Legend */}
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {stx.todayBadgeText || 'امروز (سبز)'}
                </span>
                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> {stx.pastBadgeText || 'گذشته (قرمز)'}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {stx.futureBadgeText || 'آینده (زرد)'}
                </span>
              </div>
            </div>

            {student.sessionsList && student.sessionsList.length > 0 ? (
              <div className="space-y-2.5">
                {student.sessionsList.map((session, index) => {
                  const dateStatus = compareSessionDateWithToday(session.date);

                  let rowStyle = 'bg-white border-slate-200';
                  let numBadgeStyle = 'bg-slate-100 text-slate-700';
                  let statusBadgeText = stx.futureBadgeText || '🟡 در انتظار';
                  let statusBadgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';

                  if (dateStatus === 'today') {
                    rowStyle = 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/50 shadow-xs';
                    numBadgeStyle = 'bg-emerald-600 text-white';
                    statusBadgeText = stx.todayBadgeText || '🟢 جلسه امروز';
                    statusBadgeStyle = 'bg-emerald-600 text-white font-bold shadow-2xs';
                  } else if (dateStatus === 'past') {
                    rowStyle = 'bg-rose-50/60 border-rose-200 text-rose-950';
                    numBadgeStyle = 'bg-rose-100 text-rose-800';
                    statusBadgeText = stx.pastBadgeText || '🔴 برگزار شده';
                    statusBadgeStyle = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
                  } else {
                    rowStyle = 'bg-amber-50/50 border-amber-200 text-amber-950';
                    numBadgeStyle = 'bg-amber-100 text-amber-900';
                    statusBadgeText = stx.futureBadgeText || '🟡 جلسه آینده';
                    statusBadgeStyle = 'bg-amber-100 text-amber-900 border-amber-200 font-bold';
                  }

                  return (
                    <div
                      key={session.id || index}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-2 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${numBadgeStyle}`}>
                          {toPersianDigits(session.sessionNumber || index + 1)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>روز {session.dayOfWeek}</span>
                            {session.date && (
                              <span className="text-xs font-semibold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-md border border-slate-200 font-mono">
                                {toPersianDigits(session.date)}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${statusBadgeStyle}`}>
                              {statusBadgeText}
                            </span>
                          </div>
                          {session.topic && (
                            <div className="text-xs text-slate-600 mt-0.5">{session.topic}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>ساعت {toPersianDigits(session.time) || 'تعیین نشده'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line text-sm text-slate-700 leading-relaxed">
                {student.sessionsText || 'هنوز جلسه‌ای برای این شاگرد ثبت نشده است.'}
              </div>
            )}

            {/* Notes / Reminders */}
            {student.notes && (
              <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>{stx.notesTitle || `توضیحات و ${labels.notes}:`}</span>
                </div>
                <p className="leading-relaxed pr-5">{student.notes}</p>
              </div>
            )}
          </div>

          {/* Footer Card */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {stx.footerRightText || 'کارت رسمی برنامه هفتگی و ماهانه • تولید شده در سامانه مدیریت کلاس'}
            </div>
            <div className="font-medium text-slate-600">
              {stx.footerMotivationText || 'با آرزوی درخشش و موفقیت شاگرد گرامی ✨'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
