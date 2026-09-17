import React, { useState, useEffect } from 'react';
import { 
  Building2, Monitor, Package, BarChart3, Users, 
  Globe, ShieldCheck, RotateCcw, Bell, Printer, 
  FileCheck2, BookOpen, Shield, Settings 
} from 'lucide-react';
import { PosTerminal } from './components/PosTerminal';
import { InventoryManager } from './components/InventoryManager';
import { FinancialDashboard } from './components/FinancialDashboard';
import { CustomersManager } from './components/CustomersManager';
import { AuditLogsViewer } from './components/AuditLogsViewer';
import { SettingsManager } from './components/SettingsManager';
import { ShiftModal } from './components/ShiftModal';
import { AuthModal } from './components/AuthModal';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { TestingSuiteModal } from './components/TestingSuiteModal';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { INITIAL_COMPANY, INITIAL_BRANCHES, INITIAL_USERS } from './data/seed';
import { Language, TRANSLATIONS } from './utils/i18n';
import { PosStorageEngine, isSuperAdmin } from './storage';
import { User } from './types';

type ActiveModule = 'POS' | 'INVENTORY' | 'FINANCE' | 'CUSTOMERS' | 'AUDIT' | 'SETTINGS';

export default function App() {
  const [lang, setLang] = useState<Language>(() => PosStorageEngine.getLanguage());
  const [activeModule, setActiveModule] = useState<ActiveModule>('POS');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  const [selectedBranch, setSelectedBranch] = useState(INITIAL_BRANCHES[0]);
  const [currentUser, setCurrentUser] = useState<User>(() => PosStorageEngine.getCurrentUser());
  const isSuper = isSuperAdmin(currentUser);
  const [posKey, setPosKey] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(
    PosStorageEngine.getNotifications().filter(n => !n.read).length
  );

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    PosStorageEngine.setLanguage(lang);
  }, [lang]);

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
  };

  const handleResetData = () => {
    const confirmText = lang === 'ar' 
      ? 'هل أنت متأكد من رغبتك في إعادة ضبط البيانات إلى القيم الافتراضية للسوق المصري (الجنيه المصري والسلع المصرية)؟'
      : 'Are you sure you want to reset demo data to Egyptian market defaults (EGP and Egyptian retail products)?';
    if (window.confirm(confirmText)) {
      PosStorageEngine.resetToEgyptianDefaults();
      setPosKey(prev => prev + 1);
      window.location.reload();
    }
  };

  const refreshNotificationCount = () => {
    setUnreadNotifs(PosStorageEngine.getNotifications().filter(n => !n.read).length);
  };

  return (
    <div className={`flex h-screen w-screen bg-slate-900 text-slate-900 overflow-hidden select-none ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      {/* GLOBAL SLIM NAVIGATION RAIL */}
      <aside className="w-16 bg-slate-950 flex flex-col items-center py-3 border-e border-slate-800/80 z-20 shrink-0">
        {/* Brand App Icon */}
        <div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md mb-4 tracking-wider cursor-default shrink-0"
          title={lang === 'ar' ? 'أفق النيل - نظام نقاط البيع المصري' : 'Nile Horizon POS Egypt'}
        >
          {lang === 'ar' ? 'نيل' : 'NH'}
        </div>

        {/* Navigation Module Buttons */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto">
          <button
            id="nav-pos"
            onClick={() => setActiveModule('POS')}
            title={`${t.pos} (F1)`}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'POS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{t.pos}</span>
          </button>

          <button
            id="nav-inventory"
            onClick={() => setActiveModule('INVENTORY')}
            title={t.inventory}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'INVENTORY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{t.inventory}</span>
          </button>

          <button
            id="nav-finance"
            onClick={() => setActiveModule('FINANCE')}
            title={lang === 'ar' ? 'لوحة المؤشرات والمالية (Dashboard)' : 'Financial Dashboard'}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'FINANCE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'المؤشرات' : 'Finance'}</span>
          </button>

          <button
            id="nav-customers"
            onClick={() => setActiveModule('CUSTOMERS')}
            title={t.customers}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'CUSTOMERS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{t.customers}</span>
          </button>

          <button
            id="nav-audit"
            onClick={() => setActiveModule('AUDIT')}
            title={lang === 'ar' ? 'سجل الرقابة والتدقيق (Audit Logs)' : 'Audit Logs'}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'AUDIT'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'التدقيق' : 'Audit'}</span>
          </button>

          <button
            id="nav-settings"
            onClick={() => setActiveModule('SETTINGS')}
            title={lang === 'ar' ? 'إعدادات النظام والضرائب' : 'Settings'}
            className={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeModule === 'SETTINGS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </button>
        </nav>

        {/* Bottom System & Cash Shift Controls */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-800/80 w-full px-2 shrink-0">
          <button 
            id="btn-shift-modal"
            onClick={() => setIsShiftModalOpen(true)}
            title={t.cashShift}
            className="w-10 h-10 rounded-2xl bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* TOP STATUS BAR & MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        {/* Global Enterprise Header Bar */}
        <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Active Company Name & Branch Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                {lang === 'ar' ? INITIAL_COMPANY.nameAr : INITIAL_COMPANY.name}
              </span>
              <span className="text-slate-300">|</span>
              <select
                id="branch-selector"
                value={selectedBranch.id}
                onChange={(e) => {
                  const b = INITIAL_BRANCHES.find(item => item.id === e.target.value);
                  if (b) setSelectedBranch(b);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {INITIAL_BRANCHES.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {lang === 'ar' ? branch.nameAr : branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Header Tools (Receipts, Notifications, Tests, Docs, User, Currency) */}
          <div className="flex items-center gap-2">
            {/* Receipt Templates & Print Center (Phase 15) */}
            <button
              id="btn-print-center"
              onClick={() => setIsReceiptModalOpen(true)}
              title={lang === 'ar' ? 'معاينة قوالب الطباعة والفاتورة الضريبية' : 'Print & Receipt Templates'}
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">{lang === 'ar' ? 'الطباعة والفواتير' : 'Receipts'}</span>
            </button>

            {/* Smart Notification Center Bell (Phase 16) */}
            <button
              id="btn-notifications"
              onClick={() => setIsNotificationsOpen(true)}
              title={lang === 'ar' ? 'مركز التنبيهات والإشعارات' : 'Notifications'}
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Verification & Testing Suite (Phase 19) - Super Admin Only */}
            {isSuper && (
              <button
                id="btn-test-suite"
                onClick={() => setIsTestsModalOpen(true)}
                title={lang === 'ar' ? 'منظومة الاختبارات الآلية (Testing Suite)' : 'Automated Tests'}
                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">{lang === 'ar' ? 'الاختبارات' : 'Tests'}</span>
              </button>
            )}

            {/* Architecture & Documentation (Phase 20) - Super Admin Only */}
            {isSuper && (
              <button
                id="btn-sys-docs"
                onClick={() => setIsDocsModalOpen(true)}
                title={lang === 'ar' ? 'دليل المراحل والتوثيق التقني' : 'System Documentation'}
                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">{lang === 'ar' ? 'دليل النظام' : 'Docs'}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Active User / Cashier Login Switcher */}
            <div 
              id="user-badge"
              onClick={() => setIsAuthModalOpen(true)}
              title={lang === 'ar' ? 'تبديل الكاشير / تسجيل الدخول بالرقم السري' : 'Switch Cashier / Login'}
              className="flex items-center gap-2 bg-slate-100 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-800 group-hover:text-emerald-800">{currentUser.name}</span>
              <span className="text-[9px] uppercase font-black text-emerald-800 bg-emerald-100/70 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                {currentUser.roleName?.split('(')[0]?.trim() || currentUser.roleName}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 font-bold ml-0.5">
                ▾
              </span>
            </div>

            {/* Currency indicator (EGP) */}
            <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs">
              {lang === 'ar' ? 'ج.م (EGP)' : 'EGP (ج.م)'}
            </span>

            {/* Reset to Egyptian seed defaults button */}
            <button
              onClick={handleResetData}
              title={lang === 'ar' ? 'إعادة ضبط البيانات النموذجية لمصر' : 'Reset Egypt Seed Data'}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ACTIVE MODULE VIEW CONTAINER */}
        <main className="flex-1 overflow-hidden relative">
          {activeModule === 'POS' && (
            <PosTerminal 
              key={posKey}
              lang={lang}
              selectedBranch={selectedBranch}
              onShiftModalOpen={() => setIsShiftModalOpen(true)} 
            />
          )}
          {activeModule === 'INVENTORY' && (
            <InventoryManager lang={lang} currentUser={currentUser} />
          )}
          {activeModule === 'FINANCE' && (
            <FinancialDashboard lang={lang} />
          )}
          {activeModule === 'CUSTOMERS' && (
            <CustomersManager lang={lang} />
          )}
          {activeModule === 'AUDIT' && (
            <AuditLogsViewer lang={lang} />
          )}
          {activeModule === 'SETTINGS' && (
            <SettingsManager lang={lang} currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* GLOBAL SHIFT & REGISTER CONTROL MODAL */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        lang={lang}
        onClose={() => setIsShiftModalOpen(false)}
        onSessionUpdated={() => {
          setPosKey(prev => prev + 1);
        }}
      />

      {/* GLOBAL AUTHENTICATION & USER MANAGEMENT MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        lang={lang}
        onClose={() => setIsAuthModalOpen(false)}
        onUserChanged={(u) => {
          setCurrentUser(u);
          PosStorageEngine.setCurrentUser(u);
          setPosKey(prev => prev + 1);
        }}
      />

      {/* RECEIPT PREVIEW & PRINTING MODAL (PHASE 15) */}
      <ReceiptPreviewModal
        isOpen={isReceiptModalOpen}
        lang={lang}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* NOTIFICATION CENTER MODAL (PHASE 16) */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        lang={lang}
        onClose={() => {
          setIsNotificationsOpen(false);
          refreshNotificationCount();
        }}
        onRefreshNotifications={refreshNotificationCount}
        onNavigateModule={(mod) => setActiveModule(mod)}
      />

      {/* AUTOMATED TEST SUITE RUNNER MODAL (PHASE 19) */}
      <TestingSuiteModal
        isOpen={isTestsModalOpen}
        lang={lang}
        currentUser={currentUser}
        onClose={() => setIsTestsModalOpen(false)}
      />

      {/* SYSTEM ARCHITECTURE & 20 PHASES DOCUMENTATION (PHASE 20) */}
      <SystemDocumentationModal
        isOpen={isDocsModalOpen}
        lang={lang}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
}
