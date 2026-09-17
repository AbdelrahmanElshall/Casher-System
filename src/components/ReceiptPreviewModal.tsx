import React, { useState } from 'react';
import { Printer, FileText, Check, X, Eye, Sparkles } from 'lucide-react';
import { Sale, Customer } from '../types';
import { PosStorageEngine } from '../storage';
import { Language, formatEGP } from '../utils/i18n';
import { ReceiptTemplateType, generateReceiptHtml, executeBrowserPrint } from '../utils/printer';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialSale?: Sale | null;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialSale,
}) => {
  const isAr = lang === 'ar';
  const sales = PosStorageEngine.getSales();
  const customers = PosStorageEngine.getCustomers();
  const settings = PosStorageEngine.getSettings();

  const [selectedSale, setSelectedSale] = useState<Sale>(initialSale || sales[0]);
  const [template, setTemplate] = useState<ReceiptTemplateType>('80mm');

  if (!isOpen || !selectedSale) return null;

  const customer = customers.find(c => c.id === selectedSale.customerId);
  const receiptHtml = generateReceiptHtml({
    sale: selectedSale,
    customer,
    settings,
    template,
    lang,
  });

  const handlePrint = () => {
    executeBrowserPrint(receiptHtml);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col h-[88vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">
                {isAr ? 'مركز الطباعة ومعاينة نماذج الفواتير (Phase 15)' : 'Printing & Receipt Templates Hub'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'طباعة حرارية 80 مم / 58 مم وفاتورة ضريبية رسمية A4 معتمدة' : 'Thermal 80mm/58mm and official Egyptian ETA A4 Tax Invoice'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'إرسال لأمر الطباعة' : 'Print Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Selector & Live Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Panel */}
          <div className="w-full md:w-80 bg-slate-50 border-e border-slate-200 p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
            {/* Template Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                {isAr ? 'اختر نموذج ونوع الطابعة:' : 'Select Printer Template:'}
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTemplate('80mm')}
                  className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between transition-all cursor-pointer ${
                    template === '80mm'
                      ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{isAr ? 'إيصال حراري 80 مم (قياسي)' : 'Thermal Receipt 80mm'}</div>
                    <div className="text-[10px] text-slate-500">{isAr ? 'مناسب لطابعات الكاشير وسوبر ماركت' : 'Standard POS thermal roll'}</div>
                  </div>
                  {template === '80mm' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('58mm')}
                  className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between transition-all cursor-pointer ${
                    template === '58mm'
                      ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{isAr ? 'إيصال حراري 58 مم (مضغوط)' : 'Compact Thermal 58mm'}</div>
                    <div className="text-[10px] text-slate-500">{isAr ? 'لأجهزة الدفع المحمولة ونقاط البيع الصغيرة' : 'Mini Bluetooth/Mobile POS'}</div>
                  </div>
                  {template === '58mm' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('A4_TAX_INVOICE')}
                  className={`w-full p-3 rounded-2xl border text-start flex items-center justify-between transition-all cursor-pointer ${
                    template === 'A4_TAX_INVOICE'
                      ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{isAr ? 'فاتورة ضريبية رسمية A4' : 'A4 ETA Tax Invoice'}</div>
                    <div className="text-[10px] text-slate-500">{isAr ? 'معتمدة للشركات والمؤسسات والخصم الضريبي' : 'Corporate tax invoice with QR'}</div>
                  </div>
                  {template === 'A4_TAX_INVOICE' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>
            </div>

            {/* Select Invoice to Preview */}
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                {isAr ? 'اختر الفاتورة للمعاينة:' : 'Select Invoice to Preview:'}
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {sales.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSale(s)}
                    className={`w-full p-2 rounded-xl text-start border transition-all text-xs cursor-pointer ${
                      selectedSale.id === s.id
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono">#{s.invoiceNo || s.invoiceNumber}</span>
                      <span className="font-mono text-emerald-700 font-bold">{formatEGP(s.grandTotal ?? s.finalTotal ?? 0, lang)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                      <span>{s.items.length} {isAr ? 'أصناف' : 'items'}</span>
                      <span>{s.paymentMethod}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Iframe Container */}
          <div className="flex-1 bg-slate-200/80 p-6 flex flex-col items-center justify-center overflow-auto">
            <div className="text-[11px] text-slate-500 font-bold mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'معاينة الإخراج المباشر (Live Print Render)' : 'Live Document Preview'}</span>
            </div>
            
            <div className="bg-white shadow-xl rounded-lg p-1 border border-slate-300 max-h-full overflow-hidden flex flex-col">
              <iframe
                title="Receipt Preview"
                srcDoc={receiptHtml}
                className="w-full bg-white border-0 transition-all"
                style={{
                  width: template === 'A4_TAX_INVOICE' ? '650px' : template === '80mm' ? '320px' : '260px',
                  height: '520px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
