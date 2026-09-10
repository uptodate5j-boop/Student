import { ThemeColor, AppThemeConfig, FieldLabelsConfig, CustomFieldDefinition, StudentViewCustomTexts } from '../types';

export const DEFAULT_STUDENT_VIEW_TEXTS: StudentViewCustomTexts = {
  badgeText: 'کارت اختصاصی شاگرد',
  academyName: 'سامانه مدیریت کلاس‌ها و برنامه تمرینات',
  coachTitle: 'مدرس / مربی',
  dateIssuedLabel: 'تاریخ صدور کارت:',
  todayAlertTitle: '🎯 امروز جلسه تمرین دارید!',
  todayAlertDesc: 'طبق برنامه امروز جلسه تمرینی دارید. لطفاً به موقع با وسایل و پوشش ورزشی حاضر شوید.',
  statTotalLabel: 'کل جلسات',
  statTotalSub: 'جلسه دوره',
  statRemainingLabel: 'جلسات باقی‌مانده',
  statRemainingSub: 'جلسه مانده',
  statPastLabel: 'برگزار شده',
  statPastSub: 'جلسه گذشته',
  sessionsHeaderTitle: 'برنامه زمان‌بندی روزها و ساعت‌ها',
  sessionsHeaderDesc: 'رنگ هر جلسه وضعیت برگزاری آن را مشخص می‌کند.',
  todayBadgeText: '🟢 جلسه امروز',
  pastBadgeText: '🔴 برگزار شده',
  futureBadgeText: '🟡 جلسه آینده',
  notesTitle: 'توضیحات و نکات مهم:',
  footerRightText: 'کارت رسمی برنامه هفتگی و ماهانه • سامانه هوشمند مدیریت کلاس و تمرینات',
  footerMotivationText: 'با آرزوی درخشش و موفقیت شاگرد گرامی ✨',
  printButtonText: 'چاپ / ذخیره PDF',
  backButtonText: 'بازگشت به پنل مربی',
};

export const DEFAULT_FIELD_LABELS: FieldLabelsConfig = {
  studentName: 'نام هنرجو / شاگرد',
  studentPhone: 'شماره تماس',
  month: 'ماه / دوره',
  totalSessions: 'تعداد جلسات',
  subject: 'رشته ورزشی / درس',
  fee: 'شهریه / هزینه دوره',
  paymentStatus: 'وضعیت پرداخت',
  sessions: 'روزها و ساعت‌های تمرین / کلاس',
  notes: 'یادداشت و توضیحات',
};

export const FIELD_LABEL_PRESETS: {
  id: string;
  name: string;
  icon: string;
  labels: FieldLabelsConfig;
}[] = [
  {
    id: 'sports',
    name: 'باشگاهی و ورزشی (پارکور، کلیستنیکس، رزمی، ژیمناستیک)',
    icon: '🥊',
    labels: {
      studentName: 'نام ورزشکار / هنرجو',
      studentPhone: 'شماره تماس ورزشکار',
      month: 'دوره / ماه تمرین',
      totalSessions: 'تعداد جلسات تمرین',
      subject: 'رشته ورزشی (کلیستنیکس/پارکور/رزمی)',
      fee: 'شهریه ماهانه باشگاه',
      paymentStatus: 'وضعیت پرداخت شهریه',
      sessions: 'روزها و ساعت‌های سانس تمرین',
      notes: 'نکات مربی و وضعیت سلامت/بیمه',
    },
  },
  {
    id: 'academic',
    name: 'آموزشی، درسی و کنکور',
    icon: '📚',
    labels: {
      studentName: 'نام و نام‌خانوادگی شاگرد',
      studentPhone: 'شماره تماس / واتساپ',
      month: 'ماه دوره آموزشی',
      totalSessions: 'تعداد جلسات در ماه',
      subject: 'عنوان درس / مبحث تدریس',
      fee: 'شهریه کلاس خصوصی',
      paymentStatus: 'وضعیت تسویه شهریه',
      sessions: 'زمان‌بندی روزها و ساعت‌های کلاس',
      notes: 'تکالیف و کتاب‌های کمک‌آموزشی',
    },
  },
  {
    id: 'arts_music',
    name: 'موسیقی، هنر و مهارت‌آموزی',
    icon: '🎨',
    labels: {
      studentName: 'نام هنرجو',
      studentPhone: 'تلفن هماهنگی',
      month: 'ترم / ماه دوره',
      totalSessions: 'تعداد جلسات کارگاه',
      subject: 'ساز یا شاخه هنری',
      fee: 'شهریه کارگاه / ترم',
      paymentStatus: 'وضعیت شهریه ترم',
      sessions: 'ساعت و روز حضور در آموزشگاه',
      notes: 'تجهیزات و تمرینات هفتگی',
    },
  },
];

