import React, { useState } from 'react';
import { 
  Users, UserPlus, Phone, CreditCard, Award, Search, 
  CalendarDays, Clock, Tag, Edit3, Check, Percent, Sparkles, AlertCircle 
} from 'lucide-react';
import { Customer } from '../types';
import { PosStorageEngine } from '../storage';
import { Language, TRANSLATIONS, formatEGP } from '../utils/i18n';

interface CustomersManagerProps {
  lang: Language;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ lang }) => {
  const isArabic = lang === 'ar';
  const t = TRANSLATIONS[lang];
  const [customers, setCustomers] = useState<Customer[]>(PosStorageEngine.getCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'DAILY' | 'MONTHLY' | 'NONE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<Customer['customerType']>('REGULAR');
  const [billingCycle, setBillingCycle] = useState<'DAILY' | 'MONTHLY' | 'NONE'>('DAILY');
  const [isSpecial, setIsSpecial] = useState(true);
  const [specialDiscountRate, setSpecialDiscountRate] = useState('10');
  const [creditLimit, setCreditLimit] = useState('5000');

  const refreshCustomers = () => {
    setCustomers(PosStorageEngine.getCustomers());
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setTaxNumber('');
    setAddress('');
    setCustomerType('REGULAR');
    setBillingCycle('DAILY');
    setIsSpecial(true);
    setSpecialDiscountRate('10');
    setCreditLimit('5000');
    setIsAddModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setTaxNumber(cust.taxNumber || '');
    setAddress(cust.address || '');
    setCustomerType(cust.customerType);
    setBillingCycle(cust.billingCycle || 'NONE');
    setIsSpecial(Boolean(cust.isSpecial));
    setSpecialDiscountRate(String(cust.specialDiscountRate || 10));
    setCreditLimit(String(cust.creditLimit || 0));
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const discountNum = isSpecial ? Math.max(0, Math.min(100, parseFloat(specialDiscountRate) || 0)) : 0;

    if (editingCustomer) {
      PosStorageEngine.updateCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        address: address.trim() || undefined,
        customerType,
        billingCycle,
        isSpecial,
        specialDiscountRate: discountNum,
        creditLimit: parseFloat(creditLimit) || 0,
      });
    } else {
      PosStorageEngine.addCustomer({
        name: name.trim(),
        phone: phone.trim() || '0100 000 0000',
        taxNumber: taxNumber.trim() || undefined,
        address: address.trim() || 'Cairo, Egypt',
        customerType,
        billingCycle,
        isSpecial,
        specialDiscountRate: discountNum,
        creditLimit: parseFloat(creditLimit) || 0,
      });
    }

    setIsAddModalOpen(false);
    refreshCustomers();
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.taxNumber && c.taxNumber.includes(searchQuery));
    
    if (!matchesSearch) return false;
    if (cycleFilter === 'ALL') return true;
    return (c.billingCycle || 'NONE') === cycleFilter;
  });

  const dailyCount = customers.filter(c => c.billingCycle === 'DAILY').length;
  const monthlyCount = customers.filter(c => c.billingCycle === 'MONTHLY').length;
  const specialCount = customers.filter(c => c.isSpecial).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            {isArabic ? 'إدارة العملاء والفئات (يومي / شهري)' : 'Customers & Billing Cycles'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isArabic 
              ? 'تصنيف العملاء إلى حساب يومي أو شهري، وتحديد العملاء المميزين للخصم (الفواتير فوق ٣٠٠ ج.م)' 
              : 'Categorize clients into Daily or Monthly accounts, and configure special customer discounts'}
          </p>
        </div>

        <button
          id="btn-add-customer"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          {isArabic ? 'إضافة عميل وتصنيفه' : 'Add New Customer'}
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-semibold">{isArabic ? 'إجمالي المسجلين' : 'Total Registered'}</div>
            <div className="text-base font-black text-slate-900">{customers.length}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-emerald-800 font-semibold">{isArabic ? 'عملاء يومي' : 'Daily Category'}</div>
            <div className="text-base font-black text-emerald-700">{dailyCount}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-indigo-800 font-semibold">{isArabic ? 'عملاء شهري' : 'Monthly Category'}</div>
            <div className="text-base font-black text-indigo-700">{monthlyCount}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-amber-800 font-semibold">{isArabic ? 'عملاء بخصم خاص' : 'Special Discount'}</div>
            <div className="text-base font-black text-amber-700">{specialCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Category Tabs Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className={`absolute ${isArabic ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'البحث برقم الموبايل (010...)، اسم العميل، أو البطاقة الضريبية...' : 'Search by phone, customer name, or tax ID...'}
            className={`w-full ${isArabic ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setCycleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              cycleFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isArabic ? 'الكل' : 'All'} ({customers.length})
          </button>
          <button
            onClick={() => setCycleFilter('DAILY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              cycleFilter === 'DAILY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isArabic ? 'عملاء يومي' : 'Daily'} ({dailyCount})
          </button>
          <button
            onClick={() => setCycleFilter('MONTHLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              cycleFilter === 'MONTHLY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            {isArabic ? 'عملاء شهري' : 'Monthly'} ({monthlyCount})
          </button>
          <button
            onClick={() => setCycleFilter('NONE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              cycleFilter === 'NONE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isArabic ? 'نقدي عام' : 'Walk-In'}
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-start">{t.customerNameLabel}</th>
                <th className="px-4 py-3 text-start">{t.phoneLabel}</th>
                <th className="px-4 py-3 text-center">{isArabic ? 'فئة الحساب' : 'Category'}</th>
                <th className="px-4 py-3 text-center">{isArabic ? 'الخصم الخاص' : 'Special Discount'}</th>
                <th className="px-4 py-3 text-end">{t.creditLimitLabel}</th>
                <th className="px-4 py-3 text-end">{t.currentBalanceLabel}</th>
                <th className="px-4 py-3 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filtered.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-3 text-start font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        cust.billingCycle === 'DAILY' ? 'bg-emerald-100 text-emerald-800' :
                        cust.billingCycle === 'MONTHLY' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {cust.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{cust.name}</span>
                          {cust.isSpecial && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-md border border-amber-200">
                              ★ {isArabic ? 'مميز' : 'Special'}
                            </span>
                          )}
                        </div>
                        {cust.address && <div className="text-[10px] text-slate-400 font-normal">{cust.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-start font-mono text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.phone || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Category: Daily vs Monthly */}
                  <td className="px-4 py-3 text-center">
                    {cust.billingCycle === 'DAILY' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {isArabic ? 'حساب يومي' : 'Daily'}
                      </span>
                    ) : cust.billingCycle === 'MONTHLY' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <CalendarDays className="w-3 h-3 text-indigo-600" />
                        {isArabic ? 'حساب شهري' : 'Monthly'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                        {isArabic ? 'نقدي عام' : 'Walk-In'}
                      </span>
                    )}
                  </td>

                  {/* Special Discount */}
                  <td className="px-4 py-3 text-center">
                    {cust.isSpecial && (cust.specialDiscountRate || 0) > 0 ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black">
                        <Percent className="w-3 h-3 text-amber-600" />
                        <span>{cust.specialDiscountRate}%</span>
                        <span className="text-[9px] font-normal text-amber-700">({isArabic ? 'فوق ٣٠٠ ج' : '>300'})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-end font-mono text-slate-600">
                    {formatEGP(cust.creditLimit, lang)}
                  </td>

                  {/* Selector 1 target column: clean high-contrast balance */}
                  <td className="px-4 py-3 text-end font-mono font-bold">
                    <span className={`px-2 py-1 rounded-lg text-xs font-extrabold ${
                      cust.currentBalance > 0 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {formatEGP(cust.currentBalance, lang)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                      title={isArabic ? 'تعديل الفئة والخصم' : 'Edit Category & Discount'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isArabic ? 'تعديل' : 'Edit'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                {editingCustomer 
                  ? (isArabic ? 'تعديل فئة العميل والخصم' : 'Edit Customer & Category') 
                  : (isArabic ? 'إضافة عميل وتحديد فئته' : 'Add & Categorize Customer')}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.customerNameLabel} *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={isArabic ? 'مثال: الحاج مصطفى البنا' : 'e.g. Hajj Mostafa El-Banna'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Category: Daily or Monthly */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  {isArabic ? 'تصنيف العميل (يومي أم شهري)' : 'Customer Category (Daily vs. Monthly)'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('DAILY')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                      billingCycle === 'DAILY'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'يومي' : 'Daily'}</span>
                    </div>
                    <div className="text-[10px] opacity-80">{isArabic ? 'حساب يوم بيوم' : 'Day-to-day'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                      billingCycle === 'MONTHLY'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'شهري' : 'Monthly'}</span>
                    </div>
                    <div className="text-[10px] opacity-80">{isArabic ? 'تصفية شهرية' : 'Monthly settle'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('NONE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                      billingCycle === 'NONE'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'نقدي عادي' : 'Walk-In'}</span>
                    </div>
                    <div className="text-[10px] opacity-80">{isArabic ? 'بدون تكرار' : 'Occasional'}</div>
                  </button>
                </div>
              </div>

              {/* Special Customer & Discount Settings */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-xs font-black text-amber-950">
                        {isArabic ? 'تفعيل عميل مميز وخصم خاص' : 'Special Customer Discount'}
                      </div>
                      <div className="text-[10px] text-amber-700">
                        {isArabic ? 'يطبق فقط على الفواتير التي تزيد عن ٣٠٠ ج.م' : 'Strictly applied only if invoice is over 300 EGP'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSpecial}
                    onChange={e => setIsSpecial(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                {isSpecial && (
                  <div className="pt-2 border-t border-amber-200/80">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      {isArabic ? 'نسبة الخصم المخصصة للعميل (%)' : 'Special Discount Percentage (%)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={specialDiscountRate}
                        onChange={e => setSpecialDiscountRate(e.target.value)}
                        className="w-24 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-xs font-bold text-amber-800">%</span>
                      <span className="text-[11px] text-amber-700 font-medium">
                        {isArabic ? '(مثال: 5% أو 10% تظهر في الإيصال والفاتورة)' : '(Appears in receipt and invoice)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.phoneLabel}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0100 123 4567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.nationalOrTaxId}</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={e => setTaxNumber(e.target.value)}
                    placeholder="200-123-456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.customerTypeLabel}</label>
                  <select
                    value={customerType}
                    onChange={e => setCustomerType(e.target.value as Customer['customerType'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="REGULAR">{isArabic ? 'عادي (REGULAR)' : 'Regular'}</option>
                    <option value="VIP">{isArabic ? 'VIP (عميل مميز)' : 'VIP'}</option>
                    <option value="CREDIT">{isArabic ? 'آجل (CREDIT)' : 'Credit'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.creditLimitLabel} (EGP)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'العنوان / الحي' : 'Address / Area'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={isArabic ? 'مدينة نصر، القاهرة' : 'Nasr City, Cairo'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isArabic ? 'حفظ البيانات' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
