import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  PERSIAN_WEEKDAYS_SHORT,
  getTodayJalali,
  getJalaliMonthDays,
  getJalaliFirstDayWeekday,
  getJalaliDateWeekday,
  formatJalaliDate,
  parseJalaliDate,
  toPersianDigits,
} from '../utils/persianDate';

interface PersianDatePickerProps {
  isOpen: boolean;
  currentDate?: string;
  onSelectDate: (dateStr: string, weekdayName: string) => void;
  onClose: () => void;
  title?: string;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  isOpen,
  currentDate,
  onSelectDate,
  onClose,
  title = 'انتخاب تاریخ شمسی',
}) => {
  const today = getTodayJalali();
  const [selectedYear, setSelectedYear] = useState<number>(today.jy);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.jm);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize or update view when currentDate changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      const parsed = parseJalaliDate(currentDate);
      if (parsed) {
        setSelectedYear(parsed.jy);
        setSelectedMonth(parsed.jm);
        setActiveDay(parsed.jd);
      } else {
        setSelectedYear(today.jy);
        setSelectedMonth(today.jm);
        setActiveDay(today.jd);
      }
    }
  }, [isOpen, currentDate]);

  // Click outside to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthDaysCount = getJalaliMonthDays(selectedYear, selectedMonth);
  const firstDayWeekday = getJalaliFirstDayWeekday(selectedYear, selectedMonth); // 0: شنبه ... 6: جمعه

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setActiveDay(day);
    const dateFormatted = formatJalaliDate(selectedYear, selectedMonth, day);
    const weekdayIdx = getJalaliDateWeekday(selectedYear, selectedMonth, day);
    const weekdayName = PERSIAN_WEEKDAYS[weekdayIdx];
    onSelectDate(dateFormatted, weekdayName);
    onClose();
  };

  const handleSelectToday = () => {
    const dateFormatted = today.formatted;
    onSelectDate(dateFormatted, today.weekdayName);
    onClose();
  };

  // Generate year options around today's year (-2 to +5)
  const years = Array.from({ length: 8 }, (_, i) => today.jy - 2 + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-100" />
            <h3 className="text-sm font-bold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month and Year navigation */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          {/* Previous Month (Next calendar chronological in RTL is left arrow) */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 transition-all cursor-pointer"
            title="ماه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 text-xs font-bold bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {PERSIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 text-xs font-bold bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {toPersianDigits(y)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white hover:shadow-2xs text-slate-700 transition-all cursor-pointer"
            title="ماه بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {PERSIAN_WEEKDAYS_SHORT.map((wd, idx) => (
              <div
                key={wd}
                className={`text-[11px] font-bold py-1 ${
                  idx === 6 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for first day offset */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: monthDaysCount }).map((_, i) => {
              const day = i + 1;
              const isToday =
                selectedYear === today.jy && selectedMonth === today.jm && day === today.jd;
              const isSelected =
                activeDay === day &&
                parseJalaliDate(currentDate)?.jy === selectedYear &&
                parseJalaliDate(currentDate)?.jm === selectedMonth;
              const weekdayIdx = (firstDayWeekday + i) % 7;
              const isFriday = weekdayIdx === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-105 font-bold'
                      : isToday
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold hover:bg-emerald-200'
                      : isFriday
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{toPersianDigits(day)}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSelectToday}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>امروز ({toPersianDigits(today.jd)} {today.monthName})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
