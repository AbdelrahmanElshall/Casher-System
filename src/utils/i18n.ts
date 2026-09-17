export type Language = 'en' | 'ar';

export interface TranslationDict {
  // Navigation & App Rail
  pos: string;
  inventory: string;
  finance: string;
  customers: string;
  suppliers: string;
  shift: string;
  settings: string;

  // Header & Status
  egyptRetail: string;
  currencySymbol: string;
  currencyName: string;
  vatRateNotice: string;
  branch: string;
  cashier: string;
  shiftStatus: string;
  shiftOpen: string;
  shiftClosed: string;

  // POS Terminal
  scanBarcodePlaceholder: string;
  searchProductPlaceholder: string;
  allCategories: string;
  cartTitle: string;
  emptyCartPrompt: string;
  item: string;
  qty: string;
  price: string;
  cost: string;
  tax: string;
  total: string;
  discount: string;
  subtotal: string;
  vat14: string;
  grandTotal: string;
  clearCart: string;
  holdSale: string;
  resumeSale: string;
  heldCarts: string;
  checkoutPay: string;
  scaleWeightParsed: string;
  outOfStock: string;
  quickKeys: string;

  // Tender / Payment Modal
  tenderTitle: string;
  selectPaymentMethod: string;
  paymentCash: string;
  paymentCard: string;
  paymentMeeza: string;
  paymentInstaPay: string;
  paymentWallet: string;
  paymentCredit: string;
  amountToPay: string;
  amountTendered: string;
  changeDue: string;
  exactAmount: string;
  completeSalePrint: string;
  cancel: string;
  save: string;
  close: string;

  // Shift Modal
  registerShiftManagement: string;
  activeShiftOverview: string;
  openNewShift: string;
  closeShiftZReport: string;
  openingFloat: string;
  openingFloatDesc: string;
  openShiftBtn: string;
  currentCashInDrawer: string;
  openingCash: string;
  cashSalesTotal: string;
  expensesTotal: string;
  expectedDrawerCash: string;
  physicalCountedCash: string;
  cashDifference: string;
  shortage: string;
  surplus: string;
  balanced: string;
  closingNotes: string;
  printZReport: string;

  // Inventory & Stock
  inventoryTitle: string;
  inventorySubtitle: string;
  stockLevels: string;
  stockMovements: string;
  expiryWatchdog: string;
  adjustStockBtn: string;
  addProductBtn: string;
  productName: string;
  skuBarcode: string;
  category: string;
  currentStockQty: string;
  minReorder: string;
  status: string;
  actions: string;
  inStock: string;
  lowStock: string;
  outOfStockStatus: string;
  adjustStockTitle: string;
  quantityChange: string;
  adjustmentReason: string;
  movementType: string;
  date: string;
  user: string;
  reason: string;
  expiryAlertTitle: string;
  batchLot: string;
  expiryDate: string;
  daysRemaining: string;

  // Financial Dashboard
  financeTitle: string;
  financeSubtitle: string;
  recordExpenseBtn: string;
  salesRevenue: string;
  cogsTitle: string;
  grossProfitTitle: string;
  netProfitTitle: string;
  inventoryValuation: string;
  operatingExpenses: string;
  vatCollected14: string;
  plStatementTitle: string;
  recentSalesLedger: string;
  invoiceNo: string;
  customer: string;
  payment: string;
  receipt: string;
  expenseModalTitle: string;
  expenseTitleLabel: string;
  expenseAmountLabel: string;
  expenseCategoryLabel: string;

  // Detailed Financial Sections
  tabMoneySpent: string;
  tabWhatSold: string;
  tabInvoicesExplorer: string;
  tabCashFlow: string;
  filterAllTime: string;
  filterToday: string;
  filterThisWeek: string;
  filterThisMonth: string;
  totalSpent: string;
  totalSoldRevenue: string;
  itemsSoldSummary: string;
  vouchersCount: string;
  categoryBreakdown: string;
  itemizedExpensesLedger: string;
  productSalesPerformance: string;
  unitsSold: string;
  unitSellingPrice: string;
  unitCostPrice: string;
  totalRevenueCol: string;
  totalCostCol: string;
  grossProfitCol: string;
  marginCol: string;
  searchExpensePlaceholder: string;
  searchProductSalesPlaceholder: string;
  searchInvoicePlaceholder: string;
  allPaymentMethods: string;
  invoiceItemsCount: string;
  reprintReceipt: string;
  cashDrawerOutflow: string;
  cashDrawerInflow: string;
  electronicSettlements: string;
  netDrawerCashBalance: string;

