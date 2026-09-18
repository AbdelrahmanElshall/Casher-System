/**
 * Universal Retail POS & ERP - Core TypeScript Entity Types & Interfaces
 */

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ShiftStatus = 'OPEN' | 'CLOSED' | 'RECONCILED';
export type SaleStatus = 'COMPLETED' | 'HELD' | 'CANCELLED' | 'RETURNED' | 'PARTIALLY_RETURNED';
export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type MovementType = 
  | 'OPENING_BALANCE' | 'PURCHASE' | 'SALE' | 'SALE_RETURN' | 'PURCHASE_RETURN'
  | 'DAMAGE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'EXPIRED' | 'CORRECTION';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'INSTAPAY' | 'CUSTOMER_CREDIT' | 'SPLIT';
export type ProductType = 'STANDARD' | 'WEIGHT_BASED' | 'VARIANT' | 'PHARMACY_MEDICINE' | 'SERVICE';

export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  legalName?: string;
  taxNumber?: string;
  currency: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  isMain: boolean;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface Warehouse {
  id: string;
  branchId: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface CashRegister {
  id: string;
  branchId: string;
  name: string;
  identifier: string;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface User {
  id: string;
  companyId: string;
  roleId: string;
  branchId?: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone?: string;
  status: UserStatus;
  isActive?: boolean;
  roleName: string;
  permissions: string[];
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  color?: string;
  itemCount?: number;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'SUCCESS';
  createdAt: string;
  read: boolean;
  linkModule?: 'POS' | 'INVENTORY' | 'FINANCE' | 'CUSTOMERS' | 'SETTINGS' | 'AUDIT';
}

export interface SystemSettings {
  companyName: string;
  companyNameAr: string;
  taxNumber: string;
  commercialReg: string;
  currency: string;
  enableVat: boolean;
  vatRate: number;
  receiptWidth: '58mm' | '80mm';
  receiptHeader: string;
  receiptFooter: string;
  lowStockThresholdDefault: number;
  autoPrintReceipt: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId?: string;
  brandId?: string;
  name: string;
  nameAr?: string;
  sku: string;
  barcode: string;
  productType: ProductType;
  unit: string;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minSellingPrice?: number;
  taxRate: number;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  currentStock: number;
  isActive: boolean;
  allowNegativeStock: boolean;
  hasExpiry: boolean;
  hasSerial: boolean;
  description?: string;
  imageUrl?: string;
  categoryName?: string;
  brandName?: string;
  // Pharmacy domain attributes
  activeIngredient?: string;
  prescriptionRequired?: boolean;
}

export interface ProductBatch {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  costPrice: number;
  sellingPrice?: number;
  expiryDate: string;
  quantity: number;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId?: string;
  userId?: string;
  userName?: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  cashierId: string;
  cashierName: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  totalSalesAmount: number;
  totalRefundsAmount: number;
  totalExpensesAmount: number;
  status: ShiftStatus;
  notes?: string;
  openedAt: string;
  closedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  batchId?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  invoiceNumber?: string;
  companyId: string;
  branchId: string;
  branchName: string;
  warehouseId: string;
  cashSessionId?: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  finalTotal?: number;
  paidAmount: number;
  tenderAmount?: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  specialCustomerDiscount?: number;
  discountReason?: string;
  taxQrCode?: string;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  name?: string;
  nameAr?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  quantity: number;
  unitCost: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  total?: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  cardType?: string;
  cardLast4?: string;
  transactionRef?: string;
}

export interface Customer {
  id: string;
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  commercialReg?: string;
  address?: string;
  customerType: 'WALK_IN' | 'REGULAR' | 'VIP' | 'CREDIT';
  billingCycle: 'DAILY' | 'MONTHLY' | 'NONE';
  isSpecial?: boolean;
  specialDiscountRate?: number;
  creditLimit: number;
  currentBalance: number;
  loyaltyPoints: number;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  address?: string;
  paymentTermsDays: number;
  currentBalance: number;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  supplierInvoiceNo?: string;
  branchId: string;
  warehouseId: string;
  supplierId: string;
  supplierName: string;
  userId: string;
  userName: string;
  status: PurchaseStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  items: PurchaseItem[];
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Expense {
  id: string;
  expenseNo: string;
  branchId: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userName: string;
  cashSessionId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  title: string;
  description?: string;
  explanation?: string;
  payee?: string;
  expenseDate: string;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface FinancialSummary {
  todaySales: number;
  todayProfit: number;
  todayExpenses: number;
  cashInRegister: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventoryValuationCost: number;
  inventoryValuationRetail: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
}

export interface HeldSale {
  id: string;
  label: string;
  cart: CartItem[];
  customerId?: string;
  heldAt: string;
}
