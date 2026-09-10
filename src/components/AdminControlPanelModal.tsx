import React, { useState } from 'react';
import {
  X,
  Check,
  Palette,
  Tag,
  PlusCircle,
  Trash2,
  Building2,
  User,
  Phone,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  Sliders,
  Eye,
  MessageSquare,
  Printer,
  ChevronDown,
} from 'lucide-react';
import {
  TeacherSettings,
  FieldLabelsConfig,
  CustomFieldDefinition,
  AppThemeConfig,
  ThemeColor,
} from '../types';
import {
  DEFAULT_FIELD_LABELS,
  FIELD_LABEL_PRESETS,
  THEME_PALETTES,
  PRESET_CUSTOM_FIELDS,
  DEFAULT_THEME,
} from '../utils/theme';

interface Props {
  settings: TeacherSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: TeacherSettings) => void;
}

type TabType = 'theme' | 'labels' | 'custom_fields' | 'profile';

export const AdminControlPanelModal: React.FC<Props> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('theme');

  // Theme state
  const currentTheme = settings.theme || DEFAULT_THEME;
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(currentTheme.color || 'crimson');
  const [isDark, setIsDark] = useState<boolean>(!!currentTheme.isDark);
  const [appTitle, setAppTitle] = useState<string>(
    currentTheme.appTitle || 'سامانه مدیریت کلاس‌ها و برنامه تمرینات'
  );
  const [appSubtitle, setAppSubtitle] = useState<string>(
    currentTheme.appSubtitle || 'ثبت روزها و ساعت‌ها، ارسال به واتساپ، کارت آنلاین و پیگیری شهریه'
  );

  // Field labels state
  const [fieldLabels, setFieldLabels] = useState<FieldLabelsConfig>({
    ...DEFAULT_FIELD_LABELS,
    ...(settings.fieldLabels || {}),
  });

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(
    settings.customFields ? [...settings.customFields] : []
  );

  // New custom field form state
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldShowTable, setNewFieldShowTable] = useState(true);
  const [newFieldShowMessage, setNewFieldShowMessage] = useState(true);
  const [newFieldShowPrint, setNewFieldShowPrint] = useState(true);

  // Profile state
  const [teacherName, setTeacherName] = useState(settings.teacherName || 'استاد بهروز');
  const [instituteName, setInstituteName] = useState(
    settings.instituteName || 'کلاس‌های کلیستنیکس / پارکور / ژیمناستیک / رزمی'
  );
  const [phone, setPhone] = useState(settings.phone || '');

  if (!isOpen) return null;

  const handleApplyPreset = (presetLabels: FieldLabelsConfig) => {
    setFieldLabels({ ...presetLabels });
  };

  const handleResetLabels = () => {
    setFieldLabels({ ...DEFAULT_FIELD_LABELS });
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const id = `custom_${Date.now()}`;
    const options =
      newFieldType === 'select'
        ? newFieldOptions
            .split(/[,،\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: CustomFieldDefinition = {
      id,
      label: newFieldLabel.trim(),
      type: newFieldType,
      options: options && options.length > 0 ? options : ['گزینه ۱', 'گزینه ۲'],
      placeholder: newFieldPlaceholder.trim() || undefined,
      showInTable: newFieldShowTable,
      showInMessage: newFieldShowMessage,
      showInPrint: newFieldShowPrint,
    };

    setCustomFields([...customFields, newField]);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setIsAddingField(false);
  };

  const handleAddPresetField = (preset: (typeof PRESET_CUSTOM_FIELDS)[0]) => {
    const id = `custom_${Date.now()}`;
    const newField: CustomFieldDefinition = {
      id,
      ...preset,
    };
    setCustomFields([...customFields, newField]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleToggleFieldProp = (
    id: string,
    prop: 'showInTable' | 'showInMessage' | 'showInPrint'
  ) => {
    setCustomFields(
      customFields.map((f) => {
        if (f.id === id) {
          return { ...f, [prop]: !f[prop] };
        }
        return f;
      })
    );
  };

  const handleSaveAll = () => {
    const updated: TeacherSettings = {
      ...settings,
      teacherName: teacherName.trim(),
      instituteName: instituteName.trim(),
      phone: phone.trim(),
      fieldLabels,
      customFields,
      theme: {
        color: selectedColor,
        isDark,
        appTitle: appTitle.trim(),
        appSubtitle: appSubtitle.trim(),
      },
      updatedAt: Date.now(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden text-right transition-colors duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">
                پنل مدیریت و شخصی‌سازی کامل صفحه
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                تغییر تم رنگی، نام فیلدها، فیلدهای دلخواه جدید و مشخصات مربی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-2 border-b overflow-x-auto no-scrollbar shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/50 border-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 تم و ظاهر صفحه</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labels')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'labels'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>🏷️ نام فیلدها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom_fields')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'custom_fields'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>➕ فیلدهای دلخواه ({customFields.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👤 مربی و باشگاه</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: THEME & COLOR PALETTE */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Color Palette Selector */}
              <div>
                <label className="block text-sm font-extrabold mb-2.5">
                  انتخاب پالت رنگی صفحه:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(THEME_PALETTES) as ThemeColor[]).map((colKey) => {
                    const palette = THEME_PALETTES[colKey];
                    const isSelected = selectedColor === colKey;
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => setSelectedColor(colKey)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm ' +
                              (isDark ? 'bg-slate-800' : 'bg-blue-50/50')
                            : isDark
                            ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{palette.emoji}</span>
                          <div>
                            <div className="text-xs font-bold">{palette.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full ${palette.primary} shadow-xs`} />
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dark / Light Mode Switch */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-200 text-slate-700'}`}>
                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">
                      حالت دارک / تاریک صفحه (Dark Mode)
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      مناسب برای محیط‌های ورزشی، باشگاهی و جلوگیری از خستگی چشم
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDark(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      !isDark
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    روشن
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDark(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    تاریک
                  </button>
                </div>
              </div>

              {/* Title and Subtitle customizer */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold">عنوان و تیترهای بالای صفحه:</h3>
                <div>
                  <label className="block text-xs font-semibold mb-1">تیتر اصلی صفحه:</label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="مثال: باشگاه کلیستنیکس و پارکور استاد بهروز"
                    className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">زیرعنوان و توضیحات:</label>
                  <input
                    type="text"
                    value={appSubtitle}
                    onChange={(e) => setAppSubtitle(e.target.value)}
                    placeholder="مثال: سامانه مدیریت روزها و ساعات تمرین و شهریه هنرجویان"
                    className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIELD LABELS CUSTOMIZER */}
          {activeTab === 'labels' && (
            <div className="space-y-5">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  قالب‌های سریع نام‌گذاری فیلدها (با یک کلیک):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FIELD_LABEL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.labels)}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        isDark
                          ? 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 text-slate-800'
                      }`}
                    >
                      <div className="text-base mb-1">{preset.icon}</div>
                      <div className="text-xs font-bold line-clamp-1">{preset.name}</div>
                      <div className="text-[10px] text-blue-500 mt-1">اعمال این قالب ←</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-extrabold">شخصی‌سازی دستی نام تک‌تک فیلدها:</span>
                <button
                  type="button"
                  onClick={handleResetLabels}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی به پیش‌فرض</span>
                </button>
              </div>

              {/* Grid of labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «شاگرد / ورزشکار»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.studentName}
                    onChange={(e) =>
                      setFieldLabels({ ...fieldLabels, studentName: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «شماره تماس / واتساپ»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.studentPhone}
                    onChange={(e) =>
                      setFieldLabels({ ...fieldLabels, studentPhone: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «ماه / دوره تمرین»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.month}
                    onChange={(e) => setFieldLabels({ ...fieldLabels, month: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «تعداد جلسات»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.totalSessions}
                    onChange={(e) =>
                      setFieldLabels({ ...fieldLabels, totalSessions: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «رشته ورزشی / عنوان درس»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.subject}
                    onChange={(e) => setFieldLabels({ ...fieldLabels, subject: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «شهریه / هزینه دوره»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.fee}
                    onChange={(e) => setFieldLabels({ ...fieldLabels, fee: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «وضعیت پرداخت»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.paymentStatus}
                    onChange={(e) =>
                      setFieldLabels({ ...fieldLabels, paymentStatus: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «روزها و ساعت‌ها»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.sessions}
                    onChange={(e) => setFieldLabels({ ...fieldLabels, sessions: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">
                    نام فیلد «یادداشت و نکات»:
                  </label>
                  <input
                    type="text"
                    value={fieldLabels.notes}
                    onChange={(e) => setFieldLabels({ ...fieldLabels, notes: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM FIELDS (DYNAMIC FIELDS) */}
          {activeTab === 'custom_fields' && (
            <div className="space-y-6">
              {/* Quick Preset Buttons for Athletic Coach */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  فیلدهای ورزشی آماده (افزودن با یک کلیک):
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CUSTOM_FIELDS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPresetField(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-500 hover:bg-slate-700'
                          : 'border-slate-300 bg-slate-100 text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Field Form or Button */}
              {!isAddingField ? (
                <button
                  type="button"
                  onClick={() => setIsAddingField(true)}
                  className={`w-full py-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800/40'
                      : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>تعریف فیلد جدید اختصاصی</span>
                </button>
              ) : (
                <form
                  onSubmit={handleAddCustomField}
                  className={`p-4 rounded-xl border space-y-3.5 ${
                    isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/40">
                    <span className="text-xs font-extrabold text-blue-600">
                      مشخصات فیلد جدید:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      انصراف
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        عنوان فیلد (مثلاً: رده سنی / وزن):
                      </label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="عنوان فیلد"
                        required
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">نوع ورودی:</label>
                      <select
                        value={newFieldType}
                        onChange={(e) =>
                          setNewFieldType(
                            e.target.value as 'text' | 'number' | 'select' | 'boolean'
                          )
                        }
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        <option value="text">متن ساده (Text)</option>
                        <option value="select">لیست انتخابی (Dropdown)</option>
                        <option value="number">عدد (Number)</option>
                        <option value="boolean">تیک‌باکس / بله یا خیر (Checkbox)</option>
                      </select>
                    </div>

                    {newFieldType === 'select' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold mb-1">
                          گزینه‌های انتخابی (با کاما یا ویرگول جدا کنید):
                        </label>
                        <input
                          type="text"
                          value={newFieldOptions}
                          onChange={(e) => setNewFieldOptions(e.target.value)}
                          placeholder="مثال: مبتدی، متوسط، پیشرفته"
                          className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                    )}

                    {newFieldType !== 'boolean' && newFieldType !== 'select' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold mb-1">
                          متن راهنما داخل کادر (Placeholder):
                        </label>
                        <input
                          type="text"
                          value={newFieldPlaceholder}
                          onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                          placeholder="مثال: بزرگسالان / ۶۸ کیلوگرم"
                          className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Display options */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldShowTable}
                        onChange={(e) => setNewFieldShowTable(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>نمایش در کارت‌های جدول</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldShowMessage}
                        onChange={(e) => setNewFieldShowMessage(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>نمایش در پیام واتساپ</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldShowPrint}
                        onChange={(e) => setNewFieldShowPrint(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>نمایش در برگه پرینت</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      افزودن فیلد
                    </button>
                  </div>
                </form>
              )}

              {/* List of defined custom fields */}
              <div>
                <h4 className="text-xs font-extrabold mb-2.5">
                  فیلدهای سفارشی فعال روی سامانه ({customFields.length}):
                </h4>
                {customFields.length === 0 ? (
                  <div
                    className={`p-6 text-center rounded-xl border text-xs ${
                      isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    هنوز فیلد دلخواهی اضافه نشده است. می‌توانید با استفاده از دکمه بالا یا پیشنهادهای
                    آماده، فیلدهایی مثل «سطح ورزشی»، «رده سنی»، «سالن تمرین» یا «شماره بیمه» اضافه
                    کنید.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark
                            ? 'bg-slate-800/40 border-slate-700'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm">{field.label}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600">
                              {field.type === 'text'
                                ? 'متن'
                                : field.type === 'select'
                                ? 'انتخابی'
                                : field.type === 'number'
                                ? 'عدد'
                                : 'بله/خیر'}
                            </span>
                          </div>
                          {field.type === 'select' && field.options && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              گزینه‌ها: {field.options.join(' ، ')}
                            </div>
                          )}
                        </div>

                        {/* Toggles & Delete */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            title="نمایش در کارت"
                            onClick={() => handleToggleFieldProp(field.id, 'showInTable')}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                              field.showInTable !== false
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[10px]">کارت</span>
                          </button>

                          <button
                            type="button"
                            title="نمایش در واتساپ"
                            onClick={() => handleToggleFieldProp(field.id, 'showInMessage')}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                              field.showInMessage !== false
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[10px]">واتساپ</span>
                          </button>

                          <button
                            type="button"
                            title="نمایش در پرینت"
                            onClick={() => handleToggleFieldProp(field.id, 'showInPrint')}
                            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                              field.showInPrint !== false
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="text-[10px]">چاپ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(field.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف فیلد"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & TEACHER INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                این اطلاعات در بالای برگه چاپ فیش، کارت اختصاصی شاگرد و پیام‌های ارسالی درج می‌شود.
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  عنوان باشگاه، آموزشگاه یا آکادمی:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    placeholder="مثال: کلاس‌ کلیستنیکس / پارکور / ژیمناستیک / رزمی"
                    className={`w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">نام مربی / استاد:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="مثال: استاد بهروز خان احمدلو"
                    className={`w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  شماره تماس هماهنگی مربی:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 09120000000"
                    dir="ltr"
                    className={`w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t shrink-0 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره تغییرات و اعمال روی کل صفحه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
