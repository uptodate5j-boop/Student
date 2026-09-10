import React, { useState } from 'react';
import {
  Settings,
  Type,
  FileText,
  Palette,
  CreditCard,
  PlusCircle,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Database,
  Cloud,
  Eye,
  Sliders,
  Sun,
  Moon,
  Save,
  Copy,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Smartphone,
  Printer,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import {
  TeacherSettings,
  StudentViewCustomTexts,
  FieldLabelsConfig,
  CustomFieldDefinition,
  Student,
  ThemeColor,
  PAYMENT_STATUS_OPTIONS,
} from '../types';
import {
  DEFAULT_FIELD_LABELS,
  DEFAULT_STUDENT_VIEW_TEXTS,
  FIELD_LABEL_PRESETS,
  THEME_PALETTES,
  DEFAULT_THEME,
} from '../utils/theme';
import { toPersianDigits, getTodayPersianFormatted } from '../utils/persianDate';
import { firebaseSync } from '../services/firebaseSync';

interface Props {
  settings: TeacherSettings;
  students: Student[];
  onSaveSettings: (newSettings: TeacherSettings) => void;
  onUpdateStudentsList?: (newStudents: Student[]) => void;
  onPreviewSampleStudent?: () => void;
}

type SubTab = 'student_texts' | 'field_labels' | 'payment_statuses' | 'custom_fields' | 'theme' | 'raw_db';

export const BackendControlPanel: React.FC<Props> = ({
  settings,
  students,
  onSaveSettings,
  onUpdateStudentsList,
  onPreviewSampleStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('student_texts');

  // 1. Student View Texts State
  const [studentTexts, setStudentTexts] = useState<StudentViewCustomTexts>({
    ...DEFAULT_STUDENT_VIEW_TEXTS,
    ...(settings.studentViewTexts || {}),
  });

  // 2. Field Labels State
  const [fieldLabels, setFieldLabels] = useState<FieldLabelsConfig>({
    ...DEFAULT_FIELD_LABELS,
    ...(settings.fieldLabels || {}),
  });

  // 3. Custom Payment Statuses
  const [paymentStatuses, setPaymentStatuses] = useState<string[]>(
    settings.customPaymentStatuses && settings.customPaymentStatuses.length > 0
      ? settings.customPaymentStatuses
      : [...PAYMENT_STATUS_OPTIONS]
  );
  const [newStatusInput, setNewStatusInput] = useState('');

  // 4. Custom Fields
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(
    settings.customFields ? [...settings.customFields] : []
  );
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldShowTable, setNewFieldShowTable] = useState(true);
  const [newFieldShowMessage, setNewFieldShowMessage] = useState(true);
  const [newFieldShowPrint, setNewFieldShowPrint] = useState(true);

  // 5. Theme & Branding
  const currentTheme = settings.theme || DEFAULT_THEME;
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(currentTheme.color || 'crimson');
  const [isDark, setIsDark] = useState<boolean>(!!currentTheme.isDark);
  const [appTitle, setAppTitle] = useState(currentTheme.appTitle || 'سامانه مدیریت کلاس‌ها و برنامه تمرینات');
  const [appSubtitle, setAppSubtitle] = useState(
    currentTheme.appSubtitle || 'ثبت روزها و ساعت‌ها، ارسال به واتساپ، کارت آنلاین و پیگیری شهریه'
  );
  const [teacherName, setTeacherName] = useState(settings.teacherName || 'استاد محترم');
  const [instituteName, setInstituteName] = useState(settings.instituteName || 'کلاس‌های آموزشی و خصوصی');
  const [phone, setPhone] = useState(settings.phone || '');

  // 6. Raw Database JSON editing
  const [rawSettingsJson, setRawSettingsJson] = useState<string>(
    JSON.stringify(settings, null, 2)
  );
  const [rawStudentsJson, setRawStudentsJson] = useState<string>(
    JSON.stringify(students, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  // Feedback State
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  const handleTextChange = (key: keyof StudentViewCustomTexts, value: string) => {
    setStudentTexts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetStudentTexts = () => {
    if (window.confirm('آیا از بازنشانی تمامی متن‌های کارت شاگرد به حالت پیش‌فرض مطمئن هستید؟')) {
      setStudentTexts({ ...DEFAULT_STUDENT_VIEW_TEXTS });
    }
  };

  const handleResetFieldLabels = () => {
    if (window.confirm('آیا از بازنشانی برچسب‌های فیلدها به حالت پیش‌فرض مطمئن هستید؟')) {
      setFieldLabels({ ...DEFAULT_FIELD_LABELS });
    }
  };

  const handleApplyPreset = (preset: FieldLabelsConfig) => {
    setFieldLabels({ ...preset });
  };

  // Add custom status
  const handleAddPaymentStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStatusInput.trim();
    if (!trimmed) return;
    if (paymentStatuses.includes(trimmed)) {
      alert('این وضعیت قبلاً در لیست وجود دارد.');
      return;
    }
    setPaymentStatuses((prev) => [...prev, trimmed]);
    setNewStatusInput('');
  };

  const handleRemovePaymentStatus = (status: string) => {
    if (paymentStatuses.length <= 1) {
      alert('حداقل یک وضعیت پرداخت باید وجود داشته باشد.');
      return;
    }
    setPaymentStatuses((prev) => prev.filter((s) => s !== status));
  };

  // Add custom field
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newField: CustomFieldDefinition = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      options:
        newFieldType === 'select'
          ? newFieldOptions
              .split('\n')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
      placeholder: newFieldPlaceholder.trim() || undefined,
      showInTable: newFieldShowTable,
      showInMessage: newFieldShowMessage,
      showInPrint: newFieldShowPrint,
    };

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setIsAddingField(false);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Save all backend configurations
  const handleSaveAll = () => {
    const updatedSettings: TeacherSettings = {
      ...settings,
      teacherName: teacherName.trim(),
      instituteName: instituteName.trim(),
      phone: phone.trim(),
      fieldLabels,
      studentViewTexts: studentTexts,
      customPaymentStatuses: paymentStatuses,
      customFields,
      theme: {
        color: selectedColor,
        isDark,
        appTitle: appTitle.trim(),
        appSubtitle: appSubtitle.trim(),
      },
      updatedAt: Date.now(),
    };

    onSaveSettings(updatedSettings);
    setRawSettingsJson(JSON.stringify(updatedSettings, null, 2));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  // Apply Raw JSON to settings
  const handleApplyRawSettingsJson = () => {
    setJsonError(null);
    setJsonSuccess(null);
    try {
      const parsed = JSON.parse(rawSettingsJson) as TeacherSettings;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('فرمت JSON معتبر نیست.');
      }
      onSaveSettings(parsed);
      // reload component state
      if (parsed.studentViewTexts) setStudentTexts({ ...DEFAULT_STUDENT_VIEW_TEXTS, ...parsed.studentViewTexts });
      if (parsed.fieldLabels) setFieldLabels({ ...DEFAULT_FIELD_LABELS, ...parsed.fieldLabels });
      if (parsed.customPaymentStatuses) setPaymentStatuses(parsed.customPaymentStatuses);
      if (parsed.customFields) setCustomFields(parsed.customFields);
      if (parsed.teacherName) setTeacherName(parsed.teacherName);
      if (parsed.instituteName) setInstituteName(parsed.instituteName);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.theme) {
        setSelectedColor(parsed.theme.color || 'crimson');
        setIsDark(!!parsed.theme.isDark);
        if (parsed.theme.appTitle) setAppTitle(parsed.theme.appTitle);
        if (parsed.theme.appSubtitle) setAppSubtitle(parsed.theme.appSubtitle);
      }
      setJsonSuccess('تنظیمات JSON با موفقیت اعتبارسنجی و در سیستم ذخیره شد.');
    } catch (err: any) {
      setJsonError(err?.message || 'خطا در پارس JSON تنظیمات.');
    }
  };

  // Apply Raw JSON to students
  const handleApplyRawStudentsJson = () => {
    setJsonError(null);
    setJsonSuccess(null);
    try {
      const parsed = JSON.parse(rawStudentsJson);
      if (!Array.isArray(parsed)) {
        throw new Error('داده‌های شاگردان باید به صورت یک آرایه [] باشد.');
      }
      if (onUpdateStudentsList) {
        onUpdateStudentsList(parsed);
      }
      setJsonSuccess(`تعداد ${toPersianDigits(parsed.length)} شاگرد با موفقیت از JSON ذخیره و بارگذاری شد.`);
    } catch (err: any) {
      setJsonError(err?.message || 'خطا در ساختار JSON شاگردان.');
    }
  };

  // Force Cloud Sync
  const handleForceCloudSync = async () => {
    setSyncStatusText('در حال برقراری ارتباط با سرور ابری Firebase Firestore...');
    try {
      await firebaseSync.uploadAllLocalToCloud(students, settings);
      setSyncStatusText('همگام‌سازی فوری با دیتابیس ابری با موفقیت انجام شد! تمامی رکوردها در سرور ثبت شدند.');
    } catch (e: any) {
      setSyncStatusText('خطا در ارتباط ابری: ' + (e?.message || 'نامشخص'));
    }
    setTimeout(() => {
      setSyncStatusText(null);
    }, 6000);
  };

  const palette = THEME_PALETTES[selectedColor] || THEME_PALETTES.crimson;
  const today = getTodayPersianFormatted();

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Code2 className="w-3.5 h-3.5" />
              <span>پنل مدیریت پیشرفته و کنترل بک‌اند</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              تنظیمات جامع، سفارشی‌سازی متن‌ها و لینک شاگرد
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              تمامی متن‌ها و واژه‌های داخل کارت شاگرد، نام فیلدها، وضعیت‌های مالی، پالت رنگی و دیتابیس را به دلخواه خود کاستومایز کنید. تغییرات بلافاصله در لینک‌های اشتراک‌گذاری و خروجی فیش شاگردان اعمال می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onPreviewSampleStudent && (
              <button
                type="button"
                id="btn-backend-preview-sample"
                onClick={onPreviewSampleStudent}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>مشاهده پیش‌نمایش کارت شاگرد</span>
              </button>
            )}

            <button
              type="button"
              id="btn-backend-save-all"
              onClick={handleSaveAll}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : `${palette.buttonBg} ${palette.buttonHover} text-white`
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تغییرات ذخیره شد!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تمامی تغییرات در سیستم</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync status toast inside panel */}
        {syncStatusText && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{syncStatusText}</span>
          </div>
        )}
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold scrollbar-none">
        <button
          type="button"
          id="btn-tab-student-texts"
          onClick={() => setActiveSubTab('student_texts')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'student_texts'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>ویرایش متن‌های کارت شاگرد (خروجی نهایی)</span>
        </button>

        <button
          type="button"
          id="btn-tab-field-labels"
          onClick={() => setActiveSubTab('field_labels')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'field_labels'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>عناوین فیلدهای اصلی سیستم</span>
        </button>

        <button
          type="button"
          id="btn-tab-payment-statuses"
          onClick={() => setActiveSubTab('payment_statuses')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'payment_statuses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>وضعیت‌های مالی و پرداخت</span>
        </button>

        <button
          type="button"
          id="btn-tab-custom-fields"
          onClick={() => setActiveSubTab('custom_fields')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'custom_fields'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>فیلدهای سفارشی دیتابیس</span>
        </button>

        <button
          type="button"
          id="btn-tab-theme"
          onClick={() => setActiveSubTab('theme')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'theme'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>پالت رنگ، تم و اطلاعات مدرس</span>
        </button>

        <button
          type="button"
          id="btn-tab-raw-db"
          onClick={() => setActiveSubTab('raw_db')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'raw_db'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>دیتابیس مستقیم (JSON) و همگام‌سازی ابری</span>
        </button>
      </div>

      {/* SUBTAB 1: Student View Custom Texts */}
      {activeSubTab === 'student_texts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Editable Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>سفارشی‌سازی تمامی متن‌های کارت نمایش شاگرد</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    متن‌های زیر مستقیماً در صفحه اختصاصی شاگرد، لینک آنلاین و پرینت PDF جایگزین می‌شوند.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-reset-student-texts"
                  onClick={handleResetStudentTexts}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-300"
                  title="بازنشانی متن‌ها به حالت پیش‌فرض"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پیش‌فرض</span>
                </button>
              </div>

              {/* Group A: سربرگ کارت و آموزشگاه */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-blue-800 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100 inline-block">
                  ۱. سربرگ اصلی کارت شاگرد
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      نشان بالای سربرگ (Badge)
                    </label>
                    <input
                      type="text"
                      id="input-badgeText"
                      value={studentTexts.badgeText || ''}
                      onChange={(e) => handleTextChange('badgeText', e.target.value)}
                      placeholder="مثال: کارت اختصاصی شاگرد"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان کارت / نام آکادمی یا مرکز
                    </label>
                    <input
                      type="text"
                      id="input-academyName"
                      value={studentTexts.academyName || ''}
                      onChange={(e) => handleTextChange('academyName', e.target.value)}
                      placeholder="مثال: آکادمی تخصصی ژیمناستیک و پارکور"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان مدرس / مربی
                    </label>
                    <input
                      type="text"
                      id="input-coachTitle"
                      value={studentTexts.coachTitle || ''}
                      onChange={(e) => handleTextChange('coachTitle', e.target.value)}
                      placeholder="مثال: مربی یا مدرس یا استاد"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      برچسب تاریخ صدور کارت
                    </label>
                    <input
                      type="text"
                      id="input-dateIssuedLabel"
                      value={studentTexts.dateIssuedLabel || ''}
                      onChange={(e) => handleTextChange('dateIssuedLabel', e.target.value)}
                      placeholder="مثال: تاریخ صدور کارت:"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Group B: پیام هشدار جلسه امروز */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-block">
                  ۲. بنر هوشمند «امروز جلسه دارید» (در روزهای کلاس)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان هشدار امروز
                    </label>
                    <input
                      type="text"
                      id="input-todayAlertTitle"
                      value={studentTexts.todayAlertTitle || ''}
                      onChange={(e) => handleTextChange('todayAlertTitle', e.target.value)}
                      placeholder="مثال: 🎯 امروز جلسه تمرین دارید!"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      متن پیام هشدار امروز
                    </label>
                    <input
                      type="text"
                      id="input-todayAlertDesc"
                      value={studentTexts.todayAlertDesc || ''}
                      onChange={(e) => handleTextChange('todayAlertDesc', e.target.value)}
                      placeholder="مثال: لطفاً به موقع با وسایل و پوشش حاضر شوید."
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Group C: باکس‌های آمار دوره شاگرد */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-block">
                  ۳. باکس‌های سه گانه آمار جلسات
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">باکس اول: کل جلسات</span>
                    <input
                      type="text"
                      value={studentTexts.statTotalLabel || ''}
                      onChange={(e) => handleTextChange('statTotalLabel', e.target.value)}
                      placeholder="عنوان: تعداد جلسات کل"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={studentTexts.statTotalSub || ''}
                      onChange={(e) => handleTextChange('statTotalSub', e.target.value)}
                      placeholder="توضیح زیرین: جلسه دوره"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-[11px] font-bold text-amber-800 block">باکس دوم: باقی‌مانده</span>
                    <input
                      type="text"
                      value={studentTexts.statRemainingLabel || ''}
                      onChange={(e) => handleTextChange('statRemainingLabel', e.target.value)}
                      placeholder="عنوان: جلسات باقی‌مانده"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={studentTexts.statRemainingSub || ''}
                      onChange={(e) => handleTextChange('statRemainingSub', e.target.value)}
                      placeholder="توضیح زیرین: جلسه مانده"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">باکس سوم: برگزار شده</span>
                    <input
                      type="text"
                      value={studentTexts.statPastLabel || ''}
                      onChange={(e) => handleTextChange('statPastLabel', e.target.value)}
                      placeholder="عنوان: برگزار شده"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={studentTexts.statPastSub || ''}
                      onChange={(e) => handleTextChange('statPastSub', e.target.value)}
                      placeholder="توضیح زیرین: جلسه گذشته"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Group D: جدول جلسات و برچسب‌های رنگی */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 inline-block">
                  ۴. جدول جلسات و برچسب وضعیت‌ها
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان سربرگ جلسات
                    </label>
                    <input
                      type="text"
                      id="input-sessionsHeaderTitle"
                      value={studentTexts.sessionsHeaderTitle || ''}
                      onChange={(e) => handleTextChange('sessionsHeaderTitle', e.target.value)}
                      placeholder="مثال: برنامه زمان‌بندی جلسات تمرینی"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      توضیح زیرین سربرگ جلسات
                    </label>
                    <input
                      type="text"
                      id="input-sessionsHeaderDesc"
                      value={studentTexts.sessionsHeaderDesc || ''}
                      onChange={(e) => handleTextChange('sessionsHeaderDesc', e.target.value)}
                      placeholder="مثال: رنگ هر جلسه وضعیت برگزاری آن را مشخص می‌کند."
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      🟢 نشان جلسه امروز
                    </label>
                    <input
                      type="text"
                      value={studentTexts.todayBadgeText || ''}
                      onChange={(e) => handleTextChange('todayBadgeText', e.target.value)}
                      placeholder="🟢 جلسه امروز"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      🔴 نشان جلسه گذشته
                    </label>
                    <input
                      type="text"
                      value={studentTexts.pastBadgeText || ''}
                      onChange={(e) => handleTextChange('pastBadgeText', e.target.value)}
                      placeholder="🔴 برگزار شده"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 mb-1">
                      🟡 نشان جلسه آینده
                    </label>
                    <input
                      type="text"
                      value={studentTexts.futureBadgeText || ''}
                      onChange={(e) => handleTextChange('futureBadgeText', e.target.value)}
                      placeholder="🟡 جلسه آینده"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Group E: یادداشت، فوتر و دکمه‌ها */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
                  ۵. بخش یادداشت‌ها، فوتر و دکمه‌ها
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان بخش توضیحات و یادداشت
                    </label>
                    <input
                      type="text"
                      value={studentTexts.notesTitle || ''}
                      onChange={(e) => handleTextChange('notesTitle', e.target.value)}
                      placeholder="مثال: توضیحات و نکات ضروری مربی:"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      پیام انگیزشی فوتر
                    </label>
                    <input
                      type="text"
                      value={studentTexts.footerMotivationText || ''}
                      onChange={(e) => handleTextChange('footerMotivationText', e.target.value)}
                      placeholder="مثال: با آرزوی درخشش و موفقیت شاگرد گرامی ✨"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      متن پایین فوتر (سمت راست)
                    </label>
                    <input
                      type="text"
                      value={studentTexts.footerRightText || ''}
                      onChange={(e) => handleTextChange('footerRightText', e.target.value)}
                      placeholder="مثال: کارت رسمی برنامه هفتگی و ماهانه • سامانه مدیریت کلاس"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      متن دکمه پرینت / ذخیره
                    </label>
                    <input
                      type="text"
                      value={studentTexts.printButtonText || ''}
                      onChange={(e) => handleTextChange('printButtonText', e.target.value)}
                      placeholder="مثال: چاپ / ذخیره PDF"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom save button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  پس از پایان ویرایش، دکمه ذخیره را بزنید تا در کل برنامه اعمال شود.
                </span>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره متن‌های کارت</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Simulated Preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>پیش‌نمایش زنده کارت شاگرد</span>
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  همگام با تایپ شما
                </span>
              </div>

              {/* Mini Card Preview */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden text-xs">
                {/* Header */}
                <div className={`bg-gradient-to-r ${palette.gradientFrom} ${palette.gradientTo} text-white p-4`}>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] mb-2 font-medium">
                    <span>{studentTexts.badgeText || 'کارت اختصاصی شاگرد'}</span>
                  </div>
                  <h4 className="font-black text-sm text-white">
                    {studentTexts.academyName || instituteName || 'نام آموزشگاه شما'}
                  </h4>
                  <p className="text-[11px] text-white/80 mt-1">
                    {studentTexts.coachTitle || 'مربی'}: <strong className="text-white">{teacherName}</strong>
                  </p>
                  <div className="text-[10px] text-white/70 mt-2">
                    {studentTexts.dateIssuedLabel || 'تاریخ صدور:'} {today.full}
                  </div>
                </div>

                {/* Banner */}
                <div className="p-2.5 bg-emerald-600 text-white flex items-center gap-2 text-[11px]">
                  <span>{studentTexts.todayAlertTitle || '🎯 امروز جلسه تمرین دارید!'}</span>
                </div>

                {/* 3 Stats */}
                <div className="grid grid-cols-3 gap-1.5 p-3 bg-slate-50 border-b border-slate-100 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 block truncate">{studentTexts.statTotalLabel || 'کل'}</span>
                    <strong className="text-xs">۱۲</strong>
                    <span className="text-[8px] text-slate-400 block">{studentTexts.statTotalSub || 'جلسه'}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-xl border border-amber-300">
                    <span className="text-[9px] text-amber-800 font-bold block truncate">{studentTexts.statRemainingLabel || 'باقی‌مانده'}</span>
                    <strong className="text-xs text-amber-900">۸</strong>
                    <span className="text-[8px] text-amber-700 block">{studentTexts.statRemainingSub || 'مانده'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 block truncate">{studentTexts.statPastLabel || 'برگزار شده'}</span>
                    <strong className="text-xs">۴</strong>
                    <span className="text-[8px] text-slate-400 block">{studentTexts.statPastSub || 'گذشته'}</span>
                  </div>
                </div>

                {/* Sessions Header preview */}
                <div className="p-3 border-b border-slate-100">
                  <div className="font-bold text-slate-800 text-[11px]">
                    {studentTexts.sessionsHeaderTitle || 'برنامه زمان‌بندی جلسات'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {studentTexts.sessionsHeaderDesc || 'رنگ هر جلسه وضعیت را مشخص می‌کند.'}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[9px] font-bold">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {studentTexts.todayBadgeText || '🟢 امروز'}
                    </span>
                    <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      {studentTexts.pastBadgeText || '🔴 برگزار شده'}
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {studentTexts.futureBadgeText || '🟡 آینده'}
                    </span>
                  </div>
                </div>

                {/* Footer preview */}
                <div className="p-3 bg-slate-50 text-[9px] text-slate-500 space-y-1">
                  <div>{studentTexts.footerRightText || 'کارت رسمی برنامه هفتگی'}</div>
                  <div className="font-semibold text-slate-700">{studentTexts.footerMotivationText || 'با آرزوی درخشش ✨'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Field Labels & Presets */}
      {activeSubTab === 'field_labels' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>عناوین و برچسب‌های فیلدهای اصلی سیستم</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تغییر عناوین فیلدها در جدول شاگردان، فرم ثبت‌نام و پیام‌های ارسالی.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetFieldLabels}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به پیش‌فرض</span>
            </button>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              انتخاب سریع الگوهای آماده متناسب با صنف و فعالیت شما:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIELD_LABEL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.labels)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-right text-xs transition-all cursor-pointer font-bold text-slate-800"
                >
                  <span className="text-base ml-1">{preset.icon}</span>
                  <span>{preset.name.split('(')[0].trim()}</span>
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5 truncate">
                    {preset.labels.subject}، {preset.labels.sessions}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام شاگرد / ورزشکار</label>
              <input
                type="text"
                value={fieldLabels.studentName}
                onChange={(e) => setFieldLabels({ ...fieldLabels, studentName: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس شاگرد / والد</label>
              <input
                type="text"
                value={fieldLabels.studentPhone}
                onChange={(e) => setFieldLabels({ ...fieldLabels, studentPhone: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام ماه / دوره</label>
              <input
                type="text"
                value={fieldLabels.month}
                onChange={(e) => setFieldLabels({ ...fieldLabels, month: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تعداد جلسات کل</label>
              <input
                type="text"
                value={fieldLabels.totalSessions}
                onChange={(e) => setFieldLabels({ ...fieldLabels, totalSessions: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رشته / ماده / موضوع</label>
              <input
                type="text"
                value={fieldLabels.subject}
                onChange={(e) => setFieldLabels({ ...fieldLabels, subject: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شهریه / مبلغ پرداختی</label>
              <input
                type="text"
                value={fieldLabels.fee}
                onChange={(e) => setFieldLabels({ ...fieldLabels, fee: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وضعیت پرداخت / حساب</label>
              <input
                type="text"
                value={fieldLabels.paymentStatus}
                onChange={(e) => setFieldLabels({ ...fieldLabels, paymentStatus: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان جلسات</label>
              <input
                type="text"
                value={fieldLabels.sessions}
                onChange={(e) => setFieldLabels({ ...fieldLabels, sessions: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و نکات</label>
              <input
                type="text"
                value={fieldLabels.notes}
                onChange={(e) => setFieldLabels({ ...fieldLabels, notes: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره عناوین فیلدها</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Payment Statuses Manager */}
      {activeSubTab === 'payment_statuses' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>مدیریت وضعیت‌های مالی و تسویه شهریه</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              وضعیت‌های مالی دلخواه خود را بسازید یا ویرایش کنید تا در فرم شاگرد و جدول نمایش داده شوند.
            </p>
          </div>

          {/* Add status form */}
          <form onSubmit={handleAddPaymentStatus} className="flex gap-2 max-w-md">
            <input
              type="text"
              id="input-new-payment-status"
              value={newStatusInput}
              onChange={(e) => setNewStatusInput(e.target.value)}
              placeholder="مثال: قسط دوم، بورسیه، رایگان، بیعانه..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن وضعیت</span>
            </button>
          </form>

          {/* List of current statuses */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              لیست وضعیت‌های مالی فعال:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paymentStatuses.map((status, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="text-xs font-bold text-slate-800">{status}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentStatus(status)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="حذف این وضعیت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره وضعیت‌های مالی</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Custom Fields Manager */}
      {activeSubTab === 'custom_fields' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>فیلدهای سفارشی شاگردان (Custom Schema)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات اختصاصی مثل وزن، قد، بیمه ورزشی، رده سنی یا شماره پرونده اضافه کنید.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingField(!isAddingField)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer border border-blue-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAddingField ? 'بستن فرم' : 'افزودن فیلد جدید'}</span>
            </button>
          </div>

          {/* New Custom Field Form */}
          {isAddingField && (
            <form onSubmit={handleAddCustomField} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
              <h4 className="text-xs font-black text-blue-900">مشخصات فیلد جدید:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام و عنوان فیلد</label>
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="مثال: قد (سانتی‌متر)، بیمه ورزشی..."
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع داده</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="text">متنی (Text)</option>
                    <option value="number">عددی (Number)</option>
                    <option value="boolean">بله / خیر (Boolean)</option>
                    <option value="select">انتخابی چندگزینه‌ای (Dropdown)</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    گزینه‌ها (هر گزینه در یک خط)
                  </label>
                  <textarea
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    rows={3}
                    placeholder="مبتدی&#10;متوسط&#10;پیشرفته"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-6 text-xs text-slate-700 font-semibold flex-wrap">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldShowTable}
                    onChange={(e) => setNewFieldShowTable(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>نمایش در جدول اصلی</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldShowPrint}
                    onChange={(e) => setNewFieldShowPrint(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>نمایش در کارت و چاپ شاگرد</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingField(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  افزودن فیلد
                </button>
              </div>
            </form>
          )}

          {/* List of Custom Fields */}
          <div className="space-y-3">
            {customFields.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                هیچ فیلد سفارشی تعریف نشده است. با زدن دکمه «افزودن فیلد جدید» می‌توانید فیلدهای دلخواه بسازید.
              </div>
            ) : (
              customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900">{field.label}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {field.type === 'text'
                          ? 'متنی'
                          : field.type === 'number'
                          ? 'عددی'
                          : field.type === 'boolean'
                          ? 'بله/خیر'
                          : 'گزینه‌ای'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex gap-3">
                      <span>نمایش در جدول: {field.showInTable ? 'بله' : 'خیر'}</span>
                      <span>نمایش در کارت شاگرد: {field.showInPrint ? 'بله' : 'خیر'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(field.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره فیلدهای سفارشی</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Theme & Branding */}
      {activeSubTab === 'theme' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <span>هویت بصری، تم رنگی و اطلاعات مدرس</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              رنگ سازمانی و مشخصات مربی را جهت درج در کارت‌های شاگرد و پنل مربی تنظیم کنید.
            </p>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">انتخاب پالت رنگی اصلی:</label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {(Object.keys(THEME_PALETTES) as ThemeColor[]).map((colorKey) => {
                const pal = THEME_PALETTES[colorKey];
                const isSelected = selectedColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setSelectedColor(colorKey)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${pal.primary} shadow-2xs flex items-center justify-center text-white`}>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{pal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dark mode toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer max-w-sm">
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
                className="rounded text-blue-600 w-4 h-4"
              />
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                {isDark ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>حالت تیره برای پنل مربی (Dark Mode)</span>
              </div>
            </label>
          </div>

          {/* Teacher Profile */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-800">اطلاعات مدرس و آموزشگاه:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام مدرس یا مربی</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="مثال: استاد بهروز"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام آموزشگاه یا آکادمی</label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="مثال: آکادمی تخصصی پارکور و کلیستنیکس"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تلفن هماهنگی (درج در کارت)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 text-left font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تم و هویت بصری</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 6: Raw JSON & Direct Database */}
      {activeSubTab === 'raw_db' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>ویرایشگر مستقیم ساختار دیتابیس (Raw JSON) و همگام‌سازی ابری</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                مشاهده، کپی و ویرایش مستقیم دیتابیس محلی و ارسال به سرور Firebase Firestore.
              </p>
            </div>

            <button
              type="button"
              id="btn-cloud-force-sync"
              onClick={handleForceCloudSync}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>همگام‌سازی ابری فوری (Firestore Sync)</span>
            </button>
          </div>

          {jsonError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          {jsonSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{jsonSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor 1: Settings JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>۱. آبجکت تنظیمات سیستم (TeacherSettings JSON):</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rawSettingsJson);
                    alert('JSON تنظیمات در کلیپ‌بورد کپی شد.');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی JSON</span>
                </button>
              </div>
              <textarea
                value={rawSettingsJson}
                onChange={(e) => setRawSettingsJson(e.target.value)}
                rows={12}
                dir="ltr"
                className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 focus:outline-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyRawSettingsJson}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                اعمال مستقیم تغییرات این JSON در تنظیمات سیستم
              </button>
            </div>

            {/* Editor 2: Students JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>۲. آرایه اطلاعات شاگردان ({toPersianDigits(students.length)} شاگرد):</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rawStudentsJson);
                    alert('JSON لیست شاگردان در کلیپ‌بورد کپی شد.');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی شاگردان</span>
                </button>
              </div>
              <textarea
                value={rawStudentsJson}
                onChange={(e) => setRawStudentsJson(e.target.value)}
                rows={12}
                dir="ltr"
                className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-300 bg-slate-900 text-cyan-300 focus:outline-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyRawStudentsJson}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                اعمال مستقیم این لیست شاگردان در دیتابیس
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
