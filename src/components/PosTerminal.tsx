import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, Search, Plus, Minus, Trash2, CreditCard, Banknote, 
  Wallet, Pause, Printer, AlertCircle, CheckCircle2,
  RefreshCw, X, Send, Smartphone, FileText
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, CashSession, Customer, Branch, Category } from '../types';
import { PosStorageEngine } from '../storage';
import { printThermalReceipt } from '../utils/printer';
import { Language, TRANSLATIONS, formatEGP } from '../utils/i18n';

interface PosTerminalProps {
  lang: Language;
  selectedBranch: Branch;
  onShiftModalOpen: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ lang, selectedBranch, onShiftModalOpen }) => {
  const t = TRANSLATIONS[lang];
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [applySpecialDiscount, setApplySpecialDiscount] = useState<boolean>(true);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(10);
  const [heldCarts, setHeldCarts] = useState<{ id: string; time: string; items: CartItem[]; customer: Customer | null }[]>([]);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [tenderMethod, setTenderMethod] = useState<PaymentMethod>('CASH');
  const [tenderPaid, setTenderPaid] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalogAndSession();
    barcodeInputRef.current?.focus();
  }, []);

  const loadCatalogAndSession = () => {
    const prods = PosStorageEngine.getProducts();
    const custs = PosStorageEngine.getCustomers();
    const cats = PosStorageEngine.getCategories();
    setProducts(prods);
    setCustomers(custs);
    setCategoriesList(cats);
    if (custs.length > 0 && !selectedCustomer) {
      setSelectedCustomer(custs[0]);
    }
    setActiveSession(PosStorageEngine.getActiveSession());
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Barcode scanning & scale barcode parser (Embedded PLU & weight)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const scannedBarcode = barcodeInput.trim();
    let parsedWeight: number | null = null;

    // Egyptian scale barcode: starts with 20 or 21 (length 13 digits)
    if ((scannedBarcode.startsWith('20') || scannedBarcode.startsWith('21')) && scannedBarcode.length === 13) {
      const weightGrams = parseInt(scannedBarcode.substring(7, 12), 10);
      parsedWeight = weightGrams / 1000;
      const matched = products.find(p => p.barcode.startsWith(scannedBarcode.substring(0, 7)));
      if (matched) {
        addToCart(matched, parsedWeight);
        setBarcodeInput('');
        showToast(`${t.scaleWeightParsed}: ${parsedWeight.toFixed(3)} Kg`);
        return;
      }
    }

    const found = PosStorageEngine.getProductByBarcode(scannedBarcode);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      showToast(lang === 'ar' ? `لم يتم العثور على باركود: "${scannedBarcode}"` : `Unrecognized Barcode: "${scannedBarcode}"`, 'error');
      setBarcodeInput('');
    }
  };

  const addToCart = (product: Product, customQty: number = 1) => {
    if (!activeSession || activeSession.status !== 'OPEN') {
      showToast(lang === 'ar' ? 'الوردية مغلقة. يرجى فتح الوردية أولاً للمتابعة.' : 'Shift is closed. Please open a cash session first.', 'error');
      onShiftModalOpen();
      return;
    }

    if (!product.allowNegativeStock && product.currentStock <= 0) {
      showToast(`${t.outOfStock}: ${lang === 'ar' ? (product.nameAr || product.name) : product.name}`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const updatedQty = Number((existing.quantity + customQty).toFixed(3));
        const lineTotal = Number((existing.unitPrice * updatedQty - existing.discountAmount).toFixed(2));

        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: updatedQty, taxAmount: 0, lineTotal } 
            : item
        );
      } else {
        const lineTotal = Number((product.sellingPrice * customQty).toFixed(2));
        return [
          ...prev, 
          {
            product,
            quantity: customQty,
            unitPrice: product.sellingPrice,
            unitCost: product.costPrice,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            lineTotal,
          }
        ];
      }
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const lineTotal = Number((item.unitPrice * newQty - item.discountAmount).toFixed(2));
        return { ...item, quantity: newQty, taxAmount: 0, lineTotal };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    barcodeInputRef.current?.focus();
  };

  const holdCurrentSale = () => {
    if (cart.length === 0) return;
    setHeldCarts(prev => [
      ...prev,
      {
        id: `hold-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        customer: selectedCustomer
      }
    ]);
    setCart([]);
    showToast(lang === 'ar' ? 'تم تعليق الفاتورة بنجاح في قائمة الانتظار.' : 'Sale parked in Held queue.');
  };

  const resumeHeldSale = (heldId: string) => {
    const held = heldCarts.find(h => h.id === heldId);
    if (!held) return;
    setCart(held.items);
    if (held.customer) setSelectedCustomer(held.customer);
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    showToast(lang === 'ar' ? 'تم استعادة الفاتورة المعلقة.' : 'Held cart restored.');
  };

  // Cart financial calculations (No tax calculated on invoice/receipt)
  const subtotal = cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const cartItemDiscounts = cart.reduce((acc, i) => acc + i.discountAmount, 0);

  // STRICT USER CONSTRAINT: "can not add discount except invoice over 300"
  const isEligibleForDiscount = subtotal > 300;
  const isSpecialCustomer = Boolean(selectedCustomer?.isSpecial);
  
  const activeDiscountRate = (isEligibleForDiscount && applySpecialDiscount && (isSpecialCustomer || customDiscountPercent > 0))
    ? customDiscountPercent
    : 0;

  const specialDiscountAmount = isEligibleForDiscount
    ? Number(((subtotal * activeDiscountRate) / 100).toFixed(2))
    : 0;

  const totalDiscount = Number((cartItemDiscounts + specialDiscountAmount).toFixed(2));
  const grandTotal = Number(Math.max(0, subtotal - totalDiscount).toFixed(2));

  const openTender = () => {
    if (cart.length === 0) {
      showToast(t.emptyCartPrompt, 'error');
      return;
    }
    setTenderPaid(String(grandTotal));
    setIsTenderModalOpen(true);
  };

  const finalizeCheckout = () => {
    const paidNum = parseFloat(tenderPaid) || 0;
    if (paidNum < grandTotal && tenderMethod === 'CASH') {
      showToast(lang === 'ar' ? 'المبلغ المسدد أقل من إجمالي الفاتورة.' : 'Paid amount is less than total invoice amount', 'error');
      return;
    }

    const result = PosStorageEngine.processSaleTransaction({
      cart,
      paymentMethod: tenderMethod,
      paidAmount: paidNum,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      warehouseId: 'wh-main',
      cashierId: activeSession?.cashierId || 'usr-admin',
      cashierName: activeSession?.cashierName || 'Dr. Ahmed El-Shennawy',
      notes: `POS Checkout (${tenderMethod})`,
      specialCustomerDiscount: specialDiscountAmount > 0 ? specialDiscountAmount : undefined,
      discountReason: specialDiscountAmount > 0
        ? (lang === 'ar' ? `خصم عميل مميز (${activeDiscountRate}%)` : `Special Customer Discount (${activeDiscountRate}%)`)
        : undefined,
    });

    if (result.success && result.sale) {
      setIsTenderModalOpen(false);
      printThermalReceipt(result.sale, '80mm', lang);
      setCart([]);
      loadCatalogAndSession();
      showToast(lang === 'ar' ? `تم إتمام الفاتورة ${result.sale.invoiceNo} وطباعة الإيصال!` : `Sale ${result.sale.invoiceNo} completed successfully!`);
      barcodeInputRef.current?.focus();
    } else {
      showToast(result.error || 'Failed to complete transaction', 'error');
    }
  };

  // Comprehensive list of ALL Categories in stock and configured in the system
  const allCategoryPills = React.useMemo(() => {
    const productCategoryMap = new Map<string, number>();
    products.forEach(p => {
      const cName = p.categoryName?.trim() || 'General';
      productCategoryMap.set(cName, (productCategoryMap.get(cName) || 0) + 1);
    });

    const pills: {
      id: string;
      displayName: string;
      displayNameAr: string;
      count: number;
    }[] = [];

    const accountedProductCatNames = new Set<string>();

    // 1. Process all categories from categoriesList
    categoriesList.forEach(cat => {
      let count = 0;
      products.forEach(p => {
        const pCat = (p.categoryName || '').toLowerCase().trim();
        const cName = cat.name.toLowerCase().trim();
        const cNameAr = (cat.nameAr || '').toLowerCase().trim();
        const cFirstWord = cName.split(' ')[0];
        const cArFirstWord = cNameAr ? cNameAr.split(' ')[0] : '';

        const matches = 
          p.categoryId === cat.id ||
          pCat === cName ||
          pCat === cNameAr ||
          (cFirstWord.length > 2 && pCat.includes(cFirstWord)) ||
          (cArFirstWord.length > 2 && pCat.includes(cArFirstWord)) ||
          cName.includes(pCat);

        if (matches) {
          count++;
          if (p.categoryName) {
            accountedProductCatNames.add(p.categoryName.trim());
          }
        }
      });

      pills.push({
        id: cat.id,
        displayName: cat.name,
        displayNameAr: cat.nameAr || cat.name,
        count,
      });
    });

    // 2. Discover any additional product category in stock not matched above
    productCategoryMap.forEach((count, rawName) => {
      if (!accountedProductCatNames.has(rawName)) {
        let enName = rawName;
        let arName = rawName;
        if (rawName.includes('(') && rawName.includes(')')) {
          const parts = rawName.split('(');
          enName = parts[0].trim();
          arName = parts[1].replace(')', '').trim();
        }
        pills.push({
          id: rawName,
          displayName: enName,
          displayNameAr: arName,
          count,
        });
      }
    });

    return [
      {
        id: 'ALL',
        displayName: t.allCategories,
        displayNameAr: 'جميع الأصناف والأقسام',
        count: products.length,
      },
      ...pills,
    ];
  }, [categoriesList, products, t.allCategories]);

  const filteredProducts = products.filter(p => {
    let matchesCat = selectedCategory === 'ALL';
    if (!matchesCat) {
      const catObj = categoriesList.find(c => c.id === selectedCategory);
      if (catObj) {
        const pCat = (p.categoryName || '').toLowerCase().trim();
        const cName = catObj.name.toLowerCase().trim();
        const cNameAr = (catObj.nameAr || '').toLowerCase().trim();
        const cFirstWord = cName.split(' ')[0];
        const cArFirstWord = cNameAr ? cNameAr.split(' ')[0] : '';

        matchesCat = 
          p.categoryId === catObj.id ||
          pCat === cName ||
          pCat === cNameAr ||
          (cFirstWord.length > 2 && pCat.includes(cFirstWord)) ||
          (cArFirstWord.length > 2 && pCat.includes(cArFirstWord)) ||
          cName.includes(pCat);
      } else {
        matchesCat = p.categoryName === selectedCategory || p.categoryId === selectedCategory;
      }
    }

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(query) || 
      (p.nameAr && p.nameAr.includes(searchQuery)) ||
      p.barcode.includes(searchQuery) || 
      p.sku.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden font-sans">
      {/* LEFT / CENTER: PRODUCT DISCOVERY & CATALOG */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-e border-slate-200">
        {/* Top Control Bar: Barcode Scanner Input & Quick Filters */}
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-3 mb-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className={`absolute ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder={t.scanBarcodePlaceholder}
              className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400`}
            />
          </form>

          <div className="w-64 relative">
            <Search className={`absolute ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchProductPlaceholder}
              className={`w-full ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
            />
          </div>

          <button 
            onClick={loadCatalogAndSession} 
            title={lang === 'ar' ? 'تحديث الدليل والوردية' : 'Reload catalog'}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Pills - Showing ALL Categories in Stock */}
        <div 
          id="pos-category-filter-bar" 
          className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent shrink-0"
        >
          {allCategoryPills.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const label = lang === 'ar' ? (cat.displayNameAr || cat.displayName) : cat.displayName;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer select-none border ${
                  isSelected 
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20 scale-[1.02]' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200 shadow-2xs'
                }`}
              >
                <span>{label}</span>
                <span 
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                    isSelected 
                      ? 'bg-emerald-800 text-emerald-100' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300 my-auto">
              <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">
                {lang === 'ar' ? 'لا توجد أصناف تابعة لهذا القسم حالياً' : 'No products found in this category'}
              </p>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="mt-3 px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'عرض جميع الأصناف' : 'Show All Products'}
              </button>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const isLow = prod.currentStock <= prod.minStock && prod.currentStock > 0;
              const isOut = prod.currentStock <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className={`bg-white border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-emerald-500 active:scale-[0.98] select-none ${
                    isOut ? 'opacity-60 bg-slate-50 border-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {prod.categoryName?.split('(')[0] || 'General'}
                      </span>
                      {isOut ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">{t.outOfStockStatus}</span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">{t.lowStock} ({prod.currentStock})</span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">{prod.currentStock} {prod.unit}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug mb-1">
                      {lang === 'ar' ? (prod.nameAr || prod.name) : prod.name}
                    </h3>
                    {lang === 'ar' ? (
                      <p className="text-[10px] text-slate-400 line-clamp-1">{prod.name}</p>
                    ) : (
                      prod.nameAr && <p className="text-[10px] text-slate-400 line-clamp-1 font-arabic">{prod.nameAr}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        {formatEGP(prod.sellingPrice, lang)}
                      </span>
                      <div className="text-[9px] text-slate-400">
                        {prod.unit}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: TACTILE CART & TENDER REGISTER BAR */}
      <div className="w-96 bg-white flex flex-col h-full shadow-lg border-s border-slate-200 z-10 shrink-0">
        {/* Cart Header */}
        <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-extrabold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t.cartTitle}
            </h2>
            <div className="text-[11px] text-slate-300">
              {cart.reduce((s, i) => s + i.quantity, 0)} {lang === 'ar' ? 'أصناف محددة' : 'Items'}
            </div>
          </div>

          {/* Parked / Held Carts Indicator */}
          {heldCarts.length > 0 && (
            <div className="flex gap-1">
              {heldCarts.map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => resumeHeldSale(h.id)}
                  title={lang === 'ar' ? 'استعادة الفاتورة المعلقة' : 'Resume held cart'}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" /> #{idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Selector Bar & Category Tag */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold">{t.customer}:</span>
            <select
              value={selectedCustomer?.id || ''}
              onChange={e => {
                const c = customers.find(item => item.id === e.target.value);
                if (c) {
                  setSelectedCustomer(c);
                  if (c.isSpecial) {
                    setApplySpecialDiscount(true);
                    setCustomDiscountPercent(c.specialDiscountRate || 10);
                  }
                }
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-hidden max-w-[220px] text-xs cursor-pointer"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.billingCycle === 'DAILY' ? '[يومي]' : c.billingCycle === 'MONTHLY' ? '[شهري]' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  selectedCustomer.billingCycle === 'DAILY' ? 'bg-emerald-100 text-emerald-800' :
                  selectedCustomer.billingCycle === 'MONTHLY' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {selectedCustomer.billingCycle === 'DAILY' ? (lang === 'ar' ? 'حساب يومي' : 'Daily') :
                   selectedCustomer.billingCycle === 'MONTHLY' ? (lang === 'ar' ? 'حساب شهري' : 'Monthly') :
                   (lang === 'ar' ? 'عميل نقدي' : 'Cash')}
                </span>
                {selectedCustomer.isSpecial && (
                  <span className="px-1.5 py-0.5 rounded-md font-extrabold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                    ★ {lang === 'ar' ? `عميل مميز (${selectedCustomer.specialDiscountRate || 10}%)` : `Special (${selectedCustomer.specialDiscountRate || 10}%)`}
                  </span>
                )}
              </div>

              <span className="font-mono text-slate-500">
                {lang === 'ar' ? 'الرصيد:' : 'Bal:'} {formatEGP(selectedCustomer.currentBalance, lang)}
              </span>
            </div>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Barcode className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
              <p className="text-xs font-semibold leading-relaxed">
                {t.emptyCartPrompt}
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-xs text-slate-800 leading-tight">
                      {lang === 'ar' ? (item.product.nameAr || item.product.name) : item.product.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      {formatEGP(item.unitPrice, lang)} / {item.product.unit}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {formatEGP(item.lineTotal, lang)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {item.product.unit}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center font-bold text-slate-800 font-mono text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkouts */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          {/* Special Customer Discount Box */}
          <div className={`p-2.5 rounded-xl border transition-all text-xs ${
            isEligibleForDiscount
              ? 'bg-amber-50/70 border-amber-300 text-amber-950'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEligibleForDiscount}
                  checked={applySpecialDiscount && isEligibleForDiscount}
                  onChange={e => setApplySpecialDiscount(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer disabled:cursor-not-allowed"
                />
                <span className={isEligibleForDiscount ? 'text-amber-900 font-extrabold' : 'text-slate-500'}>
                  {lang === 'ar' ? 'خصم عميل مميز' : 'Special Customer Discount'}
                </span>
              </label>

              {isEligibleForDiscount ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customDiscountPercent}
                    onChange={e => setCustomDiscountPercent(Math.max(1, Math.min(50, Number(e.target.value) || 0)))}
                    className="w-12 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-center font-bold text-xs focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-800">%</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                  {lang === 'ar' ? 'شرط > 300 ج' : 'Requires > 300 EGP'}
                </span>
              )}
            </div>

            {/* Constraint indicator */}
            {!isEligibleForDiscount ? (
              <div className="text-[10px] text-amber-800 bg-amber-100/60 p-1.5 rounded-lg font-medium mt-1">
                {lang === 'ar' 
                  ? `تنبيه: لا يمكن إضافة الخصم إلا للفواتير التي تتجاوز ٣٠٠ ج.م (الحالي: ${formatEGP(subtotal, lang)})`
                  : `Discount rule: Cannot add discount unless invoice exceeds 300 EGP (Current: ${formatEGP(subtotal, lang)})`}
              </div>
            ) : applySpecialDiscount && specialDiscountAmount > 0 ? (
              <div className="text-[10px] text-emerald-800 font-bold flex justify-between items-center mt-1 pt-1 border-t border-amber-200">
                <span>{lang === 'ar' ? `قيمة الخصم المعتمدة (${activeDiscountRate}%):` : `Applied Discount (${activeDiscountRate}%):`}</span>
                <span className="font-mono text-xs">-{formatEGP(specialDiscountAmount, lang)}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>{t.subtotal}:</span>
              <span className="font-mono font-medium">{formatEGP(subtotal, lang)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>{t.discount} {specialDiscountAmount > 0 ? (lang === 'ar' ? '(شامل خصم العميل المميز)' : '(incl. special customer)') : ''}:</span>
                <span className="font-mono">- {formatEGP(totalDiscount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-300">
              <span>{t.grandTotal}:</span>
              <span className="font-mono text-emerald-800 text-lg">{formatEGP(grandTotal, lang)}</span>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={holdCurrentSale}
              disabled={cart.length === 0}
              className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Pause className="w-4 h-4" /> {t.holdSale}
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {t.clearCart}
            </button>
          </div>

          {/* Tender Checkout Pay Button */}
          <button
            id="btn-pos-checkout"
            onClick={openTender}
            disabled={cart.length === 0 || !activeSession || activeSession.status !== 'OPEN'}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Banknote className="w-5 h-5" /> {t.checkoutPay}
          </button>
        </div>
      </div>

      {/* PAYMENT / TENDER MODAL */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold">{t.tenderTitle}</h3>
                <p className="text-xs text-slate-400">{t.amountToPay}: {formatEGP(grandTotal, lang)}</p>
              </div>
              <button onClick={() => setIsTenderModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Tender Method Selector with Egyptian gateways */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  {t.selectPaymentMethod}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTenderMethod('CASH')}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer ${
                      tenderMethod === 'CASH' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>{t.paymentCash}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTenderMethod('CARD')}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer ${
                      tenderMethod === 'CARD' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>{t.paymentCard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTenderMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer ${
                      tenderMethod === 'BANK_TRANSFER' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Send className="w-5 h-5 text-purple-600" />
                    <span>{t.paymentInstaPay}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTenderMethod('WALLET')}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer ${
                      tenderMethod === 'WALLET' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-600" />
                    <span>{t.paymentWallet}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTenderMethod('CUSTOMER_CREDIT')}
                    className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 cursor-pointer col-span-2 ${
                      tenderMethod === 'CUSTOMER_CREDIT' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>{t.paymentCredit}</span>
                  </button>
                </div>
              </div>

              {/* Cash Tender Input & Quick Denominations (Egyptian Pounds: 50, 100, 200, 500, 1000) */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  {t.amountTendered} ({formatEGP(grandTotal, lang)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tenderPaid}
                  onChange={e => setTenderPaid(e.target.value)}
                  className="w-full text-2xl font-black font-mono py-2.5 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />

                {tenderMethod === 'CASH' && (
                  <div className="space-y-2 mt-2">
                    <div className="text-[11px] font-bold text-slate-500">
                      {lang === 'ar' ? 'فئات النقد الورقي المتداولة في مصر (البنك المركزي المصري):' : 'Official Egyptian Banknotes (CBE):'}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[5, 10, 20, 50, 100, 200].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTenderPaid(String(amt))}
                          className="py-2 px-1 bg-slate-100 hover:bg-slate-200 active:scale-95 font-bold text-xs rounded-xl text-slate-800 border border-slate-200 hover:border-emerald-400 cursor-pointer transition-all text-center"
                        >
                          {amt} {lang === 'ar' ? 'ج.م' : 'EGP'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTenderPaid(String(grandTotal))}
                      className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 active:scale-98 font-bold text-xs rounded-xl text-emerald-800 border border-emerald-300 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>{t.exactAmount}</span>
                      <span className="font-mono font-black">({formatEGP(grandTotal, lang)})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Change calculation */}
              {tenderMethod === 'CASH' && (
                <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600">{t.changeDue}:</span>
                  <span className="text-base font-mono font-black text-emerald-700">
                    {formatEGP(Math.max(0, (parseFloat(tenderPaid) || 0) - grandTotal), lang)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTenderModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="btn-confirm-tender"
                onClick={finalizeCheckout}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> {t.completeSalePrint}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      {statusNotice && (
        <div className={`fixed bottom-5 ${lang === 'ar' ? 'left-5' : 'right-5'} z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-white transition-all ${
          statusNotice.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'
        }`}>
          {statusNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusNotice.text}</span>
        </div>
      )}
    </div>
  );
};
