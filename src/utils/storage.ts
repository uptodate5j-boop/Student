import { Student, TeacherSettings, SessionItem } from '../types';
import { DEFAULT_FIELD_LABELS, DEFAULT_THEME, DEFAULT_STUDENT_VIEW_TEXTS } from './theme';

const STORAGE_KEY = 'my_class_data';
const SETTINGS_KEY = 'my_class_settings';

export const DEFAULT_SETTINGS: TeacherSettings = {
  teacherName: 'استاد بهروز',
  instituteName: 'کلاس‌های کلیستنیکس / پارکور / ژیمناستیک / رزمی',
  phone: '',
  fieldLabels: DEFAULT_FIELD_LABELS,
  customFields: [],
  theme: DEFAULT_THEME,
  studentViewTexts: DEFAULT_STUDENT_VIEW_TEXTS,
};

export const INITIAL_SAMPLE_STUDENTS: Student[] = [
  {
    id: 'sample-1',
    name: 'علی محمدی',
    phone: '09123456789',
    month: 'مهر',
    totalSessions: 8,
    subject: 'کلیستنیکس و پارکور',
    fee: '۲,۵۰۰,۰۰۰ تومان',
    paymentStatus: 'تسویه',
    notes: 'کفش ورزشی و لباس مناسب همراه باشد.',
    customValues: {
      custom_level: 'متوسط',
    },
    sessionsText:
      'شنبه ۱ مهر - ساعت ۱۶:۰۰\nدوشنبه ۳ مهر - ساعت ۱۶:۰۰\nشنبه ۸ مهر - ساعت ۱۶:۰۰\nدوشنبه ۱۰ مهر - ساعت ۱۶:۰۰\nشنبه ۱۵ مهر - ساعت ۱۶:۰۰\nدوشنبه ۱۷ مهر - ساعت ۱۶:۰۰\nشنبه ۲۲ مهر - ساعت ۱۶:۰۰\nدوشنبه ۲۴ مهر - ساعت ۱۶:۰۰',
    sessionsList: [
      { id: 's1', sessionNumber: 1, dayOfWeek: 'شنبه', date: '۱۴۰۳/۰۷/۰۱', time: '۱۶:۰۰', topic: 'حرکات پایه و بارفیکس' },
      { id: 's2', sessionNumber: 2, dayOfWeek: 'دوشنبه', date: '۱۴۰۳/۰۷/۰۳', time: '۱۶:۰۰', topic: 'تعادل روی دست و ماسل‌آپ' },
      { id: 's3', sessionNumber: 3, dayOfWeek: 'شنبه', date: '۱۴۰۳/۰۷/۰۸', time: '۱۶:۰۰', topic: 'رول و پرش‌های پارکور' },
      { id: 's4', sessionNumber: 4, dayOfWeek: 'دوشنبه', date: '۱۴۰۳/۰۷/۱۰', time: '۱۶:۰۰', topic: 'انعطاف و حرکات ژیمناستیک' },
      { id: 's5', sessionNumber: 5, dayOfWeek: 'شنبه', date: '۱۴۰۳/۰۷/۱۵', time: '۱۶:۰۰', topic: 'تمرینات استقامت و سرعتی' },
      { id: 's6', sessionNumber: 6, dayOfWeek: 'دوشنبه', date: '۱۴۰۳/۰۷/۱۷', time: '۱۶:۰۰', topic: 'ترکیب تکنیک‌های رزمی و ضربات' },
      { id: 's7', sessionNumber: 7, dayOfWeek: 'شنبه', date: '۱۴۰۳/۰۷/۲۲', time: '۱۶:۰۰', topic: 'فرود ایمن و والت‌های سرعتی' },
      { id: 's8', sessionNumber: 8, dayOfWeek: 'دوشنبه', date: '۱۴۰۳/۰۷/۲۴', time: '۱۶:۰۰', topic: 'آزمون آمادگی جسمانی ماهانه' },
    ],
    createdAt: Date.now() - 86400000 * 2,
  },
];

