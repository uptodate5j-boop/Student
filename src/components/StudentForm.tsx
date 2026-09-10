import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  User,
  Phone,
  Check,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Wand2,
  CreditCard,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { Student, SessionItem, PAYMENT_STATUS_OPTIONS, TeacherSettings } from '../types';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  getCurrentPersianMonth,
  toPersianDigits,
  compareSessionDateWithToday,
  formatAmountWithCommas,
  generateWeeklyPatternDates,
  addDaysToJalali,
  parseJalaliDate,
  formatJalaliDate,
  getTodayJalali,
  getJalaliDateWeekday,
} from '../utils/persianDate';
import { parseSessionsText } from '../utils/storage';
import { DEFAULT_FIELD_LABELS, THEME_PALETTES } from '../utils/theme';
import { PersianDatePicker } from './PersianDatePicker';

interface Props {
  initialStudent?: Student | null;
  teacherSettings?: TeacherSettings;
  onSave: (student: Student) => void;
  onCancel: () => void;
}

const TIME_SLOTS = [
  '۰۶:۰۰',
  '۰۶:۳۰',
  '۰۷:۰۰',
  '۰۷:۳۰',
  '۰۸:۰۰',
  '۰۸:۳۰',
  '۰۹:۰۰',
  '۰۹:۳۰',
  '۱۰:۰۰',
  '۱۰:۳۰',
  '۱۱:۰۰',
  '۱۱:۳۰',
  '۱۲:۰۰',
  '۱۲:۳۰',
  '۱۳:۰۰',
  '۱۳:۳۰',
  '۱۴:۰۰',
  '۱۴:۳۰',
  '۱۵:۰۰',
  '۱۵:۳۰',
  '۱۶:۰۰',
  '۱۶:۳۰',
  '۱۷:۰۰',
  '۱۷:۳۰',
  '۱۸:۰۰',
  '۱۸:۳۰',
  '۱۹:۰۰',
  '۱۹:۳۰',
  '۲۰:۰۰',
  '۲۰:۳۰',
  '۲۱:۰۰',
  '۲۱:۳۰',
  '۲۲:۰۰',
  '۲۲:۳۰',
  '۲۳:۰۰',
];

const FEE_PRESETS = ['۱,۰۰۰,۰۰۰', '۱,۵۰۰,۰۰۰', '۲,۰۰۰,۰۰۰', '۲,۵۰۰,۰۰۰', '۳,۰۰۰,۰۰۰', '۴,۰۰۰,۰۰۰'];

