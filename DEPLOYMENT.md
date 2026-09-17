# Nile Horizon POS Egypt - Production Deployment & Operations Guide

## Overview
Enterprise Point-of-Sale (POS) System tailored for the Egyptian retail and grocery market, supporting Egyptian Pound (EGP), authorized Egyptian banknote tender denominations (5, 10, 20, 50, 100, 200 EGP), Egyptian Tax Authority (ETA) B2C/B2B invoicing with QR verification, customer credit segmentation, Super Admin RBAC for inventory catalog management, and full bilingual Arabic/English operation.

---

## 1. Quick Start with Docker
```bash
# 1. Build the production image
docker compose build

# 2. Start the container in detached mode
docker compose up -d

# 3. Verify health status
docker compose ps
```
The application will be accessible at: `http://localhost:3000`.

---

## 2. Environment Variables
No third-party secrets required for base operation.
Create `.env` if custom environment variables are needed:
```env
PORT=3000
NODE_ENV=production
```

---

## 3. Security & Governance (RBAC)
- **Super Admin Credentials**:
  - Username: `admin`
  - Password: `admin123`
  - Capabilities: Full access to add/delete products, add/delete categories, adjust stock, manage system settings, view security audit logs.
- **Cashier Credentials**:
  - Username: `cashier1`
  - Password: `cashier123`
  - Capabilities: POS checkout, receipt printing, customer lookup, cash drawer tender. Product & Category creation and deletion are strictly blocked.

---

## 4. Egyptian Market Rules
1. **Currency**: All transactions are denominated in Egyptian Pounds (EGP / ج.م) with 2 decimal places.
2. **Banknotes**: Tender keypad strictly provides 5, 10, 20, 50, 100, 200 EGP. (Invalid denominations like 500 or 1000 EGP are prohibited).
3. **Discount Threshold**: Special Customer VIP discounts require an invoice subtotal of at least 300 EGP.
4. **ETA Invoicing**: Receipts provide commercial registration and tax identification compliant with Egyptian Tax Authority guidelines.