export function parseSessionsText(text: string): SessionItem[] {
  if (!text || !text.trim()) return [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    // Try to extract day, date, time
    // Example: "شنبه ۱ مهر - ساعت ۱۶:۰۰" or "یکشنبه 1403/07/02 ساعت 15:30"
    let dayOfWeek = '';
    let time = '';
    let date = '';
    let topic = '';

    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    for (const d of days) {
      if (line.includes(d)) {
        dayOfWeek = d;
        break;
      }
    }

    // Check for time (e.g. 16:00 or ساعت ۱۶:۰۰)
    const timeMatch = line.match(/(?:ساعت\s*)?(\d{1,2}:\d{2})/);
    if (timeMatch) {
      time = timeMatch[1];
    }

    // Check for date
    const dateMatch = line.match(/(\d{4}\/\d{1,2}\/\d{1,2}|\d{1,2}\s+[^\s\-:]+)/);
    if (dateMatch) {
      date = dateMatch[1];
    }

    return {
      id: `session-${idx + 1}-${Date.now()}`,
      sessionNumber: idx + 1,
      dayOfWeek: dayOfWeek || `جلسه ${idx + 1}`,
      date: date || '',
      time: time || '',
      topic: topic || line,
      isCompleted: false,
    };
  });
}

// Student data is strictly stored in Firestore and NOT in localStorage
export function loadStudents(): Student[] {
  return [];
}

export function saveStudents(_students: Student[]): void {
  // Intentionally no-op: Student data is stored in Firebase Firestore, not localStorage.
}

export function loadSettings(): TeacherSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      fieldLabels: { ...DEFAULT_FIELD_LABELS, ...(parsed.fieldLabels || {}) },
      customFields: Array.isArray(parsed.customFields) ? parsed.customFields : [],
      theme: { ...DEFAULT_THEME, ...(parsed.theme || {}) },
      studentViewTexts: { ...DEFAULT_STUDENT_VIEW_TEXTS, ...(parsed.studentViewTexts || {}) },
      customPaymentStatuses: Array.isArray(parsed.customPaymentStatuses) ? parsed.customPaymentStatuses : undefined,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TeacherSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Encode student data safely into a URL-friendly string
export function encodeStudentForUrl(student: Student, teacherSettings?: TeacherSettings): string {
  try {
    const payload = {
      n: student.name,
      p: student.phone,
      m: student.month,
      ts: student.totalSessions,
      s: student.subject,
      f: student.fee,
      ps: student.paymentStatus,
      nt: student.notes,
      cv: student.customValues || {},
      l: student.sessionsList.map((item) => ({
        n: item.sessionNumber,
        w: item.dayOfWeek,
        d: item.date,
        t: item.time,
        tp: item.topic,
      })),
      tn: teacherSettings?.teacherName,
      in: teacherSettings?.instituteName,
      tpn: teacherSettings?.phone,
      stx: teacherSettings?.studentViewTexts,
      lbl: teacherSettings?.fieldLabels,
      cf: teacherSettings?.customFields,
      th: teacherSettings?.theme,
      genAt: Date.now(),
    };
    const json = JSON.stringify(payload);
    // Safe UTF-8 Base64 encoding
    return btoa(encodeURIComponent(json));
  } catch (err) {
    console.error('Encoding error:', err);
    return '';
  }
}

// Decode student data from URL parameter
export interface DecodedStudentPayload {
  student: Student;
  teacherSettings: TeacherSettings;
  generatedAt?: number;
}