export const PRESET_CUSTOM_FIELDS: Omit<CustomFieldDefinition, 'id'>[] = [
  {
    label: 'سطح ورزشی / مهارت',
    type: 'select',
    options: ['مقدماتی', 'متوسط', 'پیشرفته', 'حرفه‌ای'],
    showInTable: true,
    showInMessage: true,
    showInPrint: true,
  },
  {
    label: 'رده سنی / وزن',
    type: 'text',
    placeholder: 'مثال: بزرگسالان / ۶۸ کیلوگرم',
    showInTable: true,
    showInMessage: true,
    showInPrint: true,
  },
  {
    label: 'سالن / شعبه تمرین',
    type: 'select',
    options: ['سالن شماره ۱', 'سالن شماره ۲', 'آکادمی مرکزی', 'خصوصی'],
    showInTable: true,
    showInMessage: true,
    showInPrint: true,
  },
  {
    label: 'وضعیت بیمه ورزشی',
    type: 'select',
    options: ['دارد (معتبر)', 'ندارد (اقدام شود)', 'در دست اقدام'],
    showInTable: true,
    showInMessage: true,
    showInPrint: true,
  },
];

export const DEFAULT_THEME: AppThemeConfig = {
  color: 'crimson', // athletic crimson by default since coach teaches parkour/calisthenics/martial arts
  isDark: false,
  appTitle: 'سامانه مدیریت کلاس‌ها و برنامه تمرینات',
  appSubtitle: 'ثبت روزها و ساعت‌ها، ارسال به واتساپ، کارت آنلاین و پیگیری شهریه',
};

export interface ThemeColorsPalette {
  id: ThemeColor;
  name: string;
  emoji: string;
  primary: string;
  primaryHover: string;
  buttonBg: string;
  buttonHover: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  gradientFrom: string;
  gradientTo: string;
  ring: string;
  borderAccent: string;
  subtleBg: string;
}

export const THEME_PALETTES: Record<ThemeColor, ThemeColorsPalette> = {
  crimson: {
    id: 'crimson',
    name: 'قرمز و زرشکی ورزشی (آتلتیک / رزمی)',
    emoji: '🥊',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    buttonBg: 'bg-rose-600',
    buttonHover: 'hover:bg-rose-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-red-800',
    ring: 'focus:ring-rose-500/20 focus:border-rose-600',
    borderAccent: 'border-rose-500',
    subtleBg: 'bg-rose-500/10',
  },
  blue: {
    id: 'blue',
    name: 'آبی کلاسیک و نیلی (حرفه‌ای)',
    emoji: '⚡',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-700',
    ring: 'focus:ring-blue-500/20 focus:border-blue-600',
    borderAccent: 'border-blue-500',
    subtleBg: 'bg-blue-500/10',
  },
  amber: {
    id: 'amber',
    name: 'طلایی و کهربایی پرانرژی (انرژیک)',
    emoji: '🥋',
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    buttonBg: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-700',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-orange-700',
    ring: 'focus:ring-amber-500/20 focus:border-amber-600',
    borderAccent: 'border-amber-500',
    subtleBg: 'bg-amber-500/10',
  },
  emerald: {
    id: 'emerald',
    name: 'سبز زمردی المپیک (طبیعت و سلامت)',
    emoji: '🌲',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    buttonBg: 'bg-emerald-600',
    buttonHover: 'hover:bg-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-800',
    ring: 'focus:ring-emerald-500/20 focus:border-emerald-600',
    borderAccent: 'border-emerald-500',
    subtleBg: 'bg-emerald-500/10',
  },
  purple: {
    id: 'purple',
    name: 'بنفش نیترو و رویال (مدرن)',
    emoji: '🔮',
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    buttonBg: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-indigo-800',
    ring: 'focus:ring-purple-500/20 focus:border-purple-600',
    borderAccent: 'border-purple-500',
    subtleBg: 'bg-purple-500/10',
  },
  slate: {
    id: 'slate',
    name: 'زغالی و کربنی تیره (مینیمال)',
    emoji: '🖤',
    primary: 'bg-slate-800',
    primaryHover: 'hover:bg-slate-900',
    buttonBg: 'bg-slate-800',
    buttonHover: 'hover:bg-slate-900',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    gradientFrom: 'from-slate-800',
    gradientTo: 'to-zinc-950',
    ring: 'focus:ring-slate-500/20 focus:border-slate-700',
    borderAccent: 'border-slate-600',
    subtleBg: 'bg-slate-500/10',
  },
};
