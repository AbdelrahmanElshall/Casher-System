-- ==============================================================================
-- UNIVERSAL POS & ERP SYSTEM - CORE RELATIONAL SCHEMA MIGRATION V1.0.0
-- Target Engine: PostgreSQL 14+ / Compatible SQL Engine
-- Numeric Precision: NUMERIC(15, 4) for Currency, NUMERIC(12, 3) for Quantities
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    CREATE TYPE shift_status AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');
    CREATE TYPE sale_status AS ENUM ('COMPLETED', 'HELD', 'CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED');
    CREATE TYPE purchase_status AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');
    CREATE TYPE movement_type AS ENUM (
        'OPENING_BALANCE', 'PURCHASE', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 
        'DAMAGE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'EXPIRED', 'CORRECTION'
    );
    CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'WALLET', 'CUSTOMER_CREDIT', 'SPLIT');
    CREATE TYPE product_type AS ENUM ('STANDARD', 'WEIGHT_BASED', 'VARIANT', 'PHARMACY_MEDICINE', 'SERVICE');
    CREATE TYPE transfer_status AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ORGANIZATIONAL ENTITIES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_number VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, code)
);

CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, identifier)
);

-- 4. AUTHENTICATION & ACCESS CONTROL (RBAC/PBAC)
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    phone VARCHAR(50),
    status user_status NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCT CATALOG & PRICING
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    product_type product_type NOT NULL DEFAULT 'STANDARD',
    unit VARCHAR(50) NOT NULL DEFAULT 'PIECE',
    cost_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    selling_price NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    wholesale_price NUMERIC(15, 4),
    min_selling_price NUMERIC(15, 4),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    max_stock NUMERIC(12, 3),
    reorder_point NUMERIC(12, 3) NOT NULL DEFAULT 10.000,
    is_active BOOLEAN DEFAULT TRUE,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    has_expiry BOOLEAN DEFAULT FALSE,
    has_serial BOOLEAN DEFAULT FALSE,
    description TEXT,
    image_url TEXT,
    -- Domain specific (Pharmacy)
    active_ingredient VARCHAR(255),
    prescription_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, sku),
    UNIQUE(company_id, barcode)
);

CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'ALIAS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(barcode)
);

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    cost_price NUMERIC(15, 4) NOT NULL,
    selling_price NUMERIC(15, 4),
    expiry_date DATE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id, batch_number)
);

-- 6. INVENTORY & STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    reserved_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type movement_type NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL, -- Positive for increase, negative for decrease
    previous_quantity NUMERIC(12, 3) NOT NULL,
    new_quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    reference_type VARCHAR(50), -- SALE, PURCHASE, RETURN, ADJUSTMENT, TRANSFER
    reference_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    tax_number VARCHAR(100),
    address TEXT,
    customer_type VARCHAR(50) DEFAULT 'WALK_IN', -- WALK_IN, REGULAR, VIP, CREDIT
    credit_limit NUMERIC(15, 4) DEFAULT 0.0000,
    current_balance NUMERIC(15, 4) DEFAULT 0.0000,
    loyalty_points NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    tax_number VARCHAR(100),
    address TEXT,
    payment_terms_days INTEGER DEFAULT 30,
    current_balance NUMERIC(15, 4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CASH SESSIONS & SHIFTS
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    opening_cash NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    closing_cash NUMERIC(15, 4),
    expected_cash NUMERIC(15, 4),
    difference NUMERIC(15, 4),
    total_sales_amount NUMERIC(15, 4) DEFAULT 0.0000,
    total_refunds_amount NUMERIC(15, 4) DEFAULT 0.0000,
    total_expenses_amount NUMERIC(15, 4) DEFAULT 0.0000,
    status shift_status NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 9. SALES & PAYMENTS
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    cash_session_id UUID REFERENCES cash_sessions(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    status sale_status NOT NULL DEFAULT 'COMPLETED',
    subtotal NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    grand_total NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    paid_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    change_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID REFERENCES product_batches(id),
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL,
    unit_price NUMERIC(15, 4) NOT NULL,
    discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    line_total NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount NUMERIC(15, 4) NOT NULL,
    card_type VARCHAR(50),
    card_last4 VARCHAR(4),
    transaction_ref VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PURCHASES & GOODS RECEIPTS
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_no VARCHAR(100) UNIQUE NOT NULL,
    supplier_invoice_no VARCHAR(100),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status purchase_status NOT NULL DEFAULT 'RECEIVED',
    subtotal NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    grand_total NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    paid_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    tax_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    line_total NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. EXPENSES & FINANCIAL LEDGER
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_no VARCHAR(100) UNIQUE NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    user_id UUID NOT NULL REFERENCES users(id),
    cash_session_id UUID REFERENCES cash_sessions(id),
    amount NUMERIC(15, 4) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id),
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    account_code VARCHAR(50) NOT NULL,
    debit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    credit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    reference_type VARCHAR(50) NOT NULL, -- SALE, PURCHASE, EXPENSE, CASH_VARIANCE
    reference_id UUID NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_stocks_product_warehouse ON stocks(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_time ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cash_session ON sales(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
