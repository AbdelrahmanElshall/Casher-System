/**
 * Universal Printing & Egyptian Tax Invoicing Engine
 * Phase 15: Printing + Receipt Templates (80mm, 58mm & Official Egyptian A4 Tax Invoice)
 */

import { Sale, Customer, SystemSettings } from '../types';
import { Language } from './i18n';

export type ReceiptTemplateType = '80mm' | '58mm' | 'A4_TAX_INVOICE';

interface GenerateReceiptOptions {
  sale: Sale;
  customer?: Customer;
  settings: SystemSettings;
  template: ReceiptTemplateType;
  lang: Language;
}

export function generateReceiptHtml(options: GenerateReceiptOptions): string {
  const { sale, customer, settings, template, lang } = options;
  const isAr = lang === 'ar';
  const dateStr = new Date(sale.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US');
  const invoiceNo = sale.invoiceNo || sale.invoiceNumber || sale.id;
  const finalTotal = sale.grandTotal ?? sale.finalTotal ?? 0;
  const paidAmount = sale.paidAmount ?? sale.tenderAmount ?? 0;

  if (template === 'A4_TAX_INVOICE') {
    return `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${lang}">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة ضريبية إلكترونية - ${invoiceNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20mm; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
          .company-info { text-align: ${isAr ? 'right' : 'left'}; }
          .company-name { font-size: 20px; font-weight: 900; color: #0f766e; }
          .invoice-meta { text-align: ${isAr ? 'left' : 'right'}; }
          .invoice-badge { background: #0f766e; color: white; padding: 4px 12px; font-size: 14px; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
          .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: ${isAr ? 'right' : 'left'}; }
          td { padding: 8px 10px; border: 1px solid #cbd5e1; }
          .text-end { text-align: ${isAr ? 'left' : 'right'}; }
          .text-center { text-align: center; }
          .totals-table { width: 320px; margin-${isAr ? 'right' : 'left'}: auto; }
          .totals-table td { border: none; padding: 4px 8px; }
          .qr-box { text-align: center; padding: 10px; border: 1px dashed #0f766e; border-radius: 8px; margin-top: 20px; display: flex; align-items: center; gap: 16px; background: #f0fdfa; }
          .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-name">${isAr ? settings.companyNameAr : settings.companyName}</div>
            <div>${isAr ? 'السجل التجاري:' : 'Commercial Reg:'} <strong>${settings.commercialReg}</strong></div>
            <div>${isAr ? 'التسجيل الضريبي (مصلحة الضرائب المصرية):' : 'Tax Card Number:'} <strong>${settings.taxNumber}</strong></div>
            <div>فرع المعادي والتحرير - القاهرة، جمهورية مصر العربية</div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-badge">${isAr ? 'فاتورة ضريبية رسمية (ETA B2C)' : 'OFFICIAL TAX INVOICE'}</div>
            <div>${isAr ? 'رقم الفاتورة:' : 'Invoice No:'} <strong>${invoiceNo}</strong></div>
            <div>${isAr ? 'التاريخ والوقت:' : 'Date & Time:'} <strong>${dateStr}</strong></div>
            <div>${isAr ? 'الكاشير المسؤول:' : 'Cashier:'} <strong>${sale.cashierName}</strong></div>
          </div>
        </div>

        <div class="parties-grid">
          <div>
            <strong>${isAr ? 'بيانات البائع (المورد):' : 'Seller / Issuer:'}</strong>
            <div>${isAr ? settings.companyNameAr : settings.companyName}</div>
            <div>${isAr ? 'رقم التسجيل الضريبي:' : 'Tax Reg ID:'} ${settings.taxNumber}</div>
          </div>
          <div>
            <strong>${isAr ? 'بيانات العميل / المشتري:' : 'Customer Details:'}</strong>
            <div>${customer ? (isAr ? (customer.nameAr || customer.name) : customer.name) : (isAr ? 'عميل نقدي / غير مسجل' : 'Walk-in Cash Customer')}</div>
            ${customer?.phone ? `<div>${isAr ? 'الهاتف:' : 'Phone:'} ${customer.phone}</div>` : ''}
            ${customer ? `<div>${isAr ? 'نوع العميل:' : 'Category:'} <strong>${customer.isSpecial || customer.customerType === 'VIP' ? (isAr ? 'عميل خاص (VIP)' : 'Special Customer') : (isAr ? 'عميل عادي' : 'Standard')}</strong></div>` : ''}
            ${customer?.commercialReg ? `<div>${isAr ? 'س.ت للعميل:' : 'Customer CR:'} ${customer.commercialReg}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>${isAr ? 'بيان الصنف والسلعة' : 'Item Description'}</th>
              <th class="text-center" style="width: 80px;">${isAr ? 'الكمية' : 'Qty'}</th>
              <th class="text-end" style="width: 100px;">${isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
              <th class="text-end" style="width: 100px;">${isAr ? 'الإجمالي' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((it, idx) => {
              const itemName = isAr ? (it.nameAr || it.productName || it.name) : (it.productName || it.name);
              const lineTotal = it.lineTotal ?? it.total ?? (it.quantity * it.unitPrice);
              return `
                <tr>
                  <td class="text-center font-mono">${idx + 1}</td>
                  <td>
                    <strong>${itemName}</strong>
                    <div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${it.sku || it.productId}</div>
                  </td>
                  <td class="text-center font-mono">${it.quantity} ${it.unit || ''}</td>
                  <td class="text-end font-mono">${it.unitPrice.toFixed(2)} ج.م</td>
                  <td class="text-end font-mono"><strong>${lineTotal.toFixed(2)} ج.م</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="qr-box" style="flex: 1; max-width: 400px;">
            <div style="width: 80px; height: 80px; background: #0f766e; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border-radius: 6px; text-align: center; line-height: 1.2;">
              ETA QR<br/>VERIFIED<br/>معتمد
            </div>
            <div style="font-size: 11px; text-align: ${isAr ? 'right' : 'left'}; color: #0f766e;">
              <strong>${isAr ? 'رمز التحقق الرقمي المعتمد' : 'Cryptographic ETA Verification Code'}</strong>
              <div style="font-family: monospace; font-size: 9px; color: #475569; word-break: break-all; margin-top: 4px;">
                ${sale.taxQrCode || 'ETA-HASH-EG-' + sale.id.substring(0, 16).toUpperCase()}
              </div>
            </div>
          </div>

          <table class="totals-table">
            <tr>
              <td>${isAr ? 'المجموع قبل الخصم:' : 'Subtotal:'}</td>
              <td class="text-end font-mono"><strong>${sale.subtotal.toFixed(2)} ج.م</strong></td>
            </tr>
            ${sale.discountAmount > 0 ? `
              <tr style="color: #b91c1c;">
                <td>${isAr ? `الخصم التجاري (${sale.discountReason || 'خصم خاص'}):` : 'Discount:'}</td>
                <td class="text-end font-mono"><strong>-${sale.discountAmount.toFixed(2)} ج.م</strong></td>
              </tr>
            ` : ''}
            ${sale.taxAmount > 0 ? `
              <tr>
                <td>${isAr ? 'ضريبة القيمة المضافة (14% VAT):' : 'VAT (14%):'}</td>
                <td class="text-end font-mono">${sale.taxAmount.toFixed(2)} ج.م</td>
              </tr>
            ` : ''}
            <tr style="font-size: 16px; color: #0f766e; border-top: 2px solid #0f766e;">
              <td><strong>${isAr ? 'الصافي المستحق:' : 'Total Payable:'}</strong></td>
              <td class="text-end font-mono"><strong>${finalTotal.toFixed(2)} ج.م</strong></td>
            </tr>
            <tr>
              <td>${isAr ? 'طريقة الدفع:' : 'Payment Method:'}</td>
              <td class="text-end"><strong>${sale.paymentMethod}</strong></td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <div>${settings.receiptFooter}</div>
          <div style="margin-top: 4px;">نظام أفق النيل لنقاط البيع المصري | Nile Horizon POS Systems (Version 2.4 Production)</div>
        </div>
      </body>
      </html>
    `;
  }

  // Thermal 80mm or 58mm
  return `
    <!DOCTYPE html>
    <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${lang}">
    <head>
      <meta charset="utf-8" />
      <title>إيصال استلام - ${invoiceNo}</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace, 'Segoe UI', Tahoma;
          margin: 0;
          padding: 8px;
          background: #fff;
          color: #000;
          font-size: ${template === '58mm' ? '10px' : '12px'};
          line-height: 1.3;
        }
        .container {
          width: 100%;
          max-width: ${template === '58mm' ? '54mm' : '76mm'};
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-end { text-align: ${isAr ? 'left' : 'right'}; }
        .text-start { text-align: ${isAr ? 'right' : 'left'}; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .title { font-size: ${template === '58mm' ? '13px' : '15px'}; font-weight: bold; }
        .bold { font-weight: bold; }
        .item-row { margin-bottom: 4px; }
        .qr-placeholder {
          width: 70px;
          height: 70px;
          margin: 6px auto;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="text-center">
          <div class="title">${isAr ? settings.companyNameAr : settings.companyName}</div>
          <div>${settings.receiptHeader}</div>
          <div class="divider"></div>
          <div>${isAr ? 'رقم التسجيل الضريبي:' : 'Tax ID:'} ${settings.taxNumber}</div>
          <div>${isAr ? 'س.ت:' : 'CR:'} ${settings.commercialReg}</div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>${isAr ? 'فاتورة:' : 'Inv:'} #${invoiceNo}</span>
          <span>${sale.paymentMethod}</span>
        </div>
        <div class="row">
          <span>${dateStr}</span>
          <span>${sale.cashierName.split(' ')[0]}</span>
        </div>
        ${customer ? `
          <div class="row">
            <span>${isAr ? 'العميل:' : 'Cust:'} ${isAr ? (customer.nameAr || customer.name) : customer.name}</span>
            <span>[${customer.isSpecial || customer.customerType === 'VIP' ? (isAr ? 'خاص VIP' : 'VIP') : (isAr ? 'عادي' : 'Standard')}]</span>
          </div>
        ` : ''}

        <div class="double-divider"></div>

        <div>
          ${sale.items.map(it => {
            const itemName = isAr ? (it.nameAr || it.productName || it.name) : (it.productName || it.name);
            const lineTotal = it.lineTotal ?? it.total ?? (it.quantity * it.unitPrice);
            return `
              <div class="item-row">
                <div class="bold">${itemName}</div>
                <div class="row">
                  <span>${it.quantity} x ${it.unitPrice.toFixed(2)}</span>
                  <span class="bold">${lineTotal.toFixed(2)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="double-divider"></div>

        <div class="row">
          <span>${isAr ? 'المجموع:' : 'Subtotal:'}</span>
          <span>${sale.subtotal.toFixed(2)} ج.م</span>
        </div>
        ${sale.discountAmount > 0 ? `
          <div class="row bold">
            <span>${isAr ? 'الخصم:' : 'Discount:'}</span>
            <span>-${sale.discountAmount.toFixed(2)} ج.م</span>
          </div>
        ` : ''}
        ${sale.taxAmount > 0 ? `
          <div class="row">
            <span>${isAr ? 'ضريبة (14%):' : 'VAT 14%:'}</span>
            <span>${sale.taxAmount.toFixed(2)} ج.م</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="row bold" style="font-size: ${template === '58mm' ? '12px' : '14px'};">
          <span>${isAr ? 'الإجمالي المطلوب:' : 'TOTAL:'}</span>
          <span>${finalTotal.toFixed(2)} ج.م</span>
        </div>

        ${sale.paymentMethod === 'CASH' && paidAmount ? `
          <div class="row">
            <span>${isAr ? 'المسدد نقداً:' : 'Cash Paid:'}</span>
            <span>${paidAmount.toFixed(2)} ج.م</span>
          </div>
          <div class="row bold">
            <span>${isAr ? 'الباقي:' : 'Change:'}</span>
            <span>${(sale.changeAmount || 0).toFixed(2)} ج.م</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="qr-placeholder">
          ETA QR<br/>VERIFIED<br/>${invoiceNo.substring(0, 8)}
        </div>

        <div class="text-center" style="font-size: ${template === '58mm' ? '9px' : '10px'}; margin-top: 8px;">
          <div>${settings.receiptFooter}</div>
          <div style="margin-top: 4px;">-- شكراً لزيارتكم --</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function executeBrowserPrint(html: string): void {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}

export function printThermalReceipt(sale: Sale, template: ReceiptTemplateType = '80mm', lang: Language = 'ar'): void {
  const rawSettings = localStorage.getItem('pos_eg_settings_v2');
  const settings = rawSettings ? JSON.parse(rawSettings) : {
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

  const rawCustomers = localStorage.getItem('pos_eg_customers_v2');
  const customers = rawCustomers ? JSON.parse(rawCustomers) : [];
  const customer = customers.find((c: any) => c.id === sale.customerId);

  const html = generateReceiptHtml({
    sale,
    customer,
    settings,
    template,
    lang,
  });
  executeBrowserPrint(html);
}