export const StudentForm: React.FC<Props> = ({
  initialStudent,
  teacherSettings,
  onSave,
  onCancel,
}) => {
  const labels = { ...DEFAULT_FIELD_LABELS, ...(teacherSettings?.fieldLabels || {}) };
  const customFieldDefs = teacherSettings?.customFields || [];
  const isDark = !!teacherSettings?.theme?.isDark;
  const themePalette = THEME_PALETTES[teacherSettings?.theme?.color || 'crimson'];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [month, setMonth] = useState(getCurrentPersianMonth());
  const [totalSessions, setTotalSessions] = useState(8);
  const [subject, setSubject] = useState('');
  const [fee, setFee] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('پرداخت شده');
  const [notes, setNotes] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string | boolean | number>>({});

  // Mode: 'structured' | 'text'
  const [inputMode, setInputMode] = useState<'structured' | 'text'>('structured');
  const [sessionsText, setSessionsText] = useState('');
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);

  // State for Persian Date Picker modal
  const [activePickerSessionId, setActivePickerSessionId] = useState<string | null>(null);

  // State for Drag and Drop session reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialStudent) {
      setName(initialStudent.name || '');
      setPhone(initialStudent.phone || '');
      setMonth(initialStudent.month || getCurrentPersianMonth());
      setTotalSessions(Number(initialStudent.totalSessions) || 8);
      setSubject(initialStudent.subject || '');
      setFee(initialStudent.fee || '');
      setPaymentStatus(initialStudent.paymentStatus || 'پرداخت شده');
      setNotes(initialStudent.notes || '');
      setSessionsText(initialStudent.sessionsText || '');
      setCustomValues(initialStudent.customValues || {});

      if (initialStudent.sessionsList && initialStudent.sessionsList.length > 0) {
        setSessionsList(initialStudent.sessionsList);
      } else if (initialStudent.sessionsText) {
        setSessionsList(parseSessionsText(initialStudent.sessionsText));
      } else {
        generateDefaultSessionsWithDates(8, ['شنبه', 'دوشنبه', 'چهارشنبه'], '۱۶:۰۰');
      }
    } else {
      // Default new student with auto-generated dates
      setName('');
      setPhone('');
      setMonth(getCurrentPersianMonth());
      setTotalSessions(8);
      setSubject('');
      setFee('');
      setPaymentStatus('پرداخت شده');
      setNotes('');
      setSessionsText('');
      setCustomValues({});
      generateDefaultSessionsWithDates(8, ['شنبه', 'دوشنبه', 'چهارشنبه'], '۱۶:۰۰');
    }
  }, [initialStudent]);

  // Generator for default sessions with automatic dates starting from today
  const generateDefaultSessionsWithDates = (
    count: number,
    patternDays: string[] = ['شنبه', 'دوشنبه', 'چهارشنبه'],
    defaultTime: string = '۱۶:۰۰'
  ) => {
    const dates = generateWeeklyPatternDates(count, patternDays);
    const list: SessionItem[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: `sess-${Date.now()}-${i}`,
        sessionNumber: i + 1,
        dayOfWeek: dates[i]?.dayOfWeek || patternDays[i % patternDays.length],
        date: dates[i]?.date || '',
        time: defaultTime,
        topic: '',
      });
    }
    setSessionsList(list);
  };

  const handleTotalSessionsChange = (newCount: number) => {
    if (newCount < 1) return;
    setTotalSessions(newCount);
    if (inputMode === 'structured') {
      if (sessionsList.length < newCount) {
        // Append missing sessions with auto-calculated sequential dates
        const daysPattern = ['شنبه', 'دوشنبه', 'چهارشنبه'];
        const lastSession = sessionsList[sessionsList.length - 1];
        let pointer = lastSession?.date ? parseJalaliDate(lastSession.date) : null;
        const newList = [...sessionsList];

        for (let i = sessionsList.length; i < newCount; i++) {
          const nextNum = i + 1;
          let dateStr = '';
          let dayOfWeek = daysPattern[i % daysPattern.length];

          if (pointer) {
            const nextJ = addDaysToJalali(pointer.jy, pointer.jm, pointer.jd, 2);
            dateStr = formatJalaliDate(nextJ.jy, nextJ.jm, nextJ.jd);
            const wIdx = getJalaliDateWeekday(nextJ.jy, nextJ.jm, nextJ.jd);
            dayOfWeek = PERSIAN_WEEKDAYS[wIdx];
            pointer = nextJ;
          } else {
            const today = getTodayJalali();
            dateStr = today.formatted;
            dayOfWeek = today.weekdayName;
            pointer = { jy: today.jy, jm: today.jm, jd: today.jd };
          }

          newList.push({
            id: `sess-${Date.now()}-${nextNum}`,
            sessionNumber: nextNum,
            dayOfWeek,
            date: dateStr,
            time: lastSession?.time || '۱۶:۰۰',
            topic: '',
          });
        }
        setSessionsList(newList);
      } else if (sessionsList.length > newCount) {
        setSessionsList(sessionsList.slice(0, newCount));
      }
    }
  };

  // Steppers for incrementing / decrementing total sessions
  const handleIncrementSessions = () => {
    const current = totalSessions || sessionsList.length || 0;
    handleTotalSessionsChange(current + 1);
  };

  const handleDecrementSessions = () => {
    const current = totalSessions || sessionsList.length || 1;
    if (current <= 1) return;
    handleTotalSessionsChange(current - 1);
  };

  const handleAddSession = () => {
    const nextNum = sessionsList.length + 1;
    const lastSession = sessionsList[sessionsList.length - 1];
    let nextDateStr = '';
    let nextDayOfWeek = 'شنبه';

    if (lastSession?.date) {
      const parsed = parseJalaliDate(lastSession.date);
      if (parsed) {
        // Default advance 2 days
        const nextJ = addDaysToJalali(parsed.jy, parsed.jm, parsed.jd, 2);
        nextDateStr = formatJalaliDate(nextJ.jy, nextJ.jm, nextJ.jd);
        const wIdx = getJalaliDateWeekday(nextJ.jy, nextJ.jm, nextJ.jd);
        nextDayOfWeek = PERSIAN_WEEKDAYS[wIdx];
      }
    } else {
      const today = getTodayJalali();
      nextDateStr = today.formatted;
      nextDayOfWeek = today.weekdayName;
    }

    setSessionsList([
      ...sessionsList,
      {
        id: `sess-${Date.now()}-${nextNum}`,
        sessionNumber: nextNum,
        dayOfWeek: nextDayOfWeek,
        date: nextDateStr,
        time: lastSession?.time || '۱۶:۰۰',
        topic: '',
      },
    ]);
    setTotalSessions(nextNum);
  };

  const handleRemoveSession = (id: string) => {
    const updated = sessionsList
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    setSessionsList(updated);
    if (updated.length >= 1) {
      setTotalSessions(updated.length);
    }
  };

  const handleUpdateSession = (id: string, field: keyof SessionItem, value: string) => {
    setSessionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Reorder Sessions: Move Up
  const handleMoveSessionUp = (index: number) => {
    if (index <= 0) return;
    setSessionsList((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    });
  };

  // Reorder Sessions: Move Down
  const handleMoveSessionDown = (index: number) => {
    if (index >= sessionsList.length - 1) return;
    setSessionsList((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    });
  };

  // Direct Position Jump (e.g. move session 8 to session 2)
  const handleMoveSessionToPosition = (fromIndex: number, targetPosition: number) => {
    const targetIndex = targetPosition - 1;
    if (targetIndex < 0 || targetIndex >= sessionsList.length || targetIndex === fromIndex) return;
    setSessionsList((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    });
  };

  // Drag and drop handlers for sessions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setSessionsList((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Sort sessions chronologically based on their Shamsi date
  const handleSortSessionsByDate = () => {
    setSessionsList((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        const pa = parseJalaliDate(a.date);
        const pb = parseJalaliDate(b.date);
        if (!pa && !pb) return 0;
        if (!pa) return 1;
        if (!pb) return -1;
        const valA = pa.jy * 10000 + pa.jm * 100 + pa.jd;
        const valB = pb.jy * 10000 + pb.jm * 100 + pb.jd;
        return valA - valB;
      });
      return sorted.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    });
  };

  // Convert sessions list to text
  const syncListToText = () => {
    const lines = sessionsList.map((s) => {
      let l = `${s.dayOfWeek}`;
      if (s.date) l += ` ${s.date}`;
      if (s.time) l += ` ساعت ${s.time}`;
      if (s.topic) l += ` (${s.topic})`;
      return l;
    });
    setSessionsText(lines.join('\n'));
  };

  // Switch to text mode
  const handleSwitchToText = () => {
    syncListToText();
    setInputMode('text');
  };

  // Switch to structured mode from text
  const handleSwitchToStructured = () => {
    if (sessionsText.trim()) {
      const parsed = parseSessionsText(sessionsText);
      setSessionsList(parsed);
      if (parsed.length >= 1 && parsed.length <= 12) {
        setTotalSessions(parsed.length);
      }
    }
    setInputMode('structured');
  };

  // Apply quick presets with auto-calculated sequential Shamsi dates
  const applyPreset = (pattern: 'even' | 'odd' | 'thursdays') => {
    let days: string[] = [];
    if (pattern === 'even') days = ['شنبه', 'دوشنبه', 'چهارشنبه'];
    if (pattern === 'odd') days = ['یکشنبه', 'سه‌شنبه'];
    if (pattern === 'thursdays') days = ['پنج‌شنبه'];

    const count = totalSessions || 8;
    const dates = generateWeeklyPatternDates(count, days);
    const list: SessionItem[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: `sess-${Date.now()}-${i}`,
        sessionNumber: i + 1,
        dayOfWeek: dates[i]?.dayOfWeek || days[i % days.length],
        date: dates[i]?.date || '',
        time: '۱۶:۰۰',
        topic: '',
      });
    }
    setSessionsList(list);
  };

  // Auto-fill all dates sequentially from today
  const handleAutoFillAllDates = () => {
    const count = sessionsList.length || totalSessions || 8;
    const existingDays = sessionsList.map((s) => s.dayOfWeek).filter(Boolean);
    const pattern: string[] = existingDays.length > 0 ? Array.from(new Set(existingDays)) : ['شنبه', 'دوشنبه', 'چهارشنبه'];
    const dates = generateWeeklyPatternDates(count, pattern);
    setSessionsList((prev) =>
      prev.map((s, idx) => ({
        ...s,
        date: dates[idx]?.date || s.date,
        dayOfWeek: dates[idx]?.dayOfWeek || s.dayOfWeek,
      }))
    );
  };

  // Format fee input with commas (3-digit grouping)
  const handleFeeInputChange = (value: string) => {
    const formatted = formatAmountWithCommas(value);
    if (!formatted) {
      setFee('');
    } else {
      setFee(`${toPersianDigits(formatted)} تومان`);
    }
  };

  const handleCustomFieldChange = (fieldId: string, val: string | boolean | number) => {
    setCustomValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('لطفاً نام و نام خانوادگی شاگرد را وارد کنید.');
      return;
    }

    let finalSessionsList = sessionsList;
    let finalSessionsText = sessionsText;

    if (inputMode === 'structured') {
      const lines = sessionsList.map((s) => {
        let l = `${s.dayOfWeek}`;
        if (s.date) l += ` ${s.date}`;
        if (s.time) l += ` ساعت ${s.time}`;
        if (s.topic) l += ` (${s.topic})`;
        return l;
      });
      finalSessionsText = lines.join('\n');
    } else {
      finalSessionsList = parseSessionsText(sessionsText);
    }

    const studentData: Student = {
      id: initialStudent?.id || `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      phone: phone.trim(),
      month,
      totalSessions: Number(totalSessions) || finalSessionsList.length || 8,
      subject: subject.trim(),
      fee: fee.trim(),
      paymentStatus,
      notes: notes.trim(),
      sessionsText: finalSessionsText.trim(),
      sessionsList: finalSessionsList,
      customValues,
      createdAt: initialStudent?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(studentData);
  };

  return (
    <div
      className={`rounded-2xl shadow-sm border p-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Persian Calendar Picker Modal */}
      <PersianDatePicker
        isOpen={!!activePickerSessionId}
        currentDate={sessionsList.find((s) => s.id === activePickerSessionId)?.date}
        onSelectDate={(dateFormatted, weekdayName) => {
          if (activePickerSessionId) {
            setSessionsList((prev) =>
              prev.map((s) =>
                s.id === activePickerSessionId
                  ? {
                      ...s,
                      date: dateFormatted,
                      dayOfWeek: weekdayName || s.dayOfWeek,
                    }
                  : s
              )
            );
          }
        }}
        onClose={() => setActivePickerSessionId(null)}
      />

      {/* Header */}
      <div className={`flex items-center justify-between pb-5 border-b mb-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User className={`w-5 h-5 ${themePalette.accent}`} />
            <span>{initialStudent ? 'ویرایش اطلاعات شاگرد' : 'ثبت شاگرد جدید'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            اطلاعات شاگرد، جلسات تمرینی و برنامه زمانی را تکمیل و ذخیره نمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>بازگشت به لیست</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {labels.studentName} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: علی محمدی"
                className={`w-full pr-9 pl-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {labels.phone}
            </label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912..."
                className={`w-full pr-9 pl-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} transition-all text-right ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {labels.month}
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} transition-all font-medium ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
              }`}
            >
              {PERSIAN_MONTHS.map((m) => (
                <option key={m} value={m}>
                  ماه {m}
                </option>
              ))}
            </select>
          </div>

          {/* Total sessions stepper and dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {labels.totalSessions} (افزایش / کاهش مستقیم)
              </label>
              <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                {toPersianDigits(totalSessions)} جلسه
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDecrementSessions}
                disabled={totalSessions <= 1}
                className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                title="کاهش یک جلسه (-)"
              >
                <Minus className="w-4 h-4" />
              </button>

              <select
                value={totalSessions}
                onChange={(e) => handleTotalSessionsChange(Number(e.target.value))}
                className={`flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {toPersianDigits(n)} جلسه {n === 8 ? '(پیش‌فرض ۸ جلسه)' : n === 12 ? '(۱۲ جلسه)' : ''}
                  </option>
                ))}
                {totalSessions > 24 && (
                  <option value={totalSessions}>
                    {toPersianDigits(totalSessions)} جلسه
                  </option>
                )}
              </select>

              <button
                type="button"
                onClick={handleIncrementSessions}
                className="w-9 h-9 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                title="افزایش یک جلسه (+)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Info: Subject, Fee with comma separation, Payment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {labels.subject} (اختیاری)
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: بدنسازی / ژیمناستیک / فانکشنال"
                className={`w-full pr-9 pl-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <BookOpen className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Fee with comma separation */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {labels.fee} (به تومان - با ویرگول سه‌رقمی)
            </label>
            <div className="relative">
              <input
                type="text"
                value={fee}
                onChange={(e) => handleFeeInputChange(e.target.value)}
                placeholder="مثال: ۱,۵۰۰,۰۰۰ تومان"
                className={`w-full pl-14 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} font-semibold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                }`}
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                تومان
              </span>
            </div>
            {/* Quick Fee Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {FEE_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFee(`${amt} تومان`)}
                  className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                    fee.includes(amt)
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                {labels.paymentStatus}:
              </span>
              <span className="text-[11px] text-slate-400 font-normal">وضعیت دریافت شهریه</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_STATUS_OPTIONS.map((st) => {
                const isSelected = paymentStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPaymentStatus(st)}
                    className={`py-2 px-1 text-xs rounded-xl font-bold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? st === 'پرداخت شده'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : st === 'بدهکار'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : st === 'تسویه'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Dynamic Fields */}
        {customFieldDefs.length > 0 && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/70 border-slate-200/80'}`}>
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>فیلدهای سفارشی مربی:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {customFieldDefs.map((def) => {
                const currentVal = customValues[def.id];
                if (def.type === 'boolean') {
                  return (
                    <label key={def.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(currentVal)}
                        onChange={(e) => handleCustomFieldChange(def.id, e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{def.label}</span>
                    </label>
                  );
                }

                if (def.type === 'select') {
                  return (
                    <div key={def.id}>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        {def.label}
                      </label>
                      <select
                        value={String(currentVal || '')}
                        onChange={(e) => handleCustomFieldChange(def.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="">انتخاب...</option>
                        {def.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={def.id}>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {def.label}
                    </label>
                    <input
                      type={def.type === 'number' ? 'number' : 'text'}
                      value={String(currentVal || '')}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          def.id,
                          def.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                      placeholder={def.placeholder || ''}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sessions Section */}
        <div className={`border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <label className={`block text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <Clock className={`w-4 h-4 ${themePalette.accent}`} />
                <span>{labels.sessions} (روزها، تاریخ‌ها و ساعت‌های تمرین)</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                تاریخ به صورت خودکار ثبت می‌شود؛ برای تغییر تاریخ از تقویم و برای ساعت از لیست کشویی استفاده کنید.
              </p>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={handleSwitchToStructured}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'structured'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ورود جدولی (پیشنهادی)
              </button>
              <button
                type="button"
                onClick={handleSwitchToText}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                متن ساده
              </button>
            </div>
          </div>

          {/* Quick Presets and Date auto-fill bar */}
          {inputMode === 'structured' && (
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                  الگوهای آماده:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('even')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  زوج (ش/د/چ) با تاریخ
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('odd')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  فرد (ی/س) با تاریخ
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('thursdays')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  فقط پنج‌شنبه‌ها
                </button>

                {/* Direct Session Count Stepper in Presets Bar */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">تعداد جلسات:</span>
                  <button
                    type="button"
                    onClick={handleDecrementSessions}
                    disabled={sessionsList.length <= 1}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="کاهش یک جلسه"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold px-1 text-blue-600 dark:text-blue-400">
                    {toPersianDigits(sessionsList.length)}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementSessions}
                    className="w-5 h-5 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 cursor-pointer"
                    title="افزایش یک جلسه"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="mr-auto flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSortSessionsByDate}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-100 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="مرتب‌سازی جلسات از تاریخ قدیم به جدید"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                    <span>مرتب‌سازی بر اساس تاریخ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoFillAllDates}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="به‌روزرسانی خودکار تاریخ‌های تمام جلسات به صورت متوالی از امروز"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تنظیم تاریخ‌ها از امروز</span>
                  </button>
                </div>
              </div>

              {/* Reordering Guide Banner */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300">
                <GripVertical className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  <strong>قابلیت جابه‌جایی روزها و جلسات:</strong> می‌توانید جلسات را با کشیدن و رها کردن (Drag & Drop)، فلش‌های بالا (↑) و پایین (↓)، یا تغییر منوی شماره جلسه جابه‌جا کنید.
                </span>
              </div>
            </div>
          )}

          {/* Color Code Legend */}
          {inputMode === 'structured' && (
            <div className="flex flex-wrap items-center gap-4 mb-3 px-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="text-slate-400">راهنمای رنگ جلسات:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                سبز: جلسه امروز
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                قرمز: جلسه روز گذشته
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                زرد: جلسه آینده (هنوز زمانش نرسیده)
              </span>
            </div>
          )}

          {inputMode === 'structured' ? (
            <div className="space-y-2.5">
              {sessionsList.map((session, index) => {
                const dateStatus = compareSessionDateWithToday(session.date);

                // Row border and accent based on date status
                let statusCardStyle = 'bg-slate-50/80 border-slate-200';
                if (dateStatus === 'today') {
                  statusCardStyle = 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/40';
                } else if (dateStatus === 'past') {
                  statusCardStyle = 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800';
                } else if (dateStatus === 'future') {
                  statusCardStyle = 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
                }

                const isDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={session.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 rounded-xl border transition-all ${statusCardStyle} ${
                      isDragged ? 'opacity-40 border-dashed border-blue-500' : ''
                    } ${isDragOver ? 'ring-2 ring-blue-500 scale-[1.01] bg-blue-50/40 dark:bg-blue-900/30' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                      title="برای جابه‌جایی روز جلسه، این آیکون را بکشید و در ردیف مورد نظر رها کنید"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Move Up / Down Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSessionUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-500 hover:text-blue-600 disabled:opacity-25 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                        title="انتقال به یک ردیف بالاتر (جابه‌جایی روز)"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSessionDown(index)}
                        disabled={index === sessionsList.length - 1}
                        className="p-1 rounded bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-500 hover:text-blue-600 disabled:opacity-25 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                        title="انتقال به یک ردیف پایین‌تر (جابه‌جایی روز)"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Session Number & Direct Position Selector */}
                    <div className="shrink-0">
                      <select
                        value={index + 1}
                        onChange={(e) => handleMoveSessionToPosition(index, Number(e.target.value))}
                        className={`px-1.5 py-1 rounded-lg font-bold text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-center transition-all ${
                          dateStatus === 'today'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : dateStatus === 'past'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                        }`}
                        title="تغییر مستقیم شماره و جایگاه این جلسه"
                      >
                        {sessionsList.map((_, pIdx) => (
                          <option
                            key={pIdx + 1}
                            value={pIdx + 1}
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            جلسه {toPersianDigits(pIdx + 1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Day of Week */}
                    <div className="w-28 shrink-0">
                      <select
                        value={session.dayOfWeek}
                        onChange={(e) => handleUpdateSession(session.id, 'dayOfWeek', e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                        title="انتخاب روز هفته"
                      >
                        {PERSIAN_WEEKDAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Input with Calendar Picker Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={session.date}
                        onChange={(e) => handleUpdateSession(session.id, 'date', e.target.value)}
                        placeholder="تاریخ (۱۴۰۵/۰۶/۱۵)"
                        className={`w-28 px-2 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setActivePickerSessionId(session.id)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700 transition-colors cursor-pointer shrink-0"
                        title="انتخاب تاریخ از روی تقویم"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Time dropdown menu */}
                    <div className="w-28 shrink-0">
                      <select
                        value={session.time}
                        onChange={(e) => handleUpdateSession(session.id, 'time', e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-medium cursor-pointer ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                        title="انتخاب ساعت جلسه"
                      >
                        {session.time && !TIME_SLOTS.includes(session.time) && (
                          <option value={session.time}>{toPersianDigits(session.time)}</option>
                        )}
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            ساعت {toPersianDigits(slot)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {dateStatus === 'today' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          امروز (سبز)
                        </span>
                      )}
                      {dateStatus === 'past' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          روز گذشته (قرمز)
                        </span>
                      )}
                      {dateStatus === 'future' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          زمانش نرسیده (زرد)
                        </span>
                      )}
                    </div>

                    {/* Topic / Note */}
                    <div className="flex-1 min-w-[120px]">
                      <input
                        type="text"
                        value={session.topic || ''}
                        onChange={(e) => handleUpdateSession(session.id, 'topic', e.target.value)}
                        placeholder="موضوع جلسه (اختیاری)"
                        className={`w-full px-2 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Delete session row */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(session.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="حذف این جلسه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* Sessions Table Footer Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 mt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddSession}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-600 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن جلسه بعدی (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (sessionsList.length > 1) {
                        handleRemoveSession(sessionsList[sessionsList.length - 1].id);
                      }
                    }}
                    disabled={sessionsList.length <= 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="حذف آخرین جلسه"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>کاهش جلسه آخر (-)</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  مجموع جلسات تنظیم‌شده: <span className="font-bold text-blue-600 dark:text-blue-400">{toPersianDigits(sessionsList.length)} جلسه</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                متن روزها و ساعت‌ها (هر جلسه در یک سطر نوشته شود):
              </label>
              <textarea
                rows={6}
                value={sessionsText}
                onChange={(e) => setSessionsText(e.target.value)}
                placeholder={`مثال:
شنبه ۱ مهر ساعت ۱۶:۰۰
دوشنبه ۳ مهر ساعت ۱۶:۰۰
چهارشنبه ۵ مهر ساعت ۱۶:۰۰`}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                نکته: با زدن دکمه «ورود جدولی»، این خطوط به طور خودکار به ساختار تفکیک‌شده تبدیل می‌شوند.
              </p>
            </div>
          )}
        </div>

        {/* Teacher Notes */}
        <div className={`border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {labels.notes} (اختیاری)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: لباس ورزشی و قمقمه آب همراه باشد. در صورت غیبت ۲۴ ساعت قبل اطلاع دهید."
            className={`w-full p-3 text-xs rounded-xl border focus:outline-none focus:ring-2 ${themePalette.ring} ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
            }`}
          />
        </div>

        {/* Actions Buttons */}
        <div
          className={`flex items-center justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={onCancel}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            انصراف
          </button>
          <button
            type="submit"
            id="btn-save-student"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer ${themePalette.buttonBg} ${themePalette.buttonHover}`}
          >
            <Check className="w-4 h-4" />
            <span>{initialStudent ? 'ذخیره تغییرات' : 'ثبت و ذخیره'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