export function decodeStudentFromUrl(rawStr: string): DecodedStudentPayload | null {
  if (!rawStr) return null;
  try {
    // Try safe utf-8 base64 first
    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(atob(rawStr));
    } catch {
      // Fallback to legacy unescape(atob(...))
      jsonStr = decodeURIComponent(escape(atob(rawStr)));
    }
    const parsed = JSON.parse(jsonStr);

    // Support both compact payload format and standard format
    if (parsed.n !== undefined) {
      const sessionsList: SessionItem[] = Array.isArray(parsed.l)
        ? parsed.l.map((it: { n?: number; w?: string; d?: string; t?: string; tp?: string }, idx: number) => ({
            id: `item-${idx + 1}`,
            sessionNumber: it.n || idx + 1,
            dayOfWeek: it.w || '',
            date: it.d || '',
            time: it.t || '',
            topic: it.tp || '',
          }))
        : [];

      return {
        student: {
          id: 'shared-student',
          name: parsed.n || '',
          phone: parsed.p || '',
          month: parsed.m || '',
          totalSessions: parsed.ts || sessionsList.length || 0,
          subject: parsed.s || '',
          fee: parsed.f || '',
          paymentStatus: parsed.ps || 'در انتظار پرداخت',
          notes: parsed.nt || '',
          customValues: parsed.cv || {},
          sessionsText: sessionsList.map((s) => `${s.dayOfWeek} ${s.date} ${s.time}`.trim()).join('\n'),
          sessionsList,
          createdAt: parsed.genAt || Date.now(),
        },
        teacherSettings: {
          teacherName: parsed.tn || DEFAULT_SETTINGS.teacherName,
          instituteName: parsed.in || DEFAULT_SETTINGS.instituteName,
          phone: parsed.tpn || '',
          fieldLabels: parsed.lbl ? { ...DEFAULT_FIELD_LABELS, ...parsed.lbl } : DEFAULT_FIELD_LABELS,
          studentViewTexts: parsed.stx ? { ...DEFAULT_STUDENT_VIEW_TEXTS, ...parsed.stx } : DEFAULT_STUDENT_VIEW_TEXTS,
          customFields: parsed.cf || [],
          theme: parsed.th || DEFAULT_THEME,
        },
        generatedAt: parsed.genAt,
      };
    } else if (parsed.name) {
      // Full object legacy format
      const sessionsList: SessionItem[] =
        Array.isArray(parsed.sessionsList) && parsed.sessionsList.length > 0
          ? parsed.sessionsList
          : parseSessionsText(parsed.sessionsText || parsed.sessions || '');

      return {
        student: {
          id: parsed.id || 'shared-student',
          name: parsed.name,
          phone: parsed.phone || '',
          month: parsed.month || '',
          totalSessions: parsed.totalSessions || sessionsList.length || 0,
          subject: parsed.subject || '',
          fee: parsed.fee || '',
          paymentStatus: parsed.paymentStatus || 'در انتظار پرداخت',
          notes: parsed.notes || '',
          customValues: parsed.customValues || {},
          sessionsText: parsed.sessionsText || '',
          sessionsList,
          createdAt: parsed.createdAt || Date.now(),
        },
        teacherSettings: DEFAULT_SETTINGS,
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to decode student data from URL:', e);
    return null;
  }
}

// NOTE: Student data is strictly stored in Firestore and NOT in localStorage as per requirement.
export function generateShareUrl(student: Student, _teacherSettings?: TeacherSettings): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?studentId=${encodeURIComponent(student.id)}`;
}

// Format message for WhatsApp or SMS
export function formatStudentMessage(
  student: Student,
  teacherSettings?: TeacherSettings,
  includeLink: boolean = true
): string {
  const teacherName = teacherSettings?.teacherName ? `استاد: ${teacherSettings.teacherName}\n` : '';
  const institute = teacherSettings?.instituteName ? `${teacherSettings.instituteName}\n` : '';
  const labels = teacherSettings?.fieldLabels || DEFAULT_FIELD_LABELS;

  let message = `سلام ${student.name} عزیز،\n`;
  message += `برنامه شما برای ${labels.month || 'ماه/دوره'} «${student.month}» به شرح زیر است:\n\n`;
  if (teacherName || institute) {
    message += `${teacherName}${institute}\n`;
  }
  if (student.subject) {
    message += `📚 ${labels.subject || 'رشته/درس'}: ${student.subject}\n`;
  }
  if (student.paymentStatus) {
    message += `💳 ${labels.paymentStatus || 'وضعیت پرداخت'}: ${student.paymentStatus}\n`;
  }
  if (student.fee) {
    message += `💰 ${labels.fee || 'شهریه'}: ${student.fee}\n`;
  }
  message += `🔢 ${labels.totalSessions || 'تعداد جلسات'}: ${student.totalSessions} جلسه\n`;

  // Append custom fields
  if (teacherSettings?.customFields && student.customValues) {
    teacherSettings.customFields.forEach((cf) => {
      if (cf.showInMessage !== false) {
        const val = student.customValues?.[cf.id];
        if (val !== undefined && val !== null && val !== '') {
          const displayVal = typeof val === 'boolean' ? (val ? 'بله' : 'خیر') : String(val);
          message += `📌 ${cf.label}: ${displayVal}\n`;
        }
      }
    });
  }

  message += `\n📅 ${labels.sessions || 'روزها و ساعات جلسات'}:\n`;

  if (student.sessionsList && student.sessionsList.length > 0) {
    student.sessionsList.forEach((s) => {
      let line = `• جلسه ${s.sessionNumber}: ${s.dayOfWeek}`;
      if (s.date) line += ` (${s.date})`;
      if (s.time) line += ` - ساعت ${s.time}`;
      if (s.topic) line += ` [${s.topic}]`;
      message += `${line}\n`;
    });
  } else if (student.sessionsText) {
    message += `${student.sessionsText}\n`;
  }

  if (student.notes) {
    message += `\n📝 ${labels.notes || 'یادداشت'}: ${student.notes}\n`;
  }

  if (includeLink) {
    const link = generateShareUrl(student, teacherSettings);
    message += `\n🔗 مشاهده کارت آنلاین و برنامه کامل:\n${link}\n`;
  }

  message += `\nبا آرزوی موفقیت و تندرستی ✨`;

  return message;
}
