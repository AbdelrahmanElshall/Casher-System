import React, { useState } from 'react';
import { BookOpen, Layers, Server, ShieldCheck, CheckCircle2, X, Terminal, Cpu, FileText } from 'lucide-react';
import { Language } from '../utils/i18n';

interface SystemDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SystemDocumentationModal: React.FC<SystemDocumentationModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [selectedTopic, setSelectedTopic] = useState<'PHASES' | 'DOCKER' | 'ARCHITECTURE' | 'ETA_TAX'>('PHASES');

  if (!isOpen) return null;

  const phases = [
    { num: 1, title: 'Multi-Branch & Organization Model', desc: 'Company hierarchy, Cairo & Giza branches, Egyptian currency base' },
    { num: 2, title: 'POS Barcode Scanner & Egyptian Tenders', desc: 'Fast barcode lookup, strict 5, 10, 20, 50, 100, 200 EGP banknote keypad' },
    { num: 3, title: 'Cart Management & Tax Logic', desc: 'Quantity stepping, price calculation, itemized tax inclusion' },
    { num: 4, title: 'Hold & Resume Tickets', desc: 'Multi-order ticketing queue for active retail queues' },
    { num: 5, title: 'Cash Drawer & Shift Reconciliation', desc: 'Opening cash, cash in/out, variance tracking and shift closing' },
    { num: 6, title: 'Returns & Refund Engine', desc: 'Invoice-backed returns, receipt verification and stock restoration' },
    { num: 7, title: 'Customer Discount Rules (>300 EGP)', desc: 'Special VIP discounts strictly guarded by minimum subtotal threshold' },
    { num: 8, title: 'Expense Tracking & Operating Costs', desc: 'Petty cash, utility bills, supplier payments directly accounted' },
    { num: 9, title: 'Customer Segmentation (Daily vs Monthly)', desc: 'Daily walk-in vs monthly credit customers, ledger balance limits' },
    { num: 10, title: 'Supplier & Wholesale Purchases', desc: 'Vendor directory, stock reception, accounts payable ledger' },
    { num: 11, title: 'Inventory Stock & Category RBAC', desc: 'Stock movements, Super Admin only creation/deletion protection' },
    { num: 12, title: 'Dual-Language Architecture (AR/EN)', desc: 'Full RTL/LTR support, Egyptian market Arabic terminology' },
    { num: 13, title: 'Financial Statements & P&L', desc: 'Revenue, Cost of Goods Sold, Gross Profit, Operating Margin' },
    { num: 14, title: 'Executive Analytics Dashboard', desc: 'Real-time KPIs, turnover rates, low stock alerts, financial overview' },
    { num: 15, title: 'Printing & Receipt Templates', desc: '80mm and 58mm thermal receipts + Official A4 ETA Tax Invoices' },
    { num: 16, title: 'Smart Notification Center', desc: 'Out of stock alerts, expiring batches, compliance reminders' },
    { num: 17, title: 'Enterprise Audit Logs', desc: 'Immutable security log tracking who created/deleted entities and when' },
    { num: 18, title: 'Settings & VAT Configuration', desc: 'Tax numbers, commercial registration, receipt text, data backups' },
    { num: 19, title: 'Automated Regression Testing', desc: 'Interactive verification runner validating Egyptian laws & RBAC' },
    { num: 20, title: 'Docker, Deployment & Production Guide', desc: 'Production containers, deployment scripts, security hardening' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">
                {isAr ? 'دليل وبنية النظام الشاملة (All 20 Phases Documentation)' : 'System Architecture & Deployment Manual'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'التوثيق المكتبي لجميع المراحل من 1 إلى 20، إرشادات النشر والحاويات' : 'Complete 20-phase enterprise technical blueprint'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex gap-2 shrink-0">
          <button
            onClick={() => setSelectedTopic('PHASES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'PHASES' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'خارطة المراحل العشرين (Phases 1 - 20)' : '20 Phases Roadmap'}
          </button>
          <button
            onClick={() => setSelectedTopic('DOCKER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'DOCKER' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'حاويات Docker وخطوات النشر' : 'Docker & Cloud Run'}
          </button>
          <button
            onClick={() => setSelectedTopic('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'ARCHITECTURE' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الأمان وحوكمة الصلاحيات (RBAC)' : 'Security & RBAC'}
          </button>
          <button
            onClick={() => setSelectedTopic('ETA_TAX')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'ETA_TAX' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'معايير الضرائب المصرية (ETA)' : 'Egyptian Tax Standard'}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {selectedTopic === 'PHASES' && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                {isAr ? 'اكتمال المراحل العشرين لنظام نقاط البيع المصري' : '20 Development Phases Specification'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phases.map(p => (
                  <div key={p.num} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {p.num}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTopic === 'DOCKER' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'إرشادات تشغيل الحاويات (Docker & Production Deployment)' : 'Containerization & Dockerfile Blueprint'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr 
                  ? 'تم تجهيز المشروع بحاويات Docker متعددة المراحل (Multi-stage build) لتقديم أداء فائق، أمان عالي، وصغر حجم الصورة الناتجة.' 
                  : 'Multi-stage Docker builds configured for minimal footprint, hardened security, and high throughput.'}
              </p>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2">
                <div className="text-emerald-400 font-bold"># 1. Build and run via Docker Compose</div>
                <div>docker compose up -d --build</div>
                <div className="text-emerald-400 font-bold mt-2"># 2. Production container verification</div>
                <div>curl -I http://localhost:3000</div>
              </div>
            </div>
          )}

          {selectedTopic === 'ARCHITECTURE' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'بنية حوكمة الصلاحيات (Role-Based Access Control - RBAC)' : 'Security Architecture & RBAC'}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {isAr
                  ? 'يفرض النظام رقابة صارمة على الأصول الحساسة: تقتصر عمليات إضافة وحذف الأصناف والتصنيفات وتعديل أسعار التكلفة على دور المشرف العام (Super Admin) فقط. يتم حظر الكاشير والمستخدم القياسي برمجياً في طبقة التخزين مع تسجيل كل محاولة في سجل التدقيق الأمني.'
                  : 'Strict access control restricts catalog modification, category deletion, and price configuration to Super Admin users only.'}
              </p>
            </div>
          )}

          {selectedTopic === 'ETA_TAX' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'الامتثال لمنظومة الفاتورة والإيصال الإلكتروني المصرية (ETA Compliance)' : 'Egyptian Tax Authority Compliance'}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {isAr
                  ? 'تمت برمجة إيصالات البيع لتشمل الرقم الضريبي المعتمد (200-482-913) والسجل التجاري، بالإضافة إلى تشفير QR Code مطابق لمواصفات مصلحة الضرائب المصرية لتسهيل الفحص الضريبي وحماية حقوق المستهلكين.'
                  : 'Full compliance with ETA guidelines including cryptographic QR hashes, standard 14% VAT computation, and valid tax registry headers.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
