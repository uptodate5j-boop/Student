import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Send,
  Link,
  Printer,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Student, TeacherSettings, PAYMENT_STATUS_OPTIONS } from '../types';
import {
  PERSIAN_MONTHS,
  toPersianDigits,
  calculateStudentSessionStats,
  compareSessionDateWithToday,
  getFirstUpcomingSessionIndex,
  getSessionColorCategory,
} from '../utils/persianDate';
import { formatStudentMessage } from '../utils/storage';
import { DEFAULT_FIELD_LABELS, THEME_PALETTES } from '../utils/theme';

interface Props {
  students: Student[];
  teacherSettings: TeacherSettings;
  onEdit: (student: Student) => void;
  onDeleteRequest: (student: Student) => void;
  onOpenShareModal: (student: Student) => void;
  onOpenPrintModal: (student: Student) => void;
  onOpenStudentView: (student: Student) => void;
  onUpdatePaymentStatus?: (studentId: string, newStatus: string) => void;
}

export const StudentTable: React.FC<Props> = ({
  students,
  teacherSettings,
  onEdit,
  onDeleteRequest,
  onOpenShareModal,
  onOpenPrintModal,
  onOpenStudentView,
  onUpdatePaymentStatus,
}) => {
  const labels = { ...DEFAULT_FIELD_LABELS, ...(teacherSettings?.fieldLabels || {}) };
  const customFieldDefs = teacherSettings?.customFields || [];
  const isDark = !!teacherSettings?.theme?.isDark;
  const themePalette = THEME_PALETTES[teacherSettings?.theme?.color || 'crimson'];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Financial statistics
  const financialStats = useMemo(() => {
    const total = students.length;
    const paid = students.filter(
      (s) => (s.paymentStatus || 'در انتظار پرداخت') === 'پرداخت شده' || s.paymentStatus === 'تسویه'
    ).length;
    const debtor = students.filter(
      (s) => (s.paymentStatus || 'در انتظار پرداخت') === 'بدهکار'
    ).length;
    const pending = students.filter(
      (s) =>
        (s.paymentStatus || 'در انتظار پرداخت') === 'در انتظار پرداخت' ||
        s.paymentStatus === 'پیش‌پرداخت'
    ).length;
    return { total, paid, debtor, pending };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.subject && s.subject.toLowerCase().includes(q)) ||
        (s.month && s.month.includes(q));

      const matchMonth = selectedMonth === 'all' || s.month === selectedMonth;
      const currentStatus = s.paymentStatus || 'در انتظار پرداخت';
      const matchPayment =
        selectedPaymentStatus === 'all' || currentStatus === selectedPaymentStatus;

      return matchSearch && matchMonth && matchPayment;
    });
  }, [students, searchTerm, selectedMonth, selectedPaymentStatus]);

  const handleDirectWhatsApp = (student: Student) => {
    let cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '98' + cleanPhone.substring(1);
    }
    const message = formatStudentMessage(student, teacherSettings, true);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'پرداخت شده':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'بدهکار':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'تسویه':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'پیش‌پرداخت':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'در انتظار پرداخت':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedPaymentStatus('all')}
          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
            selectedPaymentStatus === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">کل شاگردان</div>
          <div className="text-lg font-black mt-0.5">{toPersianDigits(financialStats.total)}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPaymentStatus('پرداخت شده')}
          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
            selectedPaymentStatus === 'پرداخت شده'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-emerald-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>پرداخت شده و تسویه</span>
          </div>
          <div className="text-lg font-black mt-0.5 text-emerald-600 font-mono">
            {toPersianDigits(financialStats.paid)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPaymentStatus('بدهکار')}
          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
            selectedPaymentStatus === 'بدهکار'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white hover:bg-rose-50/50 border-slate-200 text-rose-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>بدهکار (نیاز به پیگیری)</span>
          </div>
          <div className="text-lg font-black mt-0.5 text-rose-600 font-mono">
            {toPersianDigits(financialStats.debtor)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPaymentStatus('در انتظار پرداخت')}
          className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
            selectedPaymentStatus === 'در انتظار پرداخت'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white hover:bg-amber-50/50 border-slate-200 text-amber-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار پرداخت</span>
          </div>
          <div className="text-lg font-black mt-0.5 text-amber-600 font-mono">
            {toPersianDigits(financialStats.pending)}
          </div>
        </button>
      </div>

      {/* Search and Filters Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 جستجو با نام شاگرد، شماره یا درس..."
            className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 sm:top-3" />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Month Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>ماه:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="all">همه ماه‌ها</option>
              {PERSIAN_MONTHS.map((m) => (
                <option key={m} value={m}>
                  ماه {m}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span>وضعیت مالی:</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="all">همه وضعیت‌ها</option>
              {PAYMENT_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium shrink-0">
            {toPersianDigits(filteredStudents.length)} شاگرد
          </span>
        </div>
      </div>

      {/* Main List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">هیچ شاگردی یافت نشد</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedMonth !== 'all'
              ? 'با تغییر کلمه جستجو یا حذف فیلتر ماه، مجدداً بررسی نمایید.'
              : 'برای ثبت اولین شاگرد، از دکمه «ثبت شاگرد جدید» در بالای صفحه استفاده کنید.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const isExpanded = expandedId === student.id;
            const stats = calculateStudentSessionStats(student);
            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl shadow-xs border border-slate-200/90 hover:border-blue-300 transition-all overflow-hidden"
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student summary */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {labels.month} {student.month}
                        </span>

                        {/* Total Sessions Count */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          کل: {toPersianDigits(stats.total)} {labels.totalSessions}
                        </span>

                        {/* Remaining Sessions Count */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          باقی‌مانده: {toPersianDigits(stats.remaining)} جلسه
                        </span>

                        {/* Completed / Past Sessions */}
                        {stats.past > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            گذشته: {toPersianDigits(stats.past)}
                          </span>
                        )}

                        {/* Has session today */}
                        {stats.today > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            امروز جلسه دارد
                          </span>
                        )}

                        {/* Interactive Payment Status Badge */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={student.paymentStatus || 'در انتظار پرداخت'}
                            onChange={(e) => onUpdatePaymentStatus?.(student.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-400/20 ${getStatusBadgeStyle(
                              student.paymentStatus
                            )}`}
                            title="تغییر سریع وضعیت پرداخت"
                          >
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                        {student.phone ? (
                          <span className="flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {toPersianDigits(student.phone)}
                          </span>
                        ) : (
                          <span className="text-slate-400">بدون شماره تماس</span>
                        )}

                        {student.subject && (
                          <span className="text-slate-600 font-medium">📚 {labels.subject}: {student.subject}</span>
                        )}

                        {student.fee && (
                          <span className="text-emerald-700 font-medium">💰 {labels.fee}: {student.fee}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons: WhatsApp, Link, Print, Edit, Delete */}
                  <div className="flex items-center gap-1.5 flex-wrap self-end md:self-center">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleDirectWhatsApp(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                      title="ارسال مستقیم برنامه به واتساپ شاگرد"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>واتساپ</span>
                    </button>

                    {/* Share Link */}
                    <button
                      type="button"
                      onClick={() => onOpenShareModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                      title="تولید و کپی لینک اختصاصی شاگرد"
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>لینک شاگرد</span>
                    </button>

                    {/* Print Receipt */}
                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                      title="چاپ فیش یا کارت برنامه کلاسی"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>چاپ</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(student)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                      title="ویرایش اطلاعات شاگرد"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete - Reliably calls delete modal */}
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(student)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="حذف شاگرد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Schedule Preview */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : student.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isExpanded ? 'بستن جزئیات' : 'مشاهده روزها و ساعت‌ها'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Session List */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          برنامه جلسات ({toPersianDigits(stats.total)} جلسه کل • {toPersianDigits(stats.remaining)} باقی‌مانده):
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Status Legend */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> اولین جلسه آینده (سبز)
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> روز گذشته (قرمز)
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> جلسات آینده (زرد)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenStudentView(student)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer mr-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>مشاهده کارت شاگرد</span>
                        </button>
                      </div>
                    </div>

                    {student.sessionsList && student.sessionsList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {(() => {
                          const firstUpcomingIdx = getFirstUpcomingSessionIndex(student.sessionsList);
                          return student.sessionsList.map((item, idx) => {
                            const category = getSessionColorCategory(item, idx, firstUpcomingIdx);
                            const dateStatus = compareSessionDateWithToday(item.date);

                            let cardClasses = 'bg-amber-50/70 border-amber-300 text-amber-950';
                            let badgeText = '🟡 جلسه آینده';
                            let badgeStyle = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
                            let numBadgeStyle = 'bg-amber-200 text-amber-900';

                            if (category === 'first_upcoming') {
                              cardClasses = 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/50 shadow-xs font-semibold';
                              badgeText = dateStatus === 'today' ? '🟢 امروز (اولین)' : '🟢 اولین جلسه آینده';
                              badgeStyle = 'bg-emerald-600 text-white font-extrabold shadow-2xs';
                              numBadgeStyle = 'bg-emerald-600 text-white font-extrabold';
                            } else if (category === 'past') {
                              cardClasses = 'bg-rose-50/75 border-rose-300 text-rose-950';
                              badgeText = item.isCompleted ? '🔴 برگزار شده' : '🔴 روز گذشته';
                              badgeStyle = 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
                              numBadgeStyle = 'bg-rose-200 text-rose-800 font-bold';
                            }

                            return (
                              <div
                                key={item.id || idx}
                                className={`p-3 rounded-xl border text-xs transition-all shadow-2xs ${cardClasses}`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold flex items-center gap-1.5">
                                    <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[11px] ${numBadgeStyle}`}>
                                      {toPersianDigits(item.sessionNumber || idx + 1)}
                                    </span>
                                    <span>جلسه {toPersianDigits(item.sessionNumber || idx + 1)}</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold">روز {item.dayOfWeek}</span>
                                  <span className="font-mono text-[11px] font-semibold">
                                    {toPersianDigits(item.date) || 'بدون تاریخ'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50">
                                  <span className="opacity-80">ساعت تمرین:</span>
                                  <strong className="font-bold">{toPersianDigits(item.time) || '-'}</strong>
                                </div>

                                {item.topic && (
                                  <div className="text-[11px] opacity-80 mt-1 pt-1 border-t border-slate-200/40 truncate" title={item.topic}>
                                    {item.topic}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs whitespace-pre-line text-slate-700">
                        {student.sessionsText || 'جلساتی ثبت نشده است.'}
                      </div>
                    )}

                    {/* Custom Fields (if any) */}
                    {customFieldDefs.length > 0 && student.customValues && Object.keys(student.customValues).length > 0 && (
                      <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-blue-900">اطلاعات اختصاصی:</span>
                        {customFieldDefs.map((def) => {
                          const val = student.customValues?.[def.id];
                          if (val === undefined || val === '' || val === null) return null;
                          const displayVal = typeof val === 'boolean' ? (val ? 'بله' : 'خیر') : String(val);
                          return (
                            <span key={def.id} className="bg-white px-2.5 py-1 rounded-lg border border-blue-200/80 text-slate-700 shadow-2xs">
                              <strong className="text-slate-900 font-semibold">{def.label}: </strong>
                              <span>{displayVal}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {student.notes && (
                      <div className="mt-3 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/70">
                        <strong>{labels.notes}: </strong>
                        <span>{student.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
