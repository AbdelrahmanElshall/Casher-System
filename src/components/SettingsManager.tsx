import React, { useState } from 'react';
import { Settings, Save, Building2, Receipt, ShieldCheck, Download, Upload, CheckCircle2, RotateCcw } from 'lucide-react';
import { SystemSettings, User } from '../types';
import { PosStorageEngine, isSuperAdmin } from '../storage';
import { Language } from '../utils/i18n';

interface SettingsManagerProps {
  lang: Language;
  currentUser: User;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ lang, currentUser }) => {
  const isAr = lang === 'ar';
  const superAdmin = isSuperAdmin(currentUser);

  const [settings, setSettings] = useState<SystemSettings>(() => PosStorageEngine.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    PosStorageEngine.saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      products: PosStorageEngine.getProducts(),
      categories: PosStorageEngine.getCategories(),
      customers: PosStorageEngine.getCustomers(),
      suppliers: PosStorageEngine.getSuppliers(),
      sales: PosStorageEngine.getSales(),
      expenses: PosStorageEngine.getExpenses(),
      movements: PosStorageEngine.getMovements(),
      settings: PosStorageEngine.getSettings(),
      auditLogs: PosStorageEngine.getAuditLogs(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nile-horizon-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>{isAr ? 'إعدادات النظام والضرائب (Settings - Phase 18)' : 'System & Enterprise Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr 
              ? 'تخصيص بيانات المنشأة، التسجيل الضريبي المصري، ضريبة القيمة المضافة، ونصوص الفواتير' 
              : 'Enterprise identity, Egyptian ETA tax parameters, receipt styling, and backups'}
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تم حفظ الإعدادات بنجاح!' : 'Settings Saved Successfully!'}</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSave} className="max-w-4xl space-y-6 pb-8">
          {/* Card 1: Enterprise Legal Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isAr ? 'بيانات المؤسسة والامتثال الضريبي (جمهورية مصر العربية)' : 'Company & Tax Authority Identity'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'الاسم التجاري للمؤسسة (بالعربية)' : 'Company Name (Arabic)'}
                </label>
                <input
                  type="text"
                  required
                  value={settings.companyNameAr}
                  onChange={e => setSettings({ ...settings, companyNameAr: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'الاسم التجاري (بالإنجليزية)' : 'Company Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم التسجيل الضريبي (مصلحة الضرائب المصرية)' : 'Egyptian Tax Registration Number (ETA)'}
                </label>
                <input
                  type="text"
                  required
                  value={settings.taxNumber}
                  onChange={e => setSettings({ ...settings, taxNumber: e.target.value })}
                  placeholder="200-482-913"
                  className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-emerald-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم السجل التجاري' : 'Commercial Registration (CR)'}
                </label>
                <input
                  type="text"
                  required
                  value={settings.commercialReg}
                  onChange={e => setSettings({ ...settings, commercialReg: e.target.value })}
                  placeholder="148204-GIZA"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 2: VAT & Fiscal Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isAr ? 'ضريبة القيمة المضافة (Egyptian VAT Rules)' : 'VAT & Tax Calculations'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">{isAr ? 'تفعيل ضريبة القيمة المضافة التلقائية' : 'Enable Standard VAT'}</div>
                  <div className="text-[11px] text-slate-500">{isAr ? 'احتساب 14% على السلع الخاضعة للضريبة' : 'Calculate 14% Egyptian VAT'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableVat}
                  onChange={e => setSettings({ ...settings, enableVat: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'نسبة الضريبة الافتراضية (%)' : 'Standard VAT Rate (%)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.vatRate}
                  onChange={e => setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Receipt & Printer Layout */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                {isAr ? 'قالب ونصوص الفاتورة والإيصال الحراري' : 'Receipt & Printer Layout'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'عرض ورق الطابعة الافتراضي' : 'Default Paper Roll Width'}
                </label>
                <select
                  value={settings.receiptWidth}
                  onChange={e => setSettings({ ...settings, receiptWidth: e.target.value as any })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="80mm">{isAr ? '80 مم - طابعة كاشير قياسية (Standard 80mm)' : '80mm Standard POS'}</option>
                  <option value="58mm">{isAr ? '58 مم - طابعة صغيرة متنقلة (Compact 58mm)' : '58mm Mobile/Bluetooth'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'حد تنبيه نقص المخزون العام' : 'Default Low Stock Alert Threshold'}
                </label>
                <input
                  type="number"
                  value={settings.lowStockThresholdDefault}
                  onChange={e => setSettings({ ...settings, lowStockThresholdDefault: parseInt(e.target.value) || 10 })}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'ترويسة الفاتورة العلوية (Header Message)' : 'Receipt Header Message'}
                </label>
                <input
                  type="text"
                  value={settings.receiptHeader}
                  onChange={e => setSettings({ ...settings, receiptHeader: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'تذييل الفاتورة وسياسة الاسترجاع (Footer & Return Policy)' : 'Receipt Footer & Return Policy'}
                </label>
                <textarea
                  rows={2}
                  value={settings.receiptFooter}
                  onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Backup & Export Actions */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'تصدير نسخة احتياطية كاملة (Enterprise Backup)' : 'Export Full System Backup'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr 
                  ? 'تنزيل ملف JSON يحتوي على كامل قاعدة البيانات: المنتجات، الأصناف، الفواتير، والعملاء' 
                  : 'Download complete database snapshot (JSON) for safety and migration'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تنزيل ملف النسخة الاحتياطية' : 'Download JSON Backup'}</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتطبيق جميع الإعدادات' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