  // Customers & Accounts
  customersTitle: string;
  customersSubtitle: string;
  addCustomerBtn: string;
  customerNameLabel: string;
  phoneLabel: string;
  nationalOrTaxId: string;
  customerTypeLabel: string;
  creditLimitLabel: string;
  currentBalanceLabel: string;
  loyaltyPointsLabel: string;

  // Egyptian Receipts
  receiptTitle: string;
  receiptSubtitle: string;
  taxRegistrationNo: string;
  commercialRegistrationNo: string;
  etaCompliantNotice: string;
  invoiceDate: string;
  paymentMethodLabel: string;
  thankYouMessage: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: {
    pos: 'POS',
    inventory: 'Stock',
    finance: 'Finance',
    customers: 'Customers',
    suppliers: 'Suppliers',
    shift: 'Shift',
    settings: 'Settings',

    egyptRetail: 'Egypt Retail & Pharmacy ERP',
    currencySymbol: 'EGP',
    currencyName: 'Egyptian Pound',
    vatRateNotice: '14% Egyptian VAT',
    branch: 'Branch',
    cashier: 'Cashier',
    shiftStatus: 'Shift Status',
    shiftOpen: 'OPEN',
    shiftClosed: 'CLOSED',

    scanBarcodePlaceholder: 'Scan Barcode (F1) or Enter Barcode / Scale PLU...',
    searchProductPlaceholder: 'Search products by name, SKU or brand...',
    allCategories: 'All Categories',
    cartTitle: 'Current Order Cart',
    emptyCartPrompt: 'Cart is empty. Scan barcode or click items to start transaction.',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    cost: 'Cost',
    tax: 'VAT (14%)',
    total: 'Total',
    discount: 'Discount',
    subtotal: 'Subtotal (Excl. Tax)',
    vat14: 'Egyptian VAT (14%)',
    grandTotal: 'Grand Total',
    clearCart: 'Void / Clear',
    holdSale: 'Hold Sale',
    resumeSale: 'Resume Sale',
    heldCarts: 'Parked Bills',
    checkoutPay: 'Tender & Checkout (F2)',
    scaleWeightParsed: 'Scale barcode parsed',
    outOfStock: 'Out of Stock',
    quickKeys: 'Quick Categories',

    tenderTitle: 'Payment & Checkout Tender',
    selectPaymentMethod: 'Select Payment Method',
    paymentCash: 'Cash (نقدي)',
    paymentCard: 'Bank Card / Visa (فيزا)',
    paymentMeeza: 'Meeza Card (ميزة)',
    paymentInstaPay: 'InstaPay (إنستاباي)',
    paymentWallet: 'E-Wallet (فودافون كاش)',
    paymentCredit: 'Customer Credit (آجل)',
    amountToPay: 'Total Due',
    amountTendered: 'Amount Tendered / Paid',
    changeDue: 'Change Due',
    exactAmount: 'Exact Amount',
    completeSalePrint: 'Complete Sale & Print Receipt',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',

    registerShiftManagement: 'Cash Register & Shift Control',
    activeShiftOverview: 'Active Shift Summary & Cash Drawer Balance',
    openNewShift: 'Open Register Shift',
    closeShiftZReport: 'Close Shift & Generate Z-Report',
    openingFloat: 'Opening Cash Float (EGP)',
    openingFloatDesc: 'Initial physical cash placed in drawer before opening sales.',
    openShiftBtn: 'Open Shift & Activate Terminal',
    currentCashInDrawer: 'Calculated Cash in Register',
    openingCash: 'Opening Float',
    cashSalesTotal: 'Cash Sales',
    expensesTotal: 'Cash Paid Out / Expenses',
    expectedDrawerCash: 'Expected Cash Balance',
    physicalCountedCash: 'Physical Counted Cash (EGP)',
    cashDifference: 'Variance / Discrepancy',
    shortage: 'Shortage (عجز)',
    surplus: 'Surplus (زيادة)',
    balanced: 'Balanced (متطابق)',
    closingNotes: 'Closing Shift Notes / Supervisor Remarks',
    printZReport: 'Print Shift Summary (X/Z Report)',

    inventoryTitle: 'Inventory & Stock Ledger',
    inventorySubtitle: 'Real-time multi-warehouse inventory levels, batch lots, and audit logs',
    stockLevels: 'Catalog & Stock',
    stockMovements: 'Stock Movements & Ledger',
    expiryWatchdog: 'Expiry Date Watchdog',
    adjustStockBtn: 'Adjust Stock / Cycle Count',
    addProductBtn: 'Add New Product',
    productName: 'Product Name',
    skuBarcode: 'SKU & Barcode',
    category: 'Category',
    currentStockQty: 'Current Stock',
    minReorder: 'Reorder Point',
    status: 'Status',
    actions: 'Actions',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStockStatus: 'Out of Stock',
    adjustStockTitle: 'Physical Inventory Adjustment',
    quantityChange: 'Quantity Change (+/-)',
    adjustmentReason: 'Audit Reason / Memo',
    movementType: 'Type',
    date: 'Date & Time',
    user: 'User',
    reason: 'Reason / Ref',
    expiryAlertTitle: 'Products Expiring within 90 Days',
    batchLot: 'Batch / Lot #',
    expiryDate: 'Expiry Date',
    daysRemaining: 'Days Left',

    financeTitle: 'Financial Details & Cash Flow Analytics',
    financeSubtitle: 'Complete itemized tracking of money spent, products sold, gross margins, and store cash flow',
    recordExpenseBtn: 'Record Expense Voucher',
    salesRevenue: 'Sales Revenue',
    cogsTitle: 'Cost of Goods Sold (COGS)',
    grossProfitTitle: 'Gross Margin / Profit',
    netProfitTitle: 'Net Operating Profit',
    inventoryValuation: 'Inventory Valuation (Cost)',
    operatingExpenses: 'Store Operating Expenses',
    vatCollected14: 'Sales Tax / Non-Tax Total',
    plStatementTitle: 'Profit & Loss (P&L) Statement',
    recentSalesLedger: 'Recent Sales Transactions',
    invoiceNo: 'Invoice #',
    customer: 'Customer',
    payment: 'Payment',
    receipt: 'Receipt',
    expenseModalTitle: 'Record Operating Expense / Cash Payout',
    expenseTitleLabel: 'Expense Title / Description',
    expenseAmountLabel: 'Amount (EGP)',
    expenseCategoryLabel: 'Expense Category',

    // Detailed Financial Sections
    tabMoneySpent: 'What Money Was Spent On (Expenses)',
    tabWhatSold: 'What Was Sold (Product Breakdown)',
    tabInvoicesExplorer: 'Invoices & Basket Details',
    tabCashFlow: 'Cash Flow & Channels',
    filterAllTime: 'All Time',
    filterToday: 'Today',
    filterThisWeek: 'This Week',
    filterThisMonth: 'This Month',
    totalSpent: 'Total Money Spent',
    totalSoldRevenue: 'Total Gross Sales',
    itemsSoldSummary: 'Products Sold',
    vouchersCount: 'Expense Vouchers',
    categoryBreakdown: 'Spending by Category',
    itemizedExpensesLedger: 'Itemized Expenses Ledger',
    productSalesPerformance: 'Product Sales Performance',
    unitsSold: 'Units Sold',
    unitSellingPrice: 'Unit Price',
    unitCostPrice: 'Unit Cost',
    totalRevenueCol: 'Gross Revenue',
    totalCostCol: 'Total Cost (COGS)',
    grossProfitCol: 'Gross Profit',
    marginCol: 'Margin %',
    searchExpensePlaceholder: 'Search expenses by description, payee, or voucher #...',
    searchProductSalesPlaceholder: 'Search sold products by name, SKU, or category...',
    searchInvoicePlaceholder: 'Search invoices by #, customer, or cashier...',
    allPaymentMethods: 'All Payment Methods',
    invoiceItemsCount: 'Items in Basket',
    reprintReceipt: 'Print Receipt',
    cashDrawerOutflow: 'Cash Outflow from Drawer',
    cashDrawerInflow: 'Cash Inflow to Drawer',
    electronicSettlements: 'Electronic Collections (InstaPay/Cards/Wallets)',
    netDrawerCashBalance: 'Net Cash In Drawer',

    customersTitle: 'Customers & Credit Accounts',
    customersSubtitle: 'Manage customer profiles, loyalty points, and credit receivables',
    addCustomerBtn: 'Add Customer',
    customerNameLabel: 'Customer Name',
    phoneLabel: 'Mobile Phone',
    nationalOrTaxId: 'National ID / Tax ID',
    customerTypeLabel: 'Type',
    creditLimitLabel: 'Credit Limit',
    currentBalanceLabel: 'Current Balance (Debt)',
    loyaltyPointsLabel: 'Loyalty Points',

    receiptTitle: 'NILE HORIZON HYPERMARKETS',
    receiptSubtitle: 'Commercial Enterprise S.A.E - Cairo, Egypt',
    taxRegistrationNo: 'Tax Reg: 200-482-913',
    commercialRegistrationNo: 'C.R: 104829 Cairo',
    etaCompliantNotice: 'Store Sales Receipt Verified',
    invoiceDate: 'Date',
    paymentMethodLabel: 'Payment Method',
    thankYouMessage: 'Thank you for shopping with us! Returnable within 14 days with original receipt.',
  },
  ar: {
    pos: 'نقطة البيع',
    inventory: 'المخزون',
    finance: 'المالية',
    customers: 'العملاء',
    suppliers: 'الموردين',
    shift: 'الوردية',
    settings: 'الإعدادات',

    egyptRetail: 'نظام الكاشير وإدارة التجزئة والصيدليات - مصر',
    currencySymbol: 'ج.م',
    currencyName: 'جنيه مصري',
    vatRateNotice: 'ضريبة القيمة المضافة ١٤٪ (مصر)',
    branch: 'الفرع',
    cashier: 'الكاشير',
    shiftStatus: 'حالة الوردية',
    shiftOpen: 'مفتوحة',
    shiftClosed: 'مغلقة',

    scanBarcodePlaceholder: 'امسح الباركود (F1) أو أدخل الكود / كود الميزان الإلكتروني...',
    searchProductPlaceholder: 'ابحث عن منتج بالاسم أو الباركود أو الصنف...',
    allCategories: 'جميع الأقسام',
    cartTitle: 'سلة الفاتورة الحالية',
    emptyCartPrompt: 'السلة فارغة. قم بمسح باركود المنتج أو اضغط على الأصناف للبدء.',
    item: 'الصنف',
    qty: 'الكمية',
    price: 'السعر',
    cost: 'التكلفة',
    tax: 'الضريبة (١٤٪)',
    total: 'الإجمالي',
    discount: 'الخصم',
    subtotal: 'المجموع قبل الضريبة',
    vat14: 'ضريبة القيمة المضافة (١٤٪)',
    grandTotal: 'المبلغ الإجمالي',
    clearCart: 'إلغاء / مسح السلة',
    holdSale: 'تعليق الفاتورة',
    resumeSale: 'استعادة الفاتورة',
    heldCarts: 'الفواتير المعلقة',
    checkoutPay: 'المحاسبة والدفع (F2)',
    scaleWeightParsed: 'تم قراءة وزن الميزان تلقائياً',
    outOfStock: 'نفذ من المخزن',
    quickKeys: 'الأقسام السريعة',

    tenderTitle: 'سداد الفاتورة والدفع',
    selectPaymentMethod: 'اختر طريقة الدفع',
    paymentCash: 'نقدي (كاش)',
    paymentCard: 'بطاقة بنكية (فيزا / ماستركارد)',
    paymentMeeza: 'كارت ميزة الوطني (Meeza)',
    paymentInstaPay: 'إنستاباي (InstaPay)',
    paymentWallet: 'محفظة إلكترونية (فودافون / أورنج كاش)',
    paymentCredit: 'حساب آجل (عميل)',
    amountToPay: 'المطلوب سداده',
    amountTendered: 'المبلغ المدفوع من العميل',
    changeDue: 'المتبقي للعميل (الفكة)',
    exactAmount: 'المبلغ بالضبط',
    completeSalePrint: 'إتمام العملية وطباعة الإيصال',
    cancel: 'إلغاء',
    save: 'حفظ',
    close: 'إغلاق',

    registerShiftManagement: 'إدارة الوردية ودرج الكاشير',
    activeShiftOverview: 'ملخص الوردية الحالية ورصيد النقدية',
    openNewShift: 'فتح وردية جديدة',
    closeShiftZReport: 'إغلاق الوردية وإصدار تقرير Z',
    openingFloat: 'العهدة النقدية الافتتاحية (ج.م)',
    openingFloatDesc: 'المبلغ النقدي المودع في الدرج كفكة في بداية الوردية.',
    openShiftBtn: 'فتح الوردية وتفعيل الكاشير',
    currentCashInDrawer: 'النقدية المحسوبة بالدرج',
    openingCash: 'العهدة الافتتاحية',
    cashSalesTotal: 'المبيعات النقدية',
    expensesTotal: 'المصروفات النقدية الخارجة',
    expectedDrawerCash: 'النقدية المتوقعة بالدرج',
    physicalCountedCash: 'النقدية الفعلية بعد الجرد (ج.م)',
    cashDifference: 'الفارق / العجز والزيادة',
    shortage: 'عجز نقدي (نقص)',
    surplus: 'فائض نقدي (زيادة)',
    balanced: 'متطابق بدون فارق',
    closingNotes: 'ملاحظات المشرف عند الإغلاق',
    printZReport: 'طباعة ملخص الوردية (تقرير Z)',

    inventoryTitle: 'إدارة المخازن وحركة الأصناف',
    inventorySubtitle: 'متابعة الأرصدة الحية، تواريخ الصلاحية، وأرصدة المخازن المتعددة',
    stockLevels: 'دليل المنتجات والأرصدة',
    stockMovements: 'سجل حركات المخزن',
    expiryWatchdog: 'مراقبة تواريخ الصلاحية',
    adjustStockBtn: 'تسوية جردية / تعديل رصيد',
    addProductBtn: 'إضافة منتج جديد',
    productName: 'اسم الصنف',
    skuBarcode: 'كود الصنف والباركود',
    category: 'القسم',
    currentStockQty: 'الرصيد الحالي',
    minReorder: 'حد إعادة الطلب',
    status: 'الحالة',
    actions: 'إجراءات',
    inStock: 'متوفر',
    lowStock: 'رصيد منخفض',
    outOfStockStatus: 'نفذ الرصيد',
    adjustStockTitle: 'تسوية جرد المخزون الفعلي',
    quantityChange: 'مقدار التعديل (+ أو -)',
    adjustmentReason: 'سبب التسوية الجردية',
    movementType: 'نوع الحركة',
    date: 'التاريخ والوقت',
    user: 'المستخدم',
    reason: 'السبب / المرجع',
    expiryAlertTitle: 'أصناف تنتهي صلاحيتها خلال ٩٠ يوماً',
    batchLot: 'رقم التشغيلة / اللوت',
    expiryDate: 'تاريخ الصلاحية',
    daysRemaining: 'الأيام المتبقية',

    financeTitle: 'التفاصيل المالية وحركة النقدية والأرباح',
    financeSubtitle: 'استعراض تفصيلي شامل لأين صُرفت الأموال، وما تم بيعه، وهامش الربح والسيولة',
    recordExpenseBtn: 'تسجيل سند صرف مصروف',
    salesRevenue: 'إجمالي المبيعات',
    cogsTitle: 'تكلفة البضاعة المباعة (COGS)',
    grossProfitTitle: 'مجمل الربح التجاري',
    netProfitTitle: 'صافي الربح التشغيلي',
    inventoryValuation: 'تقييم المخزون بسعر التكلفة',
    operatingExpenses: 'إجمالي المصروفات والنفقات',
    vatCollected14: 'إجمالي الحساب',
    plStatementTitle: 'قائمة الأرباح والخسائر (P&L)',
    recentSalesLedger: 'سجل فواتير المبيعات',
    invoiceNo: 'رقم الفاتورة',
    customer: 'العميل',
    payment: 'طريقة الدفع',
    receipt: 'الإيصال',
    expenseModalTitle: 'تسجيل سند صرف مصروف / سحب نقدي',
    expenseTitleLabel: 'بيان وسند المصروف',
    expenseAmountLabel: 'المبلغ (ج.م)',
    expenseCategoryLabel: 'بند وتصنيف المصروف',

    // Detailed Financial Sections (Arabic)
    tabMoneySpent: 'أين صُرفت الأموال (المصروفات التفصيلية)',
    tabWhatSold: 'ما تم بيعه (تفاصيل الأصناف والمبيعات)',
    tabInvoicesExplorer: 'سجل الفواتير ومحتويات السلة',
    tabCashFlow: 'حركة النقدية ووسائل الدفع',
    filterAllTime: 'كل الفترات',
    filterToday: 'اليوم',
    filterThisWeek: 'هذا الأسبوع',
    filterThisMonth: 'هذا الشهر',
    totalSpent: 'إجمالي الأموال المصروفة',
    totalSoldRevenue: 'إجمالي قيمة المبيعات',
    itemsSoldSummary: 'الأصناف المباعة',
    vouchersCount: 'سندات الصرف',
    categoryBreakdown: 'توزيع المصروفات حسب البند',
    itemizedExpensesLedger: 'جدول المصروفات وسندات الصرف التفصيلي',
    productSalesPerformance: 'أداء ومبيعات المنتجات التفصيلية',
    unitsSold: 'الكمية المباعة',
    unitSellingPrice: 'سعر البيع',
    unitCostPrice: 'سعر التكلفة',
    totalRevenueCol: 'إجمالي الإيراد',
    totalCostCol: 'إجمالي التكلفة',
    grossProfitCol: 'مجمل الربح',
    marginCol: 'هامش الربح %',
    searchExpensePlaceholder: 'بحث في المصروفات بالبيان، المستلم، أو رقم السند...',
    searchProductSalesPlaceholder: 'بحث في الأصناف المباعة بالاسم، الكود، أو القسم...',
    searchInvoicePlaceholder: 'بحث في الفواتير بالرقم، اسم العميل، أو الكاشير...',
    allPaymentMethods: 'جميع وسائل الدفع',
    invoiceItemsCount: 'أصناف الفاتورة',
    reprintReceipt: 'طباعة الإيصال',
    cashDrawerOutflow: 'مصروفات نقدية مسحوبة من الدرج',
    cashDrawerInflow: 'مقبوضات نقدية للدرج (كاش)',
    electronicSettlements: 'متحصلات إلكترونية (إنستاباي / فيزا / محافظ)',
    netDrawerCashBalance: 'صافي النقدية بالدرج',

    customersTitle: 'دليل العملاء والحسابات الآجلة',
    customersSubtitle: 'إدارة ملفات العملاء، نقاط الولاء، والمديونيات الآجلة',
    addCustomerBtn: 'إضافة عميل جديد',
    customerNameLabel: 'اسم العميل',
    phoneLabel: 'رقم الموبايل',
    nationalOrTaxId: 'الرقم القومي / البطاقة الضريبية',
    customerTypeLabel: 'فئة العميل',
    creditLimitLabel: 'الحد الائتماني',
    currentBalanceLabel: 'الرصيد الحالي (مديونية)',
    loyaltyPointsLabel: 'نقاط الولاء',

    receiptTitle: 'أسواق ومجمعات أفق النيل التجارية',
    receiptSubtitle: 'شركة مساهمة مصرية - القاهرة، جمهورية مصر العربية',
    taxRegistrationNo: 'رقم التسجيل التجاري: 200-482-913',
    commercialRegistrationNo: 'سجل تجاري: 104829 القاهرة',
    etaCompliantNotice: 'إيصال مبيعات معتمد - أسواق ومجمعات أفق النيل التجارية',
    invoiceDate: 'التاريخ',
    paymentMethodLabel: 'طريقة السداد',
    thankYouMessage: 'شكراً لتسوقكم معنا! البضاعة ترد وتستبدل خلال ١٤ يوماً بالفاتورة الأصلية.',
  },
};

export function formatEGP(amount: number, lang: Language = 'en'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
}
