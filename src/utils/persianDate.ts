export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i));
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return result;
}

// Gregorian to Jalali conversion
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

// Jalali to Gregorian conversion
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;
  let j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
  for (let i = 0; i < jm2; ++i) {
    j_day_no += i < 6 ? 31 : 30;
  }
  j_day_no += jd2;
  const g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  let days = g_day_no % 146097;
  let leap = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days = days % 36524;
    if (days >= 365) days++;
    else leap = false;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    leap = false;
    days--;
    gy += Math.floor(days / 365);
    days = days % 365;
  }
  const g_d_m = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (days >= g_d_m[gm + 1]) {
    days -= g_d_m[gm + 1];
    gm++;
  }
  return { gy, gm: gm + 1, gd: days + 1 };
}

// Check if a Jalali year is a leap year
export function isJalaliLeapYear(jy: number): boolean {
  const g1 = jalaliToGregorian(jy, 12, 30);
  const back = gregorianToJalali(g1.gy, g1.gm, g1.gd);
  return back.jy === jy && back.jm === 12 && back.jd === 30;
}

// Number of days in a Jalali month
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29;
  return 30;
}

// Get the weekday of the 1st of a Jalali month (0 = شنبه, 1 = یکشنبه, ..., 6 = جمعه)
export function getJalaliFirstDayWeekday(jy: number, jm: number): number {
  const g = jalaliToGregorian(jy, jm, 1);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  return (d.getDay() + 1) % 7;
}

// Get the weekday index of any Jalali date
export function getJalaliDateWeekday(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  return (d.getDay() + 1) % 7;
}

