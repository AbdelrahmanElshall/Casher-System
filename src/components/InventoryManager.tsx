import React, { useState } from 'react';
import { 
  Package, ArrowUpDown, Calendar, Plus, RefreshCw, 
  Search, ShieldAlert, Edit3, Trash2, FolderPlus, 
  Lock, CheckCircle2, AlertTriangle, Layers, Tag,
  Barcode, DollarSign, Boxes
} from 'lucide-react';
import { Product, StockMovement, User, Category } from '../types';
import { PosStorageEngine, isSuperAdmin } from '../storage';
import { Language, TRANSLATIONS, formatEGP } from '../utils/i18n';

interface InventoryManagerProps {
  lang: Language;
  currentUser: User;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ lang, currentUser }) => {
  const t = TRANSLATIONS[lang];
  const isArabic = lang === 'ar';
  const superAdmin = isSuperAdmin(currentUser);

  const [products, setProducts] = useState<Product[]>(PosStorageEngine.getProducts());
  const [categories, setCategories] = useState<Category[]>(PosStorageEngine.getCategories());
  const [movements, setMovements] = useState<StockMovement[]>(PosStorageEngine.getMovements());
  const [activeTab, setActiveTab] = useState<'STOCK' | 'CATEGORIES' | 'MOVEMENTS' | 'EXPIRY'>('STOCK');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>(
    isArabic ? 'جرد فعلي وتصحيح رصيد المخزن' : 'Physical cycle count correction'
  );

  // Add Product Modal (Super Admin Only)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameAr, setNewProdNameAr] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('Piece');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState('20');
  const [newProdReorder, setNewProdReorder] = useState('40');
  const [newProdInitialStock, setNewProdInitialStock] = useState('0');

  // Add Category Modal (Super Admin Only)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0284c7');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Delete Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Security / Permission Warning Modal
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const refreshData = () => {
    setProducts(PosStorageEngine.getProducts());
    setCategories(PosStorageEngine.getCategories());
    setMovements(PosStorageEngine.getMovements());
  };

  // RBAC Interceptor
  const requireSuperAdmin = (actionName: string): boolean => {
    if (!superAdmin) {
      setPermissionWarning(
        isArabic
          ? `عفواً! عملية (${actionName}) مقتصرة حصرياً على مدير النظام (Super Admin). حسابك الحالي بصلاحية [${currentUser.roleName}] غير مخول بتعديل أو حذف كتالوج الأصناف والتصنيفات.`
          : `Access Restricted! (${actionName}) is strictly reserved for Super Administrators. Your current role [${currentUser.roleName}] does not have permission to alter the product catalog.`
      );
      return false;
    }
    return true;
  };

  // Handle Add Product Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSuperAdmin(isArabic ? 'إضافة منتج جديد' : 'Add New Product')) return;

    const cost = parseFloat(newProdCost);
    const price = parseFloat(newProdPrice);
    const initStock = parseFloat(newProdInitialStock) || 0;
    const minStk = parseFloat(newProdMinStock) || 10;
    const reorder = parseFloat(newProdReorder) || 20;

    if (isNaN(cost) || isNaN(price) || price < 0 || cost < 0) {
      showNotification('error', isArabic ? 'يرجى إدخال أسعار صحيحة' : 'Invalid pricing values');
      return;
    }

    const catObj = categories.find(c => c.id === newProdCategoryId);
    const categoryName = catObj ? (isArabic ? (catObj.nameAr || catObj.name) : catObj.name) : 'General';

    const res = PosStorageEngine.addProduct({
      name: newProdName.trim(),
      nameAr: newProdNameAr.trim() || undefined,
      sku: newProdSku.trim().toUpperCase(),
      barcode: newProdBarcode.trim(),
      categoryId: newProdCategoryId || undefined,
      categoryName,
      productType: 'STANDARD',
      unit: newProdUnit,
      costPrice: cost,
      sellingPrice: price,
      taxRate: 0,
      minStock: minStk,
      reorderPoint: reorder,
      currentStock: initStock,
      isActive: true,
      allowNegativeStock: false,
      hasExpiry: false,
      hasSerial: false,
    }, currentUser);

    if (res.success) {
      showNotification('success', isArabic ? `تم إضافة المنتج (${newProdNameAr || newProdName}) بنجاح!` : `Product (${newProdName}) added successfully!`);
      refreshData();
      setIsAddProductModalOpen(false);
      // reset form
      setNewProdName('');
      setNewProdNameAr('');
      setNewProdSku('');
      setNewProdBarcode('');
      setNewProdCost('');
      setNewProdPrice('');
      setNewProdInitialStock('0');
    } else {
      showNotification('error', res.error || 'Failed to add product');
    }
  };

  // Handle Delete Product
  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    if (!requireSuperAdmin(isArabic ? 'حذف منتج' : 'Delete Product')) {
      setProductToDelete(null);
      return;
    }

    const res = PosStorageEngine.deleteProduct(productToDelete.id, currentUser);
    if (res.success) {
      showNotification('success', isArabic ? `تم حذف الصنف (${productToDelete.nameAr || productToDelete.name}) من المخزون.` : `Product (${productToDelete.name}) deleted.`);
      refreshData();
    } else {
      showNotification('error', res.error || 'Failed to delete product');
    }
    setProductToDelete(null);
  };

  // Handle Add Category Submit
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSuperAdmin(isArabic ? 'إنشاء تصنيف جديد' : 'Create New Category')) return;

    if (!newCatName.trim()) {
      showNotification('error', isArabic ? 'يرجى كتابة اسم التصنيف' : 'Category name required');
      return;
    }

    const res = PosStorageEngine.addCategory({
      name: newCatName.trim(),
      nameAr: newCatNameAr.trim() || undefined,
      color: newCatColor,
      description: newCatDesc.trim() || undefined,
      isActive: true,
    }, currentUser);

    if (res.success) {
      showNotification('success', isArabic ? `تم إنشاء التصنيف (${newCatNameAr || newCatName}) بنجاح!` : `Category created!`);
      refreshData();
      setIsAddCategoryModalOpen(false);
      setNewCatName('');
      setNewCatNameAr('');
      setNewCatDesc('');
    } else {
      showNotification('error', res.error || 'Failed to create category');
    }
  };

  // Handle Delete Category
  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    if (!requireSuperAdmin(isArabic ? 'حذف تصنيف' : 'Delete Category')) {
      setCategoryToDelete(null);
      return;
    }

    const res = PosStorageEngine.deleteCategory(categoryToDelete.id, currentUser);
    if (res.success) {
      showNotification('success', isArabic ? `تم حذف التصنيف بنجاح.` : `Category deleted successfully.`);
      refreshData();
    } else {
      showNotification('error', res.error || 'Failed to delete category');
    }
    setCategoryToDelete(null);
  };

  // Handle Manual Stock Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qtyChange = parseFloat(adjustQty);
    if (isNaN(qtyChange) || qtyChange === 0) return;

    const allProds = PosStorageEngine.getProducts();
    const target = allProds.find(p => p.id === selectedProduct.id);
    if (!target) return;

    const prev = target.currentStock;
    const next = Number((prev + qtyChange).toFixed(3));
    target.currentStock = next;

    PosStorageEngine.saveProducts(allProds);

    const movs = PosStorageEngine.getMovements();
    movs.unshift({
      id: `mov-adj-${Date.now()}`,
      warehouseId: 'wh-main',
      productId: target.id,
      productName: target.name,
      productSku: target.sku,
      userName: currentUser.name,
      type: 'ADJUSTMENT',
      quantity: qtyChange,
      previousQuantity: prev,
      newQuantity: next,
      unitCost: target.costPrice,
      reason: adjustReason,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('pos_eg_movements_v2', JSON.stringify(movs));

    PosStorageEngine.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: target.id,
      oldValues: { stock: prev },
      newValues: { stock: next, diff: qtyChange, reason: adjustReason },
    });

    refreshData();
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
    setAdjustQty('');
    showNotification('success', isArabic ? `تم تحديث رصيد (${target.nameAr || target.name}) إلى ${next} ${target.unit}` : `Stock updated to ${next}`);
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      (p.nameAr && p.nameAr.includes(filterQuery)) ||
      p.sku.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.barcode.includes(filterQuery);

    if (selectedCategoryFilter === 'ALL') return matchesSearch;
    const catObj = categories.find(c => c.id === selectedCategoryFilter);
    let matchesCategory = p.categoryId === selectedCategoryFilter || p.categoryName === selectedCategoryFilter;
    if (!matchesCategory && catObj) {
      const pCat = (p.categoryName || '').toLowerCase().trim();
      const cName = catObj.name.toLowerCase().trim();
      const cNameAr = (catObj.nameAr || '').toLowerCase().trim();
      const cFirstWord = cName.split(' ')[0];
      const cArFirstWord = cNameAr ? cNameAr.split(' ')[0] : '';
      matchesCategory = 
        pCat === cName || 
        pCat === cNameAr || 
        (cFirstWord.length > 2 && pCat.includes(cFirstWord)) || 
        (cArFirstWord.length > 2 && pCat.includes(cArFirstWord)) ||
        cName.includes(pCat);
    }
    return matchesSearch && matchesCategory;
  });

  const totalValuation = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-6 overflow-hidden">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer opacity-70 hover:opacity-100 font-mono">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t.inventoryTitle}
            </h1>
            {superAdmin ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {isArabic ? 'صلاحيات المشرف العام (Super Admin)' : 'Super Admin Mode'}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                {isArabic ? 'صلاحيات كاشير محدودة (عرض فقط)' : 'Restricted Cashier View'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isArabic 
              ? 'إدارة المخزون، الأصناف، التصنيفات، حركات الجرد، ومراقبة الصلاحيات وحساب القيمة الفعلية' 
              : 'Inventory management, products, categories, stock movements, and valuation'}
          </p>
        </div>

        {/* Action Buttons: Add Product & Add Category */}
        <div className="flex items-center gap-2">
          {/* New Category Button */}
          <button
            onClick={() => {
              if (requireSuperAdmin(isArabic ? 'إدارة وإنشاء التصنيفات' : 'Manage Categories')) {
                setIsAddCategoryModalOpen(true);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              superAdmin 
                ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs' 
                : 'bg-slate-200 text-slate-500 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            {superAdmin ? <FolderPlus className="w-4 h-4 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isArabic ? 'إضافة تصنيف جديد' : 'New Category'}</span>
          </button>

          {/* New Product Button */}
          <button
            onClick={() => {
              if (requireSuperAdmin(isArabic ? 'إضافة صنف جديد' : 'Add New Product')) {
                setIsAddProductModalOpen(true);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              superAdmin 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95' 
                : 'bg-slate-300 text-slate-600 border border-slate-400/40 hover:bg-slate-300'
            }`}
          >
            {superAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isArabic ? 'إضافة منتج جديد' : 'Add New Product'}</span>
            {!superAdmin && <span className="text-[10px] text-slate-500">({isArabic ? 'أدمن فقط' : 'Admin only'})</span>}
          </button>
        </div>
      </div>

      {/* Tabs & Quick Metric Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'STOCK' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.stockLevelsTab} ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'CATEGORIES' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'التصنيفات والأنشطة' : 'Categories'} ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'MOVEMENTS' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.movementsLedgerTab} ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('EXPIRY')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'EXPIRY' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.expiryWatchdogTab}
          </button>
        </div>

        {/* Valuation Summary Bar */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-500">{isArabic ? 'قيمة التكلفة:' : 'Cost Value:'}</span>
            <span className="font-mono text-emerald-700 font-extrabold">{formatEGP(totalValuation, lang)}</span>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-500">{isArabic ? 'قيمة البيع المتوقعة:' : 'Retail Value:'}</span>
            <span className="font-mono text-blue-700 font-extrabold">{formatEGP(totalRetailValuation, lang)}</span>
          </div>
          {lowStockCount > 0 && (
            <span className="px-2.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold">
              {lowStockCount} {isArabic ? 'أصناف قاربت النفاد' : 'Low Stock'}
            </span>
          )}
          {outOfStockCount > 0 && (
            <span className="px-2.5 py-1.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold">
              {outOfStockCount} {isArabic ? 'أصناف نفدت' : 'Out of Stock'}
            </span>
          )}
          <button
            onClick={refreshData}
            title={t.refresh}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
        {/* Search & Category Filter Bar */}
        {activeTab === 'STOCK' && (
          <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="relative w-72">
              <Search className={`w-4 h-4 text-slate-400 absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder={isArabic ? 'بحث بالاسم، الباركود، أو SKU...' : 'Search by name, barcode, SKU...'}
                className={`w-full ${isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{isArabic ? 'التصنيف:' : 'Category:'}</span>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">{isArabic ? 'جميع التصنيفات' : 'All Categories'}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {isArabic ? (c.nameAr || c.name) : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* TAB 1: STOCK INVENTORY LIST */}
        {activeTab === 'STOCK' && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 text-start">{t.skuBarcode}</th>
                  <th className="py-2.5 px-4 text-start">{t.productName}</th>
                  <th className="py-2.5 px-4 text-start">{t.category}</th>
                  <th className="py-2.5 px-4 text-end">{t.costPrice}</th>
                  <th className="py-2.5 px-4 text-end">{t.sellingPrice}</th>
                  <th className="py-2.5 px-4 text-center">{t.currentStock}</th>
                  <th className="py-2.5 px-4 text-end">{t.stockValuation}</th>
                  <th className="py-2.5 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => {
                  const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;
                  const valuation = p.currentStock * p.costPrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-start font-mono text-slate-600">
                        <div className="font-bold text-slate-800">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="py-2.5 px-4 text-start">
                        <div className="font-bold text-slate-900">
                          {isArabic ? (p.nameAr || p.name) : p.name}
                        </div>
                        {isArabic ? (
                          <div className="text-[10px] text-slate-400">{p.name}</div>
                        ) : (
                          p.nameAr && <div className="text-[10px] text-slate-400 font-arabic">{p.nameAr}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-start text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-semibold text-slate-700">
                          {p.categoryName || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono text-slate-600">
                        {formatEGP(p.costPrice, lang)}
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono font-bold text-slate-900">
                        {formatEGP(p.sellingPrice, lang)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {p.currentStock} {p.unit} ({t.outOfStockStatus})
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {p.currentStock} {p.unit} ({t.lowStock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {p.currentStock} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono font-bold text-slate-900">
                        {formatEGP(valuation, lang)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Adjust button (Allowed for supervisory adjustments) */}
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title={t.adjustStock}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Product Button (STRICTLY SUPER ADMIN ONLY) */}
                          <button
                            onClick={() => {
                              if (requireSuperAdmin(isArabic ? 'حذف صنف من المخزون' : 'Delete Product')) {
                                setProductToDelete(p);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              superAdmin 
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600' 
                                : 'bg-slate-100 text-slate-300 opacity-60 cursor-not-allowed'
                            }`}
                            title={superAdmin ? (isArabic ? 'حذف المنتج نهائياً (سوبر أدمن)' : 'Delete Product (Super Admin)') : (isArabic ? 'حذف المنتج متاح فقط لمدير النظام' : 'Super Admin Only')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CATEGORY MANAGEMENT */}
        {activeTab === 'CATEGORIES' && (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{isArabic ? 'كتالوج التصنيفات والأقسام' : 'Product Categories'}</h3>
                <p className="text-xs text-slate-500">
                  {isArabic ? 'تنظيم المنتجات في تصنيفات لتسهيل البيع، وتطبيق الخصومات وتقارير الجرد' : 'Organize inventory into categories for rapid checkout and analysis'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (requireSuperAdmin(isArabic ? 'إضافة تصنيف جديد' : 'Create Category')) {
                    setIsAddCategoryModalOpen(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  superAdmin 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs' 
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {superAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isArabic ? 'تصنيف جديد' : 'New Category'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id || p.categoryName === cat.name || p.categoryName === cat.nameAr).length;

                return (
                  <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                          style={{ backgroundColor: cat.color || '#0284c7' }}
                        >
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{isArabic ? (cat.nameAr || cat.name) : cat.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cat.name}</div>
                        </div>
                      </div>

                      {/* Delete Category Button (Super Admin Only) */}
                      <button
                        onClick={() => {
                          if (requireSuperAdmin(isArabic ? 'حذف تصنيف' : 'Delete Category')) {
                            setCategoryToDelete(cat);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          superAdmin 
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title={superAdmin ? (isArabic ? 'حذف التصنيف' : 'Delete Category') : (isArabic ? 'أدمن فقط' : 'Admin Only')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-500">{isArabic ? 'الأصناف المسجلة:' : 'Items Count:'}</span>
                      <span className="font-bold font-mono px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-800">
                        {count} {isArabic ? 'صنف' : 'items'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MOVEMENTS LEDGER */}
        {activeTab === 'MOVEMENTS' && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 text-start">{t.date}</th>
                  <th className="py-3 px-4 text-start">{t.productName}</th>
                  <th className="py-3 px-4 text-start">{t.type}</th>
                  <th className="py-3 px-4 text-end">{t.qtyChange}</th>
                  <th className="py-3 px-4 text-end">{t.newBalance}</th>
                  <th className="py-3 px-4 text-start">{t.reason}</th>
                  <th className="py-3 px-4 text-start">{t.user}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-start text-slate-500 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="py-3 px-4 text-start font-bold text-slate-900">
                      <div>{m.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.productSku}</div>
                    </td>
                    <td className="py-3 px-4 text-start">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold">
                      <span className={m.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-slate-900">
                      {m.newQuantity}
                    </td>
                    <td className="py-3 px-4 text-start text-slate-600">
                      {m.reason || '-'}
                    </td>
                    <td className="py-3 px-4 text-start font-semibold text-slate-700">
                      {m.userName || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: EXPIRY WATCHDOG */}
        {activeTab === 'EXPIRY' && (
          <div className="p-8 text-center flex flex-col items-center justify-center flex-1">
            <Calendar className="w-12 h-12 text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {isArabic ? 'نظام تتبع صلاحيات المنتجات والتشغيلات (Batch & Expiry Monitoring)' : 'Batch & Expiry Watchdog'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              {isArabic 
                ? 'جميع منتجات الألبان والأغذية الحالية في المخزن صالحة للاستهلاك الآدمي مع تواريخ انتهاء آمنة تتراوح بين 6 أشهر و 18 شهراً.' 
                : 'All fresh goods in main warehouse have healthy expiration margins.'}
            </p>
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold">
              {isArabic ? '✓ لا توجد أي تشغيلات منتهية الصلاحية أو راكدة حالياً' : '✓ Zero expired batches detected'}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL: ADD PRODUCT (SUPER ADMIN ONLY) --- */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddProduct} className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  {isArabic ? 'إضافة منتج جديد للمخزن (سوبر أدمن)' : 'Add New Inventory Product (Super Admin)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isArabic ? 'تسجيل صنف جديد بكود SKU فريد وباركود وأسعار التكلفة والبيع' : 'Create new product with SKU, barcode, cost, and selling price'}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isArabic ? 'اسم الصنف (بالعربية) *' : 'Product Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdNameAr}
                    onChange={e => setNewProdNameAr(e.target.value)}
                    placeholder={isArabic ? 'مثال: شيبسي كرانشي بالجبنة' : 'Arabic name'}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isArabic ? 'اسم الصنف (بالإنجليزية) *' : 'Product Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    placeholder="e.g. Chipsy Crunchy Cheese"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isArabic ? 'كود الصنف (SKU) *' : 'SKU Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                    placeholder="e.g. CHP-CRU-CHZ"
                    className="w-full text-xs font-mono uppercase p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>{isArabic ? 'الباركود الدولي *' : 'Barcode *'}</span>
                    <button
                      type="button"
                      onClick={() => setNewProdBarcode(`622${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                      className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                    >
                      {isArabic ? 'توليد تلقائي' : 'Auto Generate'}
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                    placeholder="622..."
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.category}
                  </label>
                  <select
                    value={newProdCategoryId}
                    onChange={e => setNewProdCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">{isArabic ? '-- اختر التصنيف --' : '-- Select Category --'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {isArabic ? (c.nameAr || c.name) : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'وحدة القياس' : 'Unit'}
                  </label>
                  <select
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Piece">{isArabic ? 'قطعة (Piece)' : 'Piece'}</option>
                    <option value="Bottle">{isArabic ? 'زجاجة / عبوة (Bottle)' : 'Bottle'}</option>
                    <option value="Box">{isArabic ? 'علبة / كرتونة (Box)' : 'Box'}</option>
                    <option value="Kg">{isArabic ? 'كيلوجرام (Kg)' : 'Kilogram'}</option>
                    <option value="Pack">{isArabic ? 'باكيت (Pack)' : 'Pack'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.costPrice} ({isArabic ? 'ج.م' : 'EGP'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdCost}
                    onChange={e => setNewProdCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t.sellingPrice} ({isArabic ? 'ج.م' : 'EGP'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'الرصيد الافتتاحي' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    value={newProdInitialStock}
                    onChange={e => setNewProdInitialStock(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'حد الأمان الأدنى' : 'Min Stock'}
                  </label>
                  <input
                    type="number"
                    value={newProdMinStock}
                    onChange={e => setNewProdMinStock(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'نقطة إعادة الطلب' : 'Reorder Point'}
                  </label>
                  <input
                    type="number"
                    value={newProdReorder}
                    onChange={e => setNewProdReorder(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-xs cursor-pointer"
              >
                {isArabic ? 'حفظ الصنف وتفعيل الرصيد' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: ADD CATEGORY (SUPER ADMIN ONLY) --- */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddCategory} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                {isArabic ? 'إنشاء تصنيف جديد (سوبر أدمن)' : 'Create New Category (Super Admin)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isArabic ? 'إضافة قسم وتصنيف لربطه بالأصناف' : 'Add category for inventory sorting'}
              </p>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isArabic ? 'اسم التصنيف (بالعربية) *' : 'Category Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCatNameAr}
                  onChange={e => setNewCatNameAr(e.target.value)}
                  placeholder={isArabic ? 'مثال: مثلجات ومجمدات' : 'Category name AR'}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isArabic ? 'اسم التصنيف (بالإنجليزية) *' : 'Category Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Frozen & Ice Cream"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isArabic ? 'لون مميز للبطاقة' : 'Badge Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-1"
                  />
                  <input
                    type="text"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="flex-1 text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isArabic ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder={isArabic ? 'وصف إضافي لطبيعة هذا القسم' : 'Optional notes'}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-xs cursor-pointer"
              >
                {isArabic ? 'حفظ التصنيف' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CONFIRM DELETE PRODUCT MODAL --- */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              {isArabic ? 'تأكيد حذف المنتج نهائياً' : 'Confirm Product Deletion'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isArabic 
                ? `هل أنت متأكد من حذف الصنف (${productToDelete.nameAr || productToDelete.name}) بكود [${productToDelete.sku}] من النظام وقاعدة البيانات؟ هذه العملية لا يمكن التراجع عنها.`
                : `Are you sure you want to permanently delete (${productToDelete.name}) [${productToDelete.sku}]?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs cursor-pointer"
              >
                {isArabic ? 'نعم، احذف الصنف' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE CATEGORY MODAL --- */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              {isArabic ? 'تأكيد حذف التصنيف' : 'Confirm Category Deletion'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isArabic 
                ? `هل أنت متأكد من حذف التصنيف (${categoryToDelete.nameAr || categoryToDelete.name})؟ سيتم التحقق أولاً من عدم وجود أي منتجات مسجلة عليه.`
                : `Are you sure you want to delete category (${categoryToDelete.name})?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmDeleteCategory}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs cursor-pointer"
              >
                {isArabic ? 'نعم، احذف التصنيف' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ACCESS RESTRICTED / PERMISSION DENIED MODAL --- */}
      {permissionWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-2">
              {isArabic ? 'صلاحية محظورة - متاح فقط للسوبر أدمن' : 'Access Restricted - Super Admin Only'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {permissionWarning}
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 mb-5">
              {isArabic 
                ? '💡 للتجربة بصلاحية كاملة، يمكنك التبديل إلى حساب المشرف: [admin / admin123] من زر الكاشير بالأعلى.' 
                : '💡 You can switch to the Super Admin account [admin / admin123] from the top header user menu.'}
            </div>
            <button
              onClick={() => setPermissionWarning(null)}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              {isArabic ? 'فهمت ذلك' : 'Understood'}
            </button>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAdjustSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4">
              <h3 className="text-sm font-bold">{t.adjustStock}</h3>
              <p className="text-xs text-slate-400">
                {isArabic ? (selectedProduct.nameAr || selectedProduct.name) : selectedProduct.name} ({selectedProduct.sku})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t.currentStock}:</span>
                  <span className="font-bold text-slate-900">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isArabic ? 'قيمة التعديل بالزيادة (+) أو النقصان (-)' : 'Quantity Adjustment (+ to add, - to reduce)'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="e.g. +10 or -2"
                  className="w-full text-base font-bold font-mono py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.reason}</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
