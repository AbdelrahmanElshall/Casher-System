import { 
  Product, CartItem, Sale, PaymentMethod, CashSession, 
  StockMovement, Expense, Customer, Supplier, User,
  Category, AuditLog, SystemNotification, SystemSettings 
} from './types';
import { 
  INITIAL_COMPANY, INITIAL_BRANCHES, 
  INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_ACTIVE_SESSION,
  INITIAL_SALES, INITIAL_EXPENSES, INITIAL_MOVEMENTS, INITIAL_USERS 
} from './data/seed';

export function isSuperAdmin(user?: User | null): boolean {
  if (!user) return false;
  if (user.roleId === 'role-superadmin') return true;
  const roleLower = (user.roleName || '').toLowerCase();
  if (roleLower === 'super admin' || roleLower === 'مدير عام') return true;
  if (user.permissions?.includes('ALL') || user.permissions?.includes('SUPER_ADMIN')) return true;
  return false;
}

export function hasPermission(user: User | null | undefined, permissionCode: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return user.permissions?.includes(permissionCode) || user.permissions?.includes('ALL') || false;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-dairy', name: 'Dairy & Cold Cuts', nameAr: 'ألبان وأجبان ولحوم باردة', color: '#0284c7', isActive: true },
  { id: 'cat-beverages', name: 'Beverages & Water', nameAr: 'مشروبات وعصائر ومياه', color: '#10b981', isActive: true },
  { id: 'cat-snacks', name: 'Snacks & Biscuits', nameAr: 'سناكس ومقرمشات وشوكولاتة', color: '#d97706', isActive: true },
  { id: 'cat-bakery', name: 'Bakery & Bread', nameAr: 'مخبوزات وفطائر وطازج', color: '#f59e0b', isActive: true },
  { id: 'cat-staples', name: 'Staples & Grains', nameAr: 'بقوليات وأرز ومكرونة', color: '#8b5cf6', isActive: true },
  { id: 'cat-oils', name: 'Oils & Pantry', nameAr: 'زيوت وسمن وتموين', color: '#eab308', isActive: true },
  { id: 'cat-produce', name: 'Fresh Produce & Fruits', nameAr: 'خضروات وفواكه طازجة', color: '#84cc16', isActive: true },
  { id: 'cat-household', name: 'Household & Detergents', nameAr: 'منظفات وعناية منزلية', color: '#ec4899', isActive: true },
  { id: 'cat-pharmacy', name: 'Pharmaceuticals & Health', nameAr: 'صيدلية وأدوية ومستحضرات', color: '#14b8a6', isActive: true },
];

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'Nile Horizon Markets & Retail',
  companyNameAr: 'أسواق ومجمعات أفق النيل التجارية',
  taxNumber: '200-482-913',
  commercialReg: '148204-GIZA',
  currency: 'EGP',
  enableVat: false,
  vatRate: 14.0,
  receiptWidth: '80mm',
  receiptHeader: 'أهلاً بكم في أسواق أفق النيل - فرع مدينة نصر',
  receiptFooter: 'شكراً لزيارتكم! البضاعة المباعة ترد وتستبدل خلال 14 يوماً بالفاتورة الرسمية',
  lowStockThresholdDefault: 20,
  autoPrintReceipt: true,
};

const STORAGE_KEYS = {
  PRODUCTS: 'pos_eg_products_v2',
  CATEGORIES: 'pos_eg_categories_v2',
  CUSTOMERS: 'pos_eg_customers_v2',
  SUPPLIERS: 'pos_eg_suppliers_v2',
  SESSION: 'pos_eg_session_v2',
  SALES: 'pos_eg_sales_v2',
  EXPENSES: 'pos_eg_expenses_v2',
  MOVEMENTS: 'pos_eg_movements_v2',
  SETTINGS: 'pos_eg_settings_v2',
  HELD_SALES: 'pos_eg_held_sales_v2',
  LANGUAGE: 'pos_eg_lang_v2',
  USERS: 'pos_eg_users_v2',
  CURRENT_USER: 'pos_eg_current_user_v2',
  AUDIT_LOGS: 'pos_eg_audit_logs_v2',
  NOTIFICATIONS: 'pos_eg_notifications_v2',
};

