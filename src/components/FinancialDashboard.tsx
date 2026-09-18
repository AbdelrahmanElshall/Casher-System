import React, { useState, useMemo } from 'react';
import { 
  BarChart3, DollarSign, TrendingUp, TrendingDown, 
  Receipt, PlusCircle, Printer, FileSpreadsheet,
  Search, Filter, ShoppingBag, ArrowDownRight, ArrowUpRight,
  CreditCard, Smartphone, Wallet, ChevronDown, ChevronUp,
  Package, Calendar, Building2, CheckCircle2, Edit3, HelpCircle
} from 'lucide-react';
import { PosStorageEngine, hasPermission, isSuperAdmin } from '../storage';
import { Expense, Sale, User } from '../types';
import { printThermalReceipt } from '../utils/printer';
import { Language, TRANSLATIONS, formatEGP } from '../utils/i18n';

interface FinancialDashboardProps {
  lang: Language;
}

type TabType = 'SPENT' | 'SOLD' | 'INVOICES' | 'CASHFLOW';
type DateFilterType = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const isArabic = lang === 'ar';

  const currentUser = PosStorageEngine.getCurrentUser();
  const canViewReports = hasPermission(currentUser, 'FIN_VIEW_REPORTS');
  const canManageExpenses = hasPermission(currentUser, 'FIN_MANAGE_EXPENSE');
  const canCreateVoucher = hasPermission(currentUser, 'CREATE_EXPENSE_VOUCHER');

  const [sales, setSales] = useState<Sale[]>(PosStorageEngine.getSales());
  const [expenses, setExpenses] = useState<Expense[]>(PosStorageEngine.getExpenses());
  const products = PosStorageEngine.getProducts();
  const activeSession = PosStorageEngine.getActiveSession();

  // Navigation and filters
  const [activeTab, setActiveTab] = useState<TabType>(canViewReports ? 'SPENT' : 'SPENT');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');

  // Search & sub-filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  const [soldProductSearch, setSoldProductSearch] = useState('');
  const [soldProductSort, setSoldProductSort] = useState<'REVENUE' | 'QTY' | 'PROFIT'>('REVENUE');

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState('ALL');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Expense Modal State (Add & Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expExplanation, setExpExplanation] = useState('');
  const [expPayee, setExpPayee] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(
    isArabic ? 'كهرباء ومرافق وتشغيل المتجر (Utilities & Power)' : 'Utilities & Power'
  );
  const [expPaymentMethod, setExpPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [expNotes, setExpNotes] = useState('');

  const refreshFinancials = () => {
    setSales(PosStorageEngine.getSales());
    setExpenses(PosStorageEngine.getExpenses());
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpTitle('');
    setExpExplanation('');
    setExpPayee('');
    setExpAmount('');
    setExpNotes('');
    setExpCategory(isArabic ? 'كهرباء ومرافق وتشغيل المتجر (Utilities & Power)' : 'Utilities & Power');
    setExpPaymentMethod('CASH');
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpExplanation(exp.explanation || exp.description || '');
    setExpPayee(exp.payee || '');
    setExpAmount(String(exp.amount));
    setExpNotes(exp.description || '');
    setExpCategory(exp.categoryName);
    setExpPaymentMethod((exp.paymentMethod as any) || 'CASH');
    setIsExpenseModalOpen(true);
  };

  const handleApproveReject = (status: 'APPROVED' | 'REJECTED') => {
    if (!editingExpense) return;
    PosStorageEngine.updateExpense(editingExpense.id, {
      status,
      approvedBy: status === 'APPROVED' ? currentUser?.name : undefined,
      rejectedBy: status === 'REJECTED' ? currentUser?.name : undefined,
    }, currentUser);
    setIsExpenseModalOpen(false);
    refreshFinancials();
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (editingExpense) {
      PosStorageEngine.updateExpense(editingExpense.id, {
        title: expTitle,
        explanation: expExplanation,
        payee: expPayee,
        amount: amt,
        categoryName: expCategory,
        paymentMethod: expPaymentMethod,
        description: expNotes || expExplanation,
      }, currentUser);
    } else {
      PosStorageEngine.addExpense({
        expenseNo: `EXP-EG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        branchId: currentUser.branchId || 'br-nasr-city',
        categoryId: 'cat-ops',
        categoryName: expCategory,
        userId: currentUser.id,
        userName: currentUser.name,
        cashSessionId: activeSession?.id,
        amount: amt,
        paymentMethod: expPaymentMethod,
        title: expTitle,
        explanation: expExplanation,
        payee: expPayee,
        description: expNotes || expExplanation || (isArabic ? 'سند صرف نقدي' : 'Store expense voucher'),
        expenseDate: new Date().toISOString().split('T')[0],
      }, currentUser);
    }

    setIsExpenseModalOpen(false);
    refreshFinancials();
  };

  // Date Filtering Logic
  const filterByDate = (dateStr: string): boolean => {
    if (dateFilter === 'ALL') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'TODAY') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return itemDate >= weekAgo;
    }
    if (dateFilter === 'MONTH') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => filterByDate(s.createdAt));
  }, [sales, dateFilter]);

  const filteredExpenses = useMemo(() => {
    let baseExpenses = expenses;
    if (!canViewReports && !canManageExpenses) {
      baseExpenses = expenses.filter(e => e.userId === currentUser.id);
    }
    return baseExpenses.filter(e => filterByDate(e.createdAt || e.expenseDate));
  }, [expenses, dateFilter, canViewReports, canManageExpenses, currentUser.id]);

  // Overall Financial KPIs
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  }, [filteredSales]);

  const totalCostOfGoods = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    }, 0);
  }, [filteredSales]);

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const netProfit = grossProfit - totalOperatingExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const summary = {
      CASH: 0,
      CARD: 0,
      INSTAPAY: 0,
      WALLET: 0,
      CUSTOMER_CREDIT: 0,
    };
    filteredSales.forEach(s => {
      const m = s.paymentMethod as keyof typeof summary;
      if (summary[m] !== undefined) {
        summary[m] += s.grandTotal;
      } else {
        summary.CASH += s.grandTotal;
      }
    });
    return summary;
  }, [filteredSales]);

  const cashExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => e.paymentMethod === 'CASH')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const netCashInDrawer = paymentBreakdown.CASH - cashExpensesTotal;

  // 1. "What Money Spent On" - Aggregated by category
  const expenseCategories = useMemo(() => {
    const map = new Map<string, { category: string; total: number; count: number }>();
    filteredExpenses.forEach(e => {
      const cat = e.categoryName || (isArabic ? 'مصروفات عامة' : 'General Expenses');
      const existing = map.get(cat) || { category: cat, total: 0, count: 0 };
      existing.total += e.amount;
      existing.count += 1;
      map.set(cat, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredExpenses, isArabic]);

  const displayedExpenses = useMemo(() => {
    return filteredExpenses.filter(e => {
      const matchCat = expenseCategoryFilter === 'ALL' || e.categoryName === expenseCategoryFilter;
      const q = expenseSearch.toLowerCase();
      const matchQuery = 
        e.title.toLowerCase().includes(q) || 
        e.expenseNo.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.userName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [filteredExpenses, expenseCategoryFilter, expenseSearch]);

  // 2. "What Was Sold" - Itemized sales analysis
  const itemizedSoldProducts = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      productName: string;
      categoryName: string;
      sku: string;
      unit: string;
      unitsSold: number;
      unitPrice: number;
      unitCost: number;
      grossRevenue: number;
      totalCost: number;
      grossProfit: number;
      profitMargin: number;
    }>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const prodMatch = products.find(p => p.id === item.productId);
        const key = item.productId;
        const lineRev = item.unitPrice * item.quantity - (item.discountAmount || 0);
        const lineCost = item.unitCost * item.quantity;
        const lineProfit = lineRev - lineCost;

        if (map.has(key)) {
          const entry = map.get(key)!;
          entry.unitsSold += item.quantity;
          entry.grossRevenue += lineRev;
          entry.totalCost += lineCost;
          entry.grossProfit += lineProfit;
          entry.profitMargin = entry.grossRevenue > 0 ? (entry.grossProfit / entry.grossRevenue) * 100 : 0;
        } else {
          map.set(key, {
            productId: item.productId,
            productName: prodMatch ? (isArabic && prodMatch.nameAr ? prodMatch.nameAr : prodMatch.name) : item.productName,
            categoryName: prodMatch?.categoryName || (isArabic ? 'قسم عام' : 'General'),
            sku: prodMatch?.sku || 'SKU',
            unit: item.unit,
            unitsSold: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            grossRevenue: lineRev,
            totalCost: lineCost,
            grossProfit: lineProfit,
            profitMargin: lineRev > 0 ? (lineProfit / lineRev) * 100 : 0,
          });
        }
      });
    });

    const list = Array.from(map.values());
    if (soldProductSort === 'REVENUE') {
      list.sort((a, b) => b.grossRevenue - a.grossRevenue);
    } else if (soldProductSort === 'QTY') {
      list.sort((a, b) => b.unitsSold - a.unitsSold);
    } else if (soldProductSort === 'PROFIT') {
      list.sort((a, b) => b.grossProfit - a.grossProfit);
    }
    return list;
  }, [filteredSales, products, soldProductSort, isArabic]);

  const displayedSoldProducts = useMemo(() => {
    if (!soldProductSearch.trim()) return itemizedSoldProducts;
    const q = soldProductSearch.toLowerCase();
    return itemizedSoldProducts.filter(p => 
      p.productName.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.categoryName.toLowerCase().includes(q)
    );
  }, [itemizedSoldProducts, soldProductSearch]);

  // 3. Invoices Explorer
  const displayedInvoices = useMemo(() => {
    return filteredSales.filter(s => {
      const matchPayment = invoicePaymentFilter === 'ALL' || s.paymentMethod === invoicePaymentFilter;
      const q = invoiceSearch.toLowerCase();
      const matchQuery = 
        s.invoiceNo.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        s.cashierName.toLowerCase().includes(q);
      return matchPayment && matchQuery;
    });
  }, [filteredSales, invoicePaymentFilter, invoiceSearch]);

  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 overflow-y-auto min-h-0">
      {/* Top Header & Period Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            {t.financeTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.financeSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter Buttons */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center text-xs font-semibold">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'ALL' 
                  ? 'bg-slate-900 text-white font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterAllTime}
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'TODAY' 
                  ? 'bg-slate-900 text-white font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterToday}
            </button>
            <button
              onClick={() => setDateFilter('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'WEEK' 
                  ? 'bg-slate-900 text-white font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterThisWeek}
            </button>
            <button
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'MONTH' 
                  ? 'bg-slate-900 text-white font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterThisMonth}
            </button>
          </div>

          {/* Record Expense Button */}
          <button
            id="btn-add-expense"
            onClick={openAddExpenseModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-rose-100" />
            {t.recordExpenseBtn}
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      {canViewReports && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: What Was Sold Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>{t.totalSoldRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">
            {formatEGP(totalRevenue, lang)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">{filteredSales.length} {isArabic ? 'فاتورة' : 'sales'}</span>
            <span>•</span>
            <span>{isArabic ? 'متوسط السلة:' : 'Avg basket:'} {formatEGP(filteredSales.length ? totalRevenue / filteredSales.length : 0, lang)}</span>
          </div>
        </div>

        {/* Card 2: What Money Spent On Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>{t.totalSpent}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-rose-700">
            {formatEGP(totalOperatingExpenses, lang)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-rose-700">{filteredExpenses.length} {t.vouchersCount}</span>
            <span>•</span>
            <span>{isArabic ? 'تكلفة البضاعة المباعة:' : 'COGS:'} {formatEGP(totalCostOfGoods, lang)}</span>
          </div>
        </div>

        {/* Card 3: Net Operating Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>{t.netProfitTitle}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${netProfit >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
            {formatEGP(netProfit, lang)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-indigo-700">{isArabic ? 'هامش الربح:' : 'Margin:'} {profitMarginPercent}%</span>
            <span>•</span>
            <span>{isArabic ? 'مجمل الربح:' : 'Gross:'} {formatEGP(grossProfit, lang)}</span>
          </div>
        </div>

        {/* Card 4: Net Cash in Drawer & Electronic Flow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>{t.netDrawerCashBalance}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-900">
            {formatEGP(netCashInDrawer, lang)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {isArabic ? 'إلكتروني:' : 'Digital:'} {formatEGP(totalRevenue - paymentBreakdown.CASH, lang)} (InstaPay/Cards)
          </div>
        </div>
      </div>
      )}

      {/* Main Navigation Tabs for Detailed Deep Dive */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('SPENT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SPENT'
              ? 'bg-white text-rose-700 border-t-2 border-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-600" />
          {t.tabMoneySpent}
          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono">
            {filteredExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SOLD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SOLD'
              ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          {t.tabWhatSold}
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
            {itemizedSoldProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'INVOICES'
              ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-600" />
          {t.tabInvoicesExplorer}
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono">
            {filteredSales.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CASHFLOW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CASHFLOW'
              ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-600" />
          {t.tabCashFlow}
        </button>
      </div>

      {/* TAB 1: WHAT MONEY WAS SPENT ON (EXPENSES & OUTFLOWS) */}
      {activeTab === 'SPENT' && (
        <div className="space-y-6">
          {/* Spending Categories Breakdown Grid */}
          {canViewReports && (
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-rose-600" />
              {t.categoryBreakdown}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {expenseCategories.map(cat => {
                const percent = totalOperatingExpenses > 0 
                  ? ((cat.total / totalOperatingExpenses) * 100).toFixed(1) 
                  : '0.0';
                return (
                  <div key={cat.category} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{cat.category}</span>
                      <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                        {percent}%
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-rose-700 mt-2">
                      {formatEGP(cat.total, lang)}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div 
                        className="bg-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {cat.count} {isArabic ? 'سند صرف' : 'vouchers'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Itemized Expenses Ledger with Search & Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={e => setExpenseSearch(e.target.value)}
                    placeholder={t.searchExpensePlaceholder}
                    className="w-full text-xs pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <select
                  value={expenseCategoryFilter}
                  onChange={e => setExpenseCategoryFilter(e.target.value)}
                  className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="ALL">{t.allCategories}</option>
                  {expenseCategories.map(c => (
                    <option key={c.category} value={c.category}>{c.category}</option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-bold text-slate-500">
                {displayedExpenses.length} {t.vouchersCount} • {isArabic ? 'إجمالي المعروض:' : 'Displayed Total:'} <span className="font-mono text-rose-700 font-black">{formatEGP(displayedExpenses.reduce((a, b) => a + b.amount, 0), lang)}</span>
              </span>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">{isArabic ? 'رقم السند' : 'Voucher #'}</th>
                    <th className="py-3 px-4">{isArabic ? 'بيان الغرض / الصرف (في ماذا صُرف؟)' : 'Expense Purpose & Explanation'}</th>
                    <th className="py-3 px-4">{isArabic ? 'البند / التصنيف' : 'Category'}</th>
                    <th className="py-3 px-4">{isArabic ? 'طريقة الصرف' : 'Payment'}</th>
                    <th className="py-3 px-4">{isArabic ? 'المسؤول' : 'Cashier'}</th>
                    <th className="py-3 px-4">{isArabic ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 px-4 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-end">{isArabic ? 'المبلغ (ج.م)' : 'Amount (EGP)'}</th>
                    <th className="py-3 px-4 text-center">{isArabic ? 'تعديل وتوضيح' : 'Edit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {exp.expenseNo}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{exp.title}</div>
                        {(exp.explanation || exp.description) && (
                          <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-100/80 rounded px-1.5 py-0.5 mt-1 font-medium inline-block">
                            <span className="font-bold text-rose-900">{isArabic ? 'المبرر:' : 'Reason:'} </span>
                            {exp.explanation || exp.description}
                          </div>
                        )}
                        {exp.payee && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isArabic ? 'الجهة المستلمة:' : 'Payee:'} <span className="font-semibold text-slate-700">{exp.payee}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {exp.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px]">
                          {exp.paymentMethod === 'CASH' ? (isArabic ? 'نقدية الدرج' : 'Drawer Cash') : exp.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {exp.userName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {exp.expenseDate || new Date(exp.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${exp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : exp.status === 'REJECTED' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
                          {exp.status === 'APPROVED' ? (isArabic ? 'مُعتمد' : 'Approved') : exp.status === 'REJECTED' ? (isArabic ? 'مرفوض' : 'Rejected') : (isArabic ? 'قيد المراجعة' : 'Pending')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-rose-700 text-sm">
                        - {formatEGP(exp.amount, lang)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openEditExpenseModal(exp)}
                          title={isArabic ? 'تعديل سند الصرف وتوضيح في ماذا صُرفت الأموال' : 'Edit voucher and clarify expense purpose'}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayedExpenses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        {isArabic ? 'لا توجد سندات صرف مطابقة لخيارات البحث' : 'No expenses match the current filter criteria'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHAT WAS SOLD (ITEMIZED PRODUCTS & PERFORMANCE) */}
      {activeTab === 'SOLD' && (
        <div className="space-y-6">
          {/* Top Controls: Search & Sorting */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={soldProductSearch}
                onChange={e => setSoldProductSearch(e.target.value)}
                placeholder={t.searchProductSalesPlaceholder}
                className="w-full text-xs pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">{isArabic ? 'الترتيب حسب:' : 'Sort by:'}</span>
              <button
                onClick={() => setSoldProductSort('REVENUE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  soldProductSort === 'REVENUE' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isArabic ? 'الأعلى إيراداً' : 'Highest Revenue'}
              </button>
              <button
                onClick={() => setSoldProductSort('QTY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  soldProductSort === 'QTY' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isArabic ? 'الكمية المباعة' : 'Most Units Sold'}
              </button>
              <button
                onClick={() => setSoldProductSort('PROFIT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  soldProductSort === 'PROFIT' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isArabic ? 'الأعلى ربحاً' : 'Most Profit'}
              </button>
            </div>
          </div>

          {/* Product Sales Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                {t.productSalesPerformance}
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {displayedSoldProducts.length} {isArabic ? 'صنف مباع' : 'unique products sold'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">{isArabic ? 'الصنف' : 'Product Item'}</th>
                    <th className="py-3 px-4">{isArabic ? 'القسم' : 'Category'}</th>
                    <th className="py-3 px-4 text-center">{t.unitsSold}</th>
                    <th className="py-3 px-4 text-end">{t.unitSellingPrice}</th>
                    <th className="py-3 px-4 text-end">{t.totalRevenueCol}</th>
                    <th className="py-3 px-4 text-end">{t.totalCostCol}</th>
                    <th className="py-3 px-4 text-end">{t.grossProfitCol}</th>
                    <th className="py-3 px-4 text-center">{t.marginCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedSoldProducts.map(prod => (
                    <tr key={prod.productId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">{prod.productName}</div>
                        <span className="font-mono text-[10px] text-slate-400">{prod.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {prod.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-slate-800 text-xs">
                        {prod.unitsSold} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-end font-mono text-slate-600">
                        {formatEGP(prod.unitPrice, lang)}
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-emerald-800 text-xs">
                        {formatEGP(prod.grossRevenue, lang)}
                      </td>
                      <td className="py-3 px-4 text-end font-mono text-slate-500">
                        {formatEGP(prod.totalCost, lang)}
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-indigo-700 text-xs">
                        {formatEGP(prod.grossProfit, lang)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold font-mono text-[10px]">
                          {prod.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayedSoldProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {isArabic ? 'لم يتم تسجيل أي مبيعات خلال الفترة المحددة' : 'No sales transactions recorded during this period'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES EXPLORER & ITEM BASKET BREAKDOWN */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          {/* Invoices Search & Method Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                placeholder={t.searchInvoicePlaceholder}
                className="w-full text-xs pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">{isArabic ? 'وسيلة الدفع:' : 'Payment:'}</span>
              <select
                value={invoicePaymentFilter}
                onChange={e => setInvoicePaymentFilter(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">{t.allPaymentMethods}</option>
                <option value="CASH">{isArabic ? 'كاش / نقدي' : 'Cash'}</option>
                <option value="CARD">{isArabic ? 'بطاقة ميزة / فيزا' : 'Bank Card'}</option>
                <option value="INSTAPAY">{isArabic ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                <option value="WALLET">{isArabic ? 'محفظة إلكترونية (فودافون كاش)' : 'Mobile Wallet'}</option>
                <option value="CUSTOMER_CREDIT">{isArabic ? 'حساب آجل (عملاء معتمدين)' : 'Customer Credit'}</option>
              </select>
            </div>
          </div>

          {/* Invoices List with Expandable Item Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                {t.recentSalesLedger}
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {displayedInvoices.length} {isArabic ? 'فاتورة' : 'Invoices'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {displayedInvoices.map(invoice => {
                const isExpanded = expandedInvoiceId === invoice.id;
                return (
                  <div key={invoice.id} className="transition-colors">
                    {/* Invoice Summary Header Row */}
                    <div 
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : invoice.id)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <button className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs font-mono text-slate-900">{invoice.invoiceNo}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {invoice.paymentMethod}
                            </span>
                            {invoice.customerName && (
                              <span className="text-xs font-semibold text-slate-600">({invoice.customerName})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>{new Date(invoice.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}</span>
                            <span>•</span>
                            <span>{invoice.cashierName}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-600">{invoice.items.length} {t.invoiceItemsCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-end">
                          <div className="text-base font-black font-mono text-slate-900">
                            {formatEGP(invoice.grandTotal, lang)}
                          </div>
                          {invoice.discountAmount > 0 && (
                            <div className="text-[10px] text-rose-600 font-mono">
                              {isArabic ? 'خصم:' : 'Disc:'} -{formatEGP(invoice.discountAmount, lang)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            printThermalReceipt(invoice, '80mm', lang);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          title={t.reprintReceipt}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.reprintReceipt}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Itemized Basket Items */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                          {isArabic ? 'الأصناف المباعة بالفاتورة التفصيلية:' : 'Itemized Basket Contents:'}
                        </h4>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left rtl:text-right text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3">{isArabic ? 'اسم الصنف' : 'Item Name'}</th>
                                <th className="py-2 px-3 text-center">{isArabic ? 'الكمية' : 'Quantity'}</th>
                                <th className="py-2 px-3 text-end">{isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="py-2 px-3 text-end">{isArabic ? 'الإجمالي' : 'Line Total'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoice.items.map((it, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 px-3 font-semibold text-slate-800">
                                    {it.productName}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                                    {it.quantity} {it.unit}
                                  </td>
                                  <td className="py-2 px-3 text-end font-mono text-slate-600">
                                    {formatEGP(it.unitPrice, lang)}
                                  </td>
                                  <td className="py-2 px-3 text-end font-mono font-bold text-slate-900">
                                    {formatEGP(it.unitPrice * it.quantity - (it.discountAmount || 0), lang)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASH FLOW & CHANNELS STATEMENT */}
      {activeTab === 'CASHFLOW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cash Movement Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                {isArabic ? 'كشف حركة نقدية الدرج (الكاش)' : 'Cash Drawer Reconciliation'}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">{t.cashDrawerInflow}</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    + {formatEGP(paymentBreakdown.CASH, lang)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">{t.cashDrawerOutflow}</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    - {formatEGP(cashExpensesTotal, lang)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 text-sm font-black text-slate-900">
                  <span>{t.netDrawerCashBalance}</span>
                  <span className="font-mono text-emerald-800 text-base">
                    {formatEGP(netCashInDrawer, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Electronic & Digital Settlement Channels */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                {t.electronicSettlements}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    {isArabic ? 'إنستاباي فوري (InstaPay)' : 'InstaPay Direct'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatEGP(paymentBreakdown.INSTAPAY, lang)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-semibold">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    {isArabic ? 'بطاقات بنكية وميزة (Meeza / Visa)' : 'Meeza & Bank Cards'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatEGP(paymentBreakdown.CARD, lang)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                    {isArabic ? 'محافظ إلكترونية (فودافون كاش وغيرها)' : 'Mobile Wallets'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatEGP(paymentBreakdown.WALLET, lang)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    {isArabic ? 'حسابات العملاء الآجلة (Credit)' : 'Corporate Receivables'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatEGP(paymentBreakdown.CUSTOMER_CREDIT, lang)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveExpense} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-rose-400" />
                  {editingExpense 
                    ? (isArabic ? 'تعديل سند الصرف وتوضيح مبرر المبلغ' : 'Edit Expense Voucher & Explanation')
                    : (isArabic ? 'تسجيل سند صرف مالي جديد وتوضيح الغرض' : 'Record New Expense Voucher & Purpose')
                  }
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isArabic ? 'توثيق دقيق لأين صُرفت الأموال ولصالح مَن وبأي وسيلة دفع' : 'Accurately document what money was spent on, payee, and payment method'}
                </p>
              </div>
              {editingExpense && (
                <span className="font-mono text-xs font-bold bg-slate-800 text-rose-300 px-2 py-1 rounded-lg border border-slate-700">
                  {editingExpense.expenseNo}
                </span>
              )}
            </div>

            <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  {t.expenseTitleLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder={isArabic ? 'مثال: رولات فواتير حرارية، صيانة ثلاجة العرض، فواتير كهرباء' : 'e.g. POS thermal rolls, display fridge maintenance, electricity'}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Crucial: What was the money spent on? (Explanation) */}
              <div>
                <label className="text-xs font-bold text-rose-900 block mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isArabic ? 'توضيح سبب ومبرر الصرف (في ماذا صُرفت الأموال؟) *' : 'Explain what the money was spent on and why *'}</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={expExplanation}
                  onChange={e => setExpExplanation(e.target.value)}
                  placeholder={isArabic ? 'اشرح بالتفصيل في ماذا أُنفقت هذه الأموال (السبب، الاحتياج، والكمية إن وجدت)...' : 'Explain in detail what this money was used for and why...'}
                  className="w-full text-xs p-2.5 bg-rose-50/40 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'الجهة المستلمة / المورد' : 'Payee / Vendor'}
                  </label>
                  <input
                    type="text"
                    value={expPayee}
                    onChange={e => setExpPayee(e.target.value)}
                    placeholder={isArabic ? 'اسم المستلم، المحل، أو الفني' : 'Payee name or company'}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.expenseCategoryLabel}
                  </label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value={isArabic ? 'كهرباء ومرافق وتشغيل المتجر (Utilities & Power)' : 'Utilities & Power'}>
                      {isArabic ? 'كهرباء ومرافق وتشغيل المتجر (Utilities & Power)' : 'Utilities & Power'}
                    </option>
                    <option value={isArabic ? 'أكياس وتعبئة وتغليف مطبوعة (Packaging & Bags)' : 'Packaging & Bags'}>
                      {isArabic ? 'أكياس وتعبئة وتغليف مطبوعة (Packaging & Bags)' : 'Packaging & Bags'}
                    </option>
                    <option value={isArabic ? 'رولات ورق ومطبوعات الكاشير (POS Supplies)' : 'POS Supplies & Paper Rolls'}>
                      {isArabic ? 'رولات ورق ومطبوعات الكاشير (POS Supplies)' : 'POS Supplies & Paper Rolls'}
                    </option>
                    <option value={isArabic ? 'أدوات نظافة ومطهرات المتجر (Cleaning & Hygiene)' : 'Cleaning & Hygiene'}>
                      {isArabic ? 'أدوات نظافة ومطهرات المتجر (Cleaning & Hygiene)' : 'Cleaning & Hygiene'}
                    </option>
                    <option value={isArabic ? 'وقود ومصروفات ديليفري (Delivery & Fuel)' : 'Delivery & Fuel'}>
                      {isArabic ? 'وقود ومصروفات ديليفري (Delivery & Fuel)' : 'Delivery & Fuel'}
                    </option>
                    <option value={isArabic ? 'وجبات وضيافة وشاي العاملين (Staff Hospitality)' : 'Staff Hospitality'}>
                      {isArabic ? 'وجبات وضيافة وشاي العاملين (Staff Hospitality)' : 'Staff Hospitality'}
                    </option>
                    <option value={isArabic ? 'صيانة وإصلاحات معدات المتجر (Store Maintenance)' : 'Store Maintenance'}>
                      {isArabic ? 'صيانة وإصلاحات معدات المتجر (Store Maintenance)' : 'Store Maintenance'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.payment}
                  </label>
                  <select
                    value={expPaymentMethod}
                    onChange={e => setExpPaymentMethod(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="CASH">{isArabic ? 'نقدية الخزينة / الدرج' : 'Cash Drawer'}</option>
                    <option value="CARD">{isArabic ? 'بطاقة بنكية' : 'Bank Card'}</option>
                    <option value="BANK_TRANSFER">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    {t.expenseAmountLabel} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm font-black font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
                </label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder={isArabic ? 'أي ملاحظات أو رقم فاتورة المورد الورقية' : 'Additional notes or vendor paper bill #'}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
              <div className="flex gap-2">
                {editingExpense && editingExpense.status === 'PENDING_APPROVAL' && canManageExpenses && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApproveReject('APPROVED')}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
                    >
                      {isArabic ? 'اعتماد وصرف' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveReject('REJECTED')}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
                    >
                      {isArabic ? 'رفض' : 'Reject'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {editingExpense 
                    ? (isArabic ? 'حفظ التعديلات' : 'Save Changes')
                    : t.save
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