// Get today's Jalali date object
export function getTodayJalali(): {
  jy: number;
  jm: number;
  jd: number;
  weekdayIdx: number;
  weekdayName: string;
  monthName: string;
  formatted: string;
} {
  const now = new Date();
  const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const weekdayIdx = (now.getDay() + 1) % 7;
  const weekdayName = PERSIAN_WEEKDAYS[weekdayIdx];
  const monthName = PERSIAN_MONTHS[j.jm - 1];
  const formatted = `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  return {
    jy: j.jy,
    jm: j.jm,
    jd: j.jd,
    weekdayIdx,
    weekdayName,
    monthName,
    formatted,
  };
}

export function formatJalaliDate(jy: number, jm: number, jd: number, separator = '/'): string {
  return `${jy}${separator}${String(jm).padStart(2, '0')}${separator}${String(jd).padStart(2, '0')}`;
}

export function getTodayPersianFormatted(): {
  full: string;
  weekday: string;
  dateStr: string;
  monthName: string;
} {
  const today = getTodayJalali();
  return {
    full: `${today.weekdayName} ${today.jd} ${today.monthName} ${today.jy}`,
    weekday: today.weekdayName,
    dateStr: today.formatted,
    monthName: today.monthName,
  };
}

export function getCurrentPersianMonth(): string {
  return getTodayJalali().monthName;
}

// Parse various Persian date formats into { jy, jm, jd }
export function parseJalaliDate(input: string | undefined | null): { jy: number; jm: number; jd: number } | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = toEnglishDigits(input.trim());
  const today = getTodayJalali();

  // Pattern: 1405/06/15 or 1405-06-15 or 1405.06.15
  const fullMatch = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (fullMatch) {
    const jy = parseInt(fullMatch[1], 10);
    const jm = parseInt(fullMatch[2], 10);
    const jd = parseInt(fullMatch[3], 10);
    if (jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
      return { jy, jm, jd };
    }
  }

  // Pattern: 06/15 (month/day)
  const partialMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
  if (partialMatch) {
    const jm = parseInt(partialMatch[1], 10);
    const jd = parseInt(partialMatch[2], 10);
    if (jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
      return { jy: today.jy, jm, jd };
    }
  }

  // Pattern: "15 شهریور" or "15 شهریور 1405"
  for (let mIdx = 0; mIdx < PERSIAN_MONTHS.length; mIdx++) {
    const mName = PERSIAN_MONTHS[mIdx];
    if (cleaned.includes(mName)) {
      const dayMatch = cleaned.match(/(\d{1,2})/);
      const yearMatch = cleaned.match(/(\d{4})/);
      if (dayMatch) {
        return {
          jy: yearMatch ? parseInt(yearMatch[1], 10) : today.jy,
          jm: mIdx + 1,
          jd: parseInt(dayMatch[1], 10),
        };
      }
    }
  }

  return null;
}

export type SessionDateStatus = 'today' | 'past' | 'future' | 'unknown';

// User's requested color scheme categories:
// - 'past': Session date has passed -> RED (قرمز)
// - 'first_upcoming': The very first upcoming/current session -> GREEN (سبز)
// - 'future': Subsequent upcoming sessions -> YELLOW (زرد)
export type SessionColorCategory = 'past' | 'first_upcoming' | 'future';

// Compare session date with today:
// - 'today'  -> Matches today's Jalali date
// - 'past'   -> Date is before today
// - 'future' -> Date is after today (or pending)
export function compareSessionDateWithToday(dateStr: string | undefined | null): SessionDateStatus {
  if (!dateStr || !dateStr.trim()) return 'future'; // If no date, treat as pending/future
  const parsed = parseJalaliDate(dateStr);
  if (!parsed) return 'unknown';

  const today = getTodayJalali();

  if (parsed.jy === today.jy && parsed.jm === today.jm && parsed.jd === today.jd) {
    return 'today';
  }

  if (
    parsed.jy < today.jy ||
    (parsed.jy === today.jy && parsed.jm < today.jm) ||
    (parsed.jy === today.jy && parsed.jm === today.jm && parsed.jd < today.jd)
  ) {
    return 'past';
  }

  return 'future';
}

/**
 * Finds the index of the first upcoming session in a list of sessions.
 * Sessions that are past (date < today) or marked completed are ignored.
 * If sessions have dates, the one with the earliest date >= today is chosen.
 * If multiple or no dates, the first one in list sequence is chosen.
 */
export function getFirstUpcomingSessionIndex<T extends { date?: string; isCompleted?: boolean }>(
  sessions: T[] | undefined | null
): number {
  if (!sessions || sessions.length === 0) return -1;

  let bestIndex = -1;
  let bestDateVal = Infinity;

  sessions.forEach((s, idx) => {
    if (s.isCompleted) return;
    const dateStatus = compareSessionDateWithToday(s.date);
    if (dateStatus === 'past') return;

    // It's either 'today' or 'future'
    const parsed = parseJalaliDate(s.date);
    const dateVal = parsed ? parsed.jy * 10000 + parsed.jm * 100 + parsed.jd : 99999999;

    if (bestIndex === -1 || dateVal < bestDateVal) {
      bestIndex = idx;
      bestDateVal = dateVal;
    }
  });

  return bestIndex;
}

/**
 * Returns the color category for a session:
 * - 'past': Date has passed -> RED (قرمز)
 * - 'first_upcoming': Earliest non-past session -> GREEN (سبز)
 * - 'future': Subsequent upcoming sessions -> YELLOW (زرد)
 */
export function getSessionColorCategory(
  session: { date?: string; isCompleted?: boolean },
  sessionIndex: number,
  firstUpcomingIndex: number
): SessionColorCategory {
  if (session.isCompleted) {
    return 'past';
  }
  const dateStatus = compareSessionDateWithToday(session.date);
  if (dateStatus === 'past') {
    return 'past';
  }
  if (sessionIndex === firstUpcomingIndex) {
    return 'first_upcoming';
  }
  return 'future';
}

// Add days to a Jalali date
export function addDaysToJalali(
  jy: number,
  jm: number,
  jd: number,
  daysToAdd: number
): { jy: number; jm: number; jd: number } {
  const g = jalaliToGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd + daysToAdd);
  return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Find the next date that matches a given weekday name (e.g. 'دوشنبه') on or after a start date
export function getNextDateForWeekday(
  fromJy: number,
  fromJm: number,
  fromJd: number,
  targetWeekday: string
): { jy: number; jm: number; jd: number } {
  const targetIdx = PERSIAN_WEEKDAYS.indexOf(targetWeekday);
  if (targetIdx === -1) return { jy: fromJy, jm: fromJm, jd: fromJd };

  let current = { jy: fromJy, jm: fromJm, jd: fromJd };
  for (let offset = 0; offset < 7; offset++) {
    const candidate = addDaysToJalali(fromJy, fromJm, fromJd, offset);
    const wIdx = getJalaliDateWeekday(candidate.jy, candidate.jm, candidate.jd);
    if (wIdx === targetIdx) {
      return candidate;
    }
  }
  return current;
}

// Generate sequential dates for a weekly pattern of weekdays starting from today or a given date
export function generateWeeklyPatternDates(
  count: number,
  weekdays: string[],
  startFromToday: boolean = true
): Array<{ date: string; dayOfWeek: string }> {
  const today = getTodayJalali();
  const result: Array<{ date: string; dayOfWeek: string }> = [];

  if (weekdays.length === 0) return result;

  let pointer = { jy: today.jy, jm: today.jm, jd: today.jd };
  let dayInCycle = 0;

  for (let i = 0; i < count; i++) {
    const targetWeekday = weekdays[dayInCycle % weekdays.length];
    const nextDate = getNextDateForWeekday(pointer.jy, pointer.jm, pointer.jd, targetWeekday);
    result.push({
      date: formatJalaliDate(nextDate.jy, nextDate.jm, nextDate.jd),
      dayOfWeek: targetWeekday,
    });

    // Advance pointer by at least 1 day for next session
    pointer = addDaysToJalali(nextDate.jy, nextDate.jm, nextDate.jd, 1);
    dayInCycle++;
  }

  return result;
}

// Format fee number with commas (3-digit grouping) and "تومان"
export function formatAmountWithCommas(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null || raw === '') return '';
  const eng = toEnglishDigits(String(raw)).replace(/[^\d]/g, '');
  if (!eng) return '';
  const num = parseInt(eng, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

export function formatFeeToToman(raw: string | number | undefined | null): string {
  const formatted = formatAmountWithCommas(raw);
  if (!formatted) return '';
  return `${toPersianDigits(formatted)} تومان`;
}

// Calculate session statistics for a student
export interface StudentSessionStats {
  total: number;
  remaining: number;
  past: number;
  today: number;
  firstUpcomingIndex: number;
}

export function calculateStudentSessionStats(student: {
  totalSessions: number;
  sessionsList?: Array<{ date?: string; isCompleted?: boolean }>;
}): StudentSessionStats {
  const total = student.totalSessions || student.sessionsList?.length || 0;
  const list = student.sessionsList || [];

  let pastCount = 0;
  let todayCount = 0;
  let futureCount = 0;

  list.forEach((item) => {
    const status = compareSessionDateWithToday(item.date);
    if (status === 'past' || item.isCompleted) {
      pastCount++;
    } else if (status === 'today') {
      todayCount++;
    } else {
      futureCount++;
    }
  });

  const firstUpcomingIndex = getFirstUpcomingSessionIndex(list);

  // If there are more total sessions planned than defined in list, the extra are pending (remaining)
  const listCount = list.length;
  const extraSessions = Math.max(0, total - listCount);

  const remaining = todayCount + futureCount + extraSessions;

  return {
    total,
    remaining,
    past: pastCount,
    today: todayCount,
    firstUpcomingIndex,
  };
}