export class PosStorageEngine {
  static getLanguage(): 'en' | 'ar' {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (saved === 'ar' || saved === 'en') return saved;
    return 'ar'; // Default to Arabic for Egypt implementation
  }

  static setLanguage(lang: 'en' | 'ar'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  }

  static getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static getProductByBarcode(barcode: string): Product | undefined {
    const products = this.getProducts();
    const clean = barcode.trim().toLowerCase();
    return products.find(p => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean);
  }

  static getActiveSession(): CashSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(INITIAL_ACTIVE_SESSION));
      return INITIAL_ACTIVE_SESSION;
    }
    return JSON.parse(raw);
  }

  static saveSession(session: CashSession | null): void {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }

  static getSales(): Sale[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
      return INITIAL_SALES;
    }
    const parsed: Sale[] = JSON.parse(raw);
    if (parsed.length <= 1 || parsed.some(s => s.taxAmount > 0)) {
      const sanitized = parsed.map(s => ({
        ...s,
        taxAmount: 0,
        grandTotal: Number((s.subtotal - s.discountAmount).toFixed(2)),
        items: s.items.map(i => ({
          ...i,
          taxRate: 0,
          taxAmount: 0,
          lineTotal: Number((i.quantity * i.unitPrice - (i.discountAmount || 0)).toFixed(2))
        }))
      }));
      const existingIds = new Set(sanitized.map(s => s.id));
      const merged = [...sanitized, ...INITIAL_SALES.filter(s => !existingIds.has(s.id))];
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  }

  static getExpenses(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    const parsed: Expense[] = JSON.parse(raw);
    if (parsed.length <= 1) {
      const existingIds = new Set(parsed.map(e => e.id));
      const merged = [...parsed, ...INITIAL_EXPENSES.filter(e => !existingIds.has(e.id))];
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  }

  static getMovements(): StockMovement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(raw);
  }

  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'currentBalance' | 'loyaltyPoints' | 'isActive'>, performedBy?: User): { success: boolean; customer?: Customer; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'CREATE_CUSTOMER')) {
      return { success: false, error: 'صلاحية مرفوضة: لا تملك صلاحية إضافة عميل (CREATE_CUSTOMER).' };
    }
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: `cust-eg-${Date.now()}`,
      currentBalance: 0,
      loyaltyPoints: 0,
      isActive: true,
    };
    customers.push(newCust);
    this.saveCustomers(customers);
    
    this.addAuditLog({
      userId: performedBy?.id || 'system',
      userName: performedBy?.name || 'System',
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: newCust.id,
      newValues: { name: newCust.name },
    });

    return { success: true, customer: newCust };
  }

  static updateCustomer(id: string, updates: Partial<Customer>, performedBy?: User): { success: boolean; customer?: Customer; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'EDIT_CUSTOMER')) {
      return { success: false, error: 'صلاحية مرفوضة: لا تملك صلاحية تعديل بيانات العملاء (EDIT_CUSTOMER).' };
    }
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, error: 'العميل غير موجود' };
    customers[idx] = { ...customers[idx], ...updates };
    this.saveCustomers(customers);
    
    this.addAuditLog({
      userId: performedBy?.id || 'system',
      userName: performedBy?.name || 'System',
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: id,
      newValues: updates as Record<string, unknown>,
    });

    return { success: true, customer: customers[idx] };
  }

  // --- USER AUTHENTICATION & MANAGEMENT ---
  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const users: User[] = JSON.parse(raw);
    // Ensure seed admin and cashier have passwords if missing
    let modified = false;
    const fixed = users.map(u => {
      if (u.id === 'usr-admin' && !u.password) {
        modified = true;
        return { ...u, password: 'admin123' };
      }
      if (u.id === 'usr-cashier' && !u.password) {
        modified = true;
        return { ...u, password: 'cashier123' };
      }
      return u;
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(fixed));
      return fixed;
    }
    return users;
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static addUser(user: Omit<User, 'id' | 'companyId' | 'status'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      companyId: INITIAL_COMPANY.id,
      status: 'ACTIVE',
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  static getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const all = this.getUsers();
        const found = all.find(x => x.id === u.id);
        if (found) return found;
      } catch {}
    }
    const defaultUser = this.getUsers()[0] || INITIAL_USERS[0];
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static authenticate(usernameOrEmail: string, password: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const user = users.find(u => 
      u.username.toLowerCase() === cleanInput || 
      u.email.toLowerCase() === cleanInput
    );
    if (!user) {
      return { success: false, error: 'User not found / اسم المستخدم غير موجود' };
    }
    if (user.password && user.password !== password) {
      return { success: false, error: 'Incorrect password / كلمة المرور غير صحيحة' };
    }
    this.setCurrentUser(user);
    return { success: true, user };
  }

  static getSuppliers(): Supplier[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  }

  /**
   * ATOMIC TRANSACTION FOR POS CHECKOUT IN EGYPT
   */
  static processSaleTransaction(params: {
    cart: CartItem[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    customerId?: string;
    customerName?: string;
    branchId: string;
    branchName?: string;
    warehouseId: string;
    cashierId: string;
    cashierName: string;
    notes?: string;
    specialCustomerDiscount?: number;
    discountReason?: string;
  }): { success: boolean; sale?: Sale; error?: string } {
    try {
      const products = this.getProducts();
      const currentSession = this.getActiveSession();
      if (!currentSession || currentSession.status !== 'OPEN') {
        return { success: false, error: 'No active Cash Register shift is open. Please open a shift first.' };
      }

      // 1. Stock Validation
      for (const item of params.cart) {
        const prod = products.find(p => p.id === item.product.id);
        if (!prod) {
          return { success: false, error: `Product "${item.product.name}" was not found in catalog.` };
        }
        if (!prod.allowNegativeStock && prod.currentStock < item.quantity) {
          return { 
            success: false, 
            error: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Cart: ${item.quantity}` 
          };
        }
      }

      // 2. Financial Calculations (No tax calculated)
      const subtotal = params.cart.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
      const cartDiscount = params.cart.reduce((acc, i) => acc + i.discountAmount, 0);

      // DISCOUNT RULE: Can not add discount except invoice over 300 EGP
      let specialDisc = params.specialCustomerDiscount || 0;
      if (specialDisc > 0 && subtotal <= 300) {
        return {
          success: false,
          error: 'Discount is not permitted for invoices of 300 EGP or less / لا يمكن إضافة خصم إلا للفواتير التي تتجاوز ٣٠٠ ج.م'
        };
      }

      const totalDiscount = Number((cartDiscount + specialDisc).toFixed(2));
      const taxAmount = 0;
      const grandTotal = Number(Math.max(0, subtotal - totalDiscount).toFixed(2));
      const changeAmount = Number(Math.max(0, params.paidAmount - grandTotal).toFixed(2));

      const branchObj = INITIAL_BRANCHES.find(b => b.id === params.branchId);
      const branchName = params.branchName || branchObj?.name || 'Nasr City Flagship Hypermarket (مدينة نصر)';

      const invoiceNo = `INV-EG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const saleId = `sale-${Date.now()}`;

      // 3. Stock Deductions & Movement Logging
      const movements = this.getMovements();
      const updatedProducts = products.map(p => {
        const cartItem = params.cart.find(ci => ci.product.id === p.id);
        if (cartItem) {
          const prevQty = p.currentStock;
          const newQty = Number((prevQty - cartItem.quantity).toFixed(3));
          
          movements.unshift({
            id: `mov-${Date.now()}-${p.id}`,
            warehouseId: params.warehouseId,
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            userName: params.cashierName,
            type: 'SALE',
            quantity: -cartItem.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            unitCost: p.costPrice,
            referenceType: 'SALE',
            referenceId: saleId,
            reason: `POS Sale ${invoiceNo}`,
            createdAt: new Date().toISOString(),
          });

          return { ...p, currentStock: newQty };
        }
        return p;
      });

      // 4. Record Completed Sale
      const newSale: Sale = {
        id: saleId,
        invoiceNo,
        companyId: INITIAL_COMPANY.id,
        branchId: params.branchId,
        branchName,
        warehouseId: params.warehouseId,
        cashSessionId: currentSession.id,
        cashierId: params.cashierId,
        cashierName: params.cashierName,
        customerId: params.customerId,
        customerName: params.customerName,
        status: 'COMPLETED',
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: totalDiscount,
        specialCustomerDiscount: specialDisc > 0 ? specialDisc : undefined,
        discountReason: params.discountReason,
        taxAmount: 0,
        grandTotal,
        paidAmount: params.paidAmount,
        changeAmount,
        paymentMethod: params.paymentMethod,
        notes: params.notes,
        items: params.cart.map(i => ({
          id: `si-${Date.now()}-${i.product.id}`,
          saleId,
          productId: i.product.id,
          productName: i.product.name,
          unit: i.product.unit,
          quantity: i.quantity,
          unitCost: i.unitCost,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount,
          taxRate: 0,
          taxAmount: 0,
          lineTotal: Number((i.unitPrice * i.quantity - i.discountAmount).toFixed(2)),
        })),
        payments: [
          {
            id: `sp-${Date.now()}`,
            saleId,
            paymentMethod: params.paymentMethod,
            amount: params.paidAmount,
          }
        ],
        createdAt: new Date().toISOString(),
      };

      // 5. Update Cash Session Accumulators if Cash
      if (params.paymentMethod === 'CASH') {
        currentSession.totalSalesAmount = Number((currentSession.totalSalesAmount + grandTotal).toFixed(2));
        currentSession.expectedCash = Number((currentSession.openingCash + currentSession.totalSalesAmount - currentSession.totalRefundsAmount - currentSession.totalExpensesAmount).toFixed(2));
        this.saveSession(currentSession);
      }

      // Persist State Commit
      this.saveProducts(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
      
      const sales = this.getSales();
      sales.unshift(newSale);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      // Add notification for Admin/Super Admin
      this.addNotification({
        title: "New Sale Completed",
        message: `Sale ${invoiceNo} completed by ${params.cashierName} for ${grandTotal.toFixed(2)}.`,
        type: "INFO",
        linkModule: "POS"
      });

      return { success: true, sale: newSale };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database transactional failure.';
      return { success: false, error: msg };
    }
  }

  static addExpense(expense: Omit<Expense, 'id' | 'createdAt'>, performedBy?: User): { success: boolean; expense?: Expense; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'CREATE_EXPENSE_VOUCHER') && !hasPermission(performedBy, 'FIN_MANAGE_EXPENSE')) {
      return { success: false, error: 'صلاحية مرفوضة: لا تملك صلاحية إنشاء طلب مصروف (CREATE_EXPENSE_VOUCHER).' };
    }
    
    // Auto-approve if user is Admin, otherwise pending
    const isAdmin = performedBy && (isSuperAdmin(performedBy) || hasPermission(performedBy, 'FIN_MANAGE_EXPENSE'));
    const initialStatus = isAdmin ? 'APPROVED' : 'PENDING_APPROVAL';

    const expenses = this.getExpenses();
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExp);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    if (initialStatus === 'PENDING_APPROVAL') {
      this.addNotification({
        title: 'طلب مصروف جديد (New Expense Request)',
        message: `تم إنشاء طلب مصروف بمبلغ ${expense.amount} ج.م بواسطة ${expense.userName || performedBy?.name}. ينتظر المراجعة والاعتماد.`,
        type: 'INFO',
        linkModule: 'FINANCE'
      });
    }

    // Update active session cash deduction ONLY if approved
    if (initialStatus === 'APPROVED') {
      const session = this.getActiveSession();
      if (session && expense.paymentMethod === 'CASH') {
        session.totalExpensesAmount = Number((session.totalExpensesAmount + expense.amount).toFixed(2));
        session.expectedCash = Number((session.openingCash + session.totalSalesAmount - session.totalRefundsAmount - session.totalExpensesAmount).toFixed(2));
        this.saveSession(session);
      }
    }

    this.addAuditLog({
      userId: performedBy?.id || 'system',
      userName: performedBy?.name || 'System',
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: newExp.id,
      newValues: { amount: newExp.amount, title: newExp.title, status: newExp.status },
    });

    return { success: true, expense: newExp };
  }

  static updateExpense(id: string, updates: Partial<Expense>, performedBy?: User): { success: boolean; expense?: Expense; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'FIN_MANAGE_EXPENSE')) {
      return { success: false, error: 'صلاحية مرفوضة: إدارة المصروفات تتطلب صلاحيات المشرف.' };
    }
    const expenses = this.getExpenses();
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, error: 'المصروف غير موجود' };
    const oldExp = expenses[idx];

    // If changing from PENDING to APPROVED
    const isApproving = oldExp.status !== 'APPROVED' && updates.status === 'APPROVED';

    const updated: Expense = { ...oldExp, ...updates };
    expenses[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    if (oldExp.status !== updated.status && (updated.status === 'APPROVED' || updated.status === 'REJECTED')) {
      this.addNotification({
        title: updated.status === 'APPROVED' ? 'تم اعتماد المصروف (Expense Approved)' : 'تم رفض المصروف (Expense Rejected)',
        message: `تم ${updated.status === 'APPROVED' ? 'اعتماد وصرف' : 'رفض'} المصروف "${updated.title}" الخاص بـ ${updated.userName}.`,
        type: updated.status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        linkModule: 'FINANCE'
      });
    }

    // Deduct cash if it just got approved and is CASH
    if (isApproving && updated.paymentMethod === 'CASH') {
      const session = this.getActiveSession();
      if (session) {
        session.totalExpensesAmount = Number((session.totalExpensesAmount + updated.amount).toFixed(2));
        session.expectedCash = Number((session.openingCash + session.totalSalesAmount - session.totalRefundsAmount - session.totalExpensesAmount).toFixed(2));
        this.saveSession(session);
      }
    } 
    // If amount changed for CASH that was already approved, adjust session expected cash
    else if (oldExp.status === 'APPROVED' && oldExp.paymentMethod === 'CASH' && updates.amount !== undefined && updates.amount !== oldExp.amount) {
      const session = this.getActiveSession();
      if (session) {
        const diff = updates.amount - oldExp.amount;
        session.totalExpensesAmount = Number((session.totalExpensesAmount + diff).toFixed(2));
        session.expectedCash = Number((session.openingCash + session.totalSalesAmount - session.totalRefundsAmount - session.totalExpensesAmount).toFixed(2));
        this.saveSession(session);
      }
    }

    this.addAuditLog({
      userId: performedBy?.id || 'system',
      userName: performedBy?.name || 'System',
      action: 'UPDATE_EXPENSE',
      entity: 'Expense',
      entityId: id,
      oldValues: { status: oldExp.status, amount: oldExp.amount },
      newValues: { status: updated.status, amount: updated.amount },
    });

    return { success: true, expense: updated };
  }

  // --- CATEGORY MANAGEMENT (WITH SUPER ADMIN RBAC) ---
  static getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    let cats: Category[] = raw ? JSON.parse(raw) : [...INITIAL_CATEGORIES];
    let modified = false;

    // Ensure all INITIAL_CATEGORIES are present
    INITIAL_CATEGORIES.forEach(initCat => {
      const exists = cats.some(c => c.id === initCat.id || c.name.toLowerCase() === initCat.name.toLowerCase());
      if (!exists) {
        cats.push(initCat);
        modified = true;
      }
    });

    // Also auto-discover any categories used on products in stock
    const products = this.getProducts();
    products.forEach(p => {
      if (!p.categoryName) return;
      const cleanName = p.categoryName.trim();
      const exists = cats.some(c => 
        c.id === p.categoryId || 
        c.name.toLowerCase() === cleanName.toLowerCase() ||
        (c.nameAr && c.nameAr.toLowerCase() === cleanName.toLowerCase()) ||
        cleanName.toLowerCase().includes(c.name.toLowerCase()) ||
        (c.nameAr && cleanName.toLowerCase().includes(c.nameAr.toLowerCase()))
      );

      if (!exists) {
        let enName = cleanName;
        let arName = cleanName;
        if (cleanName.includes('(') && cleanName.includes(')')) {
          const parts = cleanName.split('(');
          enName = parts[0].trim();
          arName = parts[1].replace(')', '').trim();
        }
        const newId = `cat-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;
        cats.push({
          id: newId,
          name: enName,
          nameAr: arName,
          color: '#0f766e',
          isActive: true,
        });
        modified = true;
      }
    });

    if (modified || !raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    }
    return cats;
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static addCategory(categoryData: Omit<Category, 'id'>, performedBy?: User): { success: boolean; category?: Category; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'CREATE_CATEGORY')) {
      return {
        success: false,
        error: 'صلاحية مرفوضة: لا تملك صلاحية إضافة التصنيفات (CREATE_CATEGORY).'
      };
    }
    const categories = this.getCategories();
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      isActive: true,
    };
    categories.push(newCat);
    this.saveCategories(categories);

    this.addAuditLog({
      userId: performedBy?.id || 'usr-admin',
      userName: performedBy?.name || 'Super Admin',
      action: 'CREATE_CATEGORY',
      entity: 'Category',
      entityId: newCat.id,
      newValues: { name: newCat.name, nameAr: newCat.nameAr },
    });

    return { success: true, category: newCat };
  }

  static deleteCategory(id: string, performedBy?: User): { success: boolean; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'EDIT_CATEGORY')) {
      return {
        success: false,
        error: 'صلاحية مرفوضة: لا تملك صلاحية حذف/تعديل التصنيفات (EDIT_CATEGORY).'
      };
    }
    const categories = this.getCategories();
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return { success: false, error: 'التصنيف غير موجود' };

    // Check if products belong to this category
    const products = this.getProducts();
    const hasProducts = products.some(p => p.categoryId === id || p.categoryName === catToDelete.name || p.categoryName === catToDelete.nameAr);
    if (hasProducts) {
      return {
        success: false,
        error: 'لا يمكن حذف هذا التصنيف لوجود منتجات مرتبطة به حالياً. يرجى نقل أو تعديل المنتجات أولاً.'
      };
    }

    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered);

    this.addAuditLog({
      userId: performedBy?.id || 'usr-admin',
      userName: performedBy?.name || 'Super Admin',
      action: 'DELETE_CATEGORY',
      entity: 'Category',
      entityId: id,
      oldValues: { name: catToDelete.name, nameAr: catToDelete.nameAr },
    });

    return { success: true };
  }

  // --- PRODUCT MANAGEMENT (WITH SUPER ADMIN RBAC) ---
  static addProduct(prodData: Omit<Product, 'id' | 'companyId'>, performedBy?: User): { success: boolean; product?: Product; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'CREATE_PRODUCT')) {
      return {
        success: false,
        error: 'صلاحية مرفوضة: لا تملك صلاحية إضافة المنتجات الجديدة (CREATE_PRODUCT).'
      };
    }

    const products = this.getProducts();
    // Validate barcode uniqueness
    if (products.some(p => p.barcode === prodData.barcode)) {
      return { success: false, error: 'الباركود مسجل بالفعل لصنف آخر. يرجى اختيار باركود فريد.' };
    }

    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      companyId: INITIAL_COMPANY.id,
      isActive: true,
    };
    products.unshift(newProd);
    this.saveProducts(products);

    // If initial stock > 0, log opening balance movement
    if (newProd.currentStock > 0) {
      const movs = this.getMovements();
      movs.unshift({
        id: `mov-init-${Date.now()}`,
        warehouseId: 'wh-main',
        productId: newProd.id,
        productName: newProd.name,
        productSku: newProd.sku,
        userName: performedBy?.name || 'System',
        type: 'OPENING_BALANCE',
        quantity: newProd.currentStock,
        previousQuantity: 0,
        newQuantity: newProd.currentStock,
        unitCost: newProd.costPrice,
        reason: 'رصيد افتتاحي لصنف جديد',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movs));
    }

    this.addAuditLog({
      userId: performedBy?.id || 'system',
      userName: performedBy?.name || 'System',
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: newProd.id,
      newValues: { name: newProd.name, nameAr: newProd.nameAr, price: newProd.sellingPrice, stock: newProd.currentStock },
    });

    return { success: true, product: newProd };
  }

  static deleteProduct(id: string, performedBy?: User): { success: boolean; error?: string } {
    if (performedBy && !hasPermission(performedBy, 'EDIT_PRODUCT')) {
      return {
        success: false,
        error: 'صلاحية مرفوضة: لا تملك صلاحية حذف/تعديل المنتجات من المخزون (EDIT_PRODUCT).'
      };
    }

    const products = this.getProducts();
    const prodToDelete = products.find(p => p.id === id);
    if (!prodToDelete) return { success: false, error: 'المنتج غير موجود' };

    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);

    this.addAuditLog({
      userId: performedBy?.id || 'usr-admin',
      userName: performedBy?.name || 'Super Admin',
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldValues: { name: prodToDelete.name, sku: prodToDelete.sku, barcode: prodToDelete.barcode },
    });

    return { success: true };
  }

  // --- AUDIT LOGS (IMMUTABLE LOGGING) ---
  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initLogs: AuditLog[] = [
        {
          id: 'aud-001',
          userId: 'usr-admin',
          userName: 'Dr. Ahmed El-Shennawy (د. أحمد الشناوي)',
          action: 'SYSTEM_BOOT',
          entity: 'SYSTEM',
          newValues: { status: 'Egyptian POS Production Ready' },
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'aud-002',
          userId: 'usr-admin',
          userName: 'Dr. Ahmed El-Shennawy (د. أحمد الشناوي)',
          action: 'OPEN_SESSION',
          entity: 'CashSession',
          entityId: 'sess-cai-001',
          newValues: { openingCash: 3500 },
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initLogs));
      return initLogs;
    }
    return JSON.parse(raw);
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // keep max 500 logs for performance
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  }

  // --- NOTIFICATIONS & ALERTS ---
  static getNotifications(): SystemNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      const autoGenerated = this.generateSystemAlerts();
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(autoGenerated));
      return autoGenerated;
    }
    const saved: SystemNotification[] = JSON.parse(raw);
    return saved;
  }

  static generateSystemAlerts(): SystemNotification[] {
    const alerts: SystemNotification[] = [];
    const products = this.getProducts();

    const lowStock = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    if (lowStock.length > 0) {
      alerts.push({
        id: 'notif-low-stock',
        title: 'تنبيه نقص المخزون (Low Stock Alert)',
        message: `يوجد عدد ${lowStock.length} أصناف اقتربت من النفاد (أقل من حد الأمان)، مثل: ${lowStock.slice(0, 2).map(p => p.nameAr || p.name).join('، ')}.`,
        type: 'WARNING',
        createdAt: new Date().toISOString(),
        read: false,
        linkModule: 'INVENTORY'
      });
    }

    const outOfStock = products.filter(p => p.currentStock <= 0);
    if (outOfStock.length > 0) {
      alerts.push({
        id: 'notif-out-stock',
        title: 'نفاد رصيد أصناف بالكامل (Out of Stock)',
        message: `يوجد عدد ${outOfStock.length} أصناف رصيدها صفر حالياً في المخزن الرئيسي.`,
        type: 'ALERT',
        createdAt: new Date().toISOString(),
        read: false,
        linkModule: 'INVENTORY'
      });
    }

    alerts.push({
      id: 'notif-eta-qr',
      title: 'امتثال الفاتورة الإلكترونية المصرية (ETA Ready)',
      message: 'نظام نقاط البيع يدعم التشفير الكامل لـ QR Code ورموز التحقق الرقمية طبقاً لمعايير مصلحة الضرائب المصرية.',
      type: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      linkModule: 'POS'
    });

    return alerts;
  }

  static addNotification(notif: Omit<SystemNotification, 'id' | 'createdAt' | 'read'>): void {
    const notifs = this.getNotifications();
    notifs.unshift({
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  static markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    }
  }

  static markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications();
    notifs.forEach(n => { n.read = true; });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  // --- SYSTEM SETTINGS ---
  static getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  }

  static saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.addAuditLog({
      userId: 'usr-admin',
      userName: 'Dr. Ahmed El-Shennawy',
      action: 'UPDATE_SETTINGS',
      entity: 'SystemSettings',
      newValues: { vatRate: settings.vatRate, receiptWidth: settings.receiptWidth },
    });
  }

  static resetToEgyptianDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(INITIAL_ACTIVE_SESSION));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
}
