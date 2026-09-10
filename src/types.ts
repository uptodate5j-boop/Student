export interface SessionItem {
  id: string;
  sessionNumber: number;
  dayOfWeek: string;
  date: string;
  time: string;
  topic?: string;
  isCompleted?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  placeholder?: string;
  showInTable?: boolean;
  showInMessage?: boolean;
  showInPrint?: boolean;
}

export interface FieldLabelsConfig {
  studentName: string;
  studentPhone: string;
  month: string;
  totalSessions: string;
  subject: string;
  fee: string;
  paymentStatus: string;
  sessions: string;
  notes: string;
}

export type ThemeColor = 'blue' | 'crimson' | 'emerald' | 'amber' | 'purple' | 'slate';

export interface AppThemeConfig {
  color: ThemeColor;
  isDark: boolean;
  appTitle: string;
  appSubtitle: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  month: string;
  totalSessions: number;
  sessionsText: string;
  sessionsList: SessionItem[];
  subject?: string;
  fee?: string;
  paymentStatus?: string;
  notes?: string;
  customValues?: Record<string, string | boolean | number>;
  createdAt: number;
  updatedAt?: number;
}

export const PAYMENT_STATUS_OPTIONS = [
  'پرداخت شده',
  'بدهکار',
  'تسویه',
  'در انتظار پرداخت',
  'پیش‌پرداخت',
] as const;

export interface StudentViewCustomTexts {
  badgeText?: string;
  academyName?: string;
  coachTitle?: string;
  dateIssuedLabel?: string;
  todayAlertTitle?: string;
  todayAlertDesc?: string;
  statTotalLabel?: string;
  statTotalSub?: string;
  statRemainingLabel?: string;
  statRemainingSub?: string;
  statPastLabel?: string;
  statPastSub?: string;
  sessionsHeaderTitle?: string;
  sessionsHeaderDesc?: string;
  todayBadgeText?: string;
  pastBadgeText?: string;
  futureBadgeText?: string;
  notesTitle?: string;
  footerRightText?: string;
  footerMotivationText?: string;
  printButtonText?: string;
  backButtonText?: string;
}

export interface TeacherSettings {
  teacherName: string;
  instituteName: string;
  phone: string;
  fieldLabels?: Partial<FieldLabelsConfig>;
  customFields?: CustomFieldDefinition[];
  theme?: Partial<AppThemeConfig>;
  studentViewTexts?: Partial<StudentViewCustomTexts>;
  customPaymentStatuses?: string[];
  updatedAt?: number;
}

export type ActiveTab = 'list' | 'add' | 'edit' | 'backend';

