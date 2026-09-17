import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CashSession } from '../types';
import { PosStorageEngine } from '../storage';
import { Language, TRANSLATIONS, formatEGP } from '../utils/i18n';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: () => void;
  lang: Language;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, onSessionUpdated, lang }) => {
  const t = TRANSLATIONS[lang];
  const activeSession = PosStorageEngine.getActiveSession();
  const [openingFloat, setOpeningFloat] = useState<string>('1500.00');
  const [closingCount, setClosingCount] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOpenShift = activeSession && activeSession.status === 'OPEN';

  const handleOpenShift = () => {
    const floatAmount = parseFloat(openingFloat);
    if (isNaN(floatAmount) || floatAmount < 0) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال مبلغ عهدة بداية وردية صحيح.' : 'Please enter a valid positive opening cash float.');
      return;
    }

    const newSession: CashSession = {
      id: `sess-${Date.now()}`,
      cashRegisterId: 'reg-nasr-01',
      cashRegisterName: lang === 'ar' ? 'نقطة بيع 01 - هايبر ماركت مدينة نصر' : 'Terminal 01 - Nasr City Hypermarket',
      cashierId: 'usr-admin',
      cashierName: lang === 'ar' ? 'د. أحمد الشناوي' : 'Dr. Ahmed El-Shennawy',
      openingCash: floatAmount,
      expectedCash: floatAmount,
      totalSalesAmount: 0,
      totalRefundsAmount: 0,
      totalExpensesAmount: 0,
      status: 'OPEN',
      notes: lang === 'ar' ? 'تم فتح الوردية وإيداع عهدة البداية' : 'Shift initialized with opening float.',
      openedAt: new Date().toISOString(),
    };

    PosStorageEngine.saveSession(newSession);
    onSessionUpdated();
    onClose();
  };

  const handleCloseShift = () => {
    if (!activeSession) return;
    const physicalCount = parseFloat(closingCount);
    if (isNaN(physicalCount) || physicalCount < 0) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال المبلغ الفعلي المعدود في الدرج.' : 'Please enter the counted physical cash amount.');
      return;
    }

    const expected = activeSession.expectedCash || (activeSession.openingCash + activeSession.totalSalesAmount - activeSession.totalExpensesAmount);
    const difference = Number((physicalCount - expected).toFixed(2));

    const closedSession: CashSession = {
      ...activeSession,
      closingCash: physicalCount,
      expectedCash: expected,
      difference,
      status: 'CLOSED',
      notes: closingNotes || (lang === 'ar' ? 'إغلاق الوردية وإجراء الجرد' : 'Shift reconciled and closed'),
      closedAt: new Date().toISOString(),
    };

    PosStorageEngine.saveSession(closedSession);
    onSessionUpdated();
    onClose();
  };

  const expectedVal = activeSession ? (activeSession.expectedCash ?? (activeSession.openingCash + activeSession.totalSalesAmount - activeSession.totalExpensesAmount)) : 0;
  const countedVal = parseFloat(closingCount) || 0;
  const variance = countedVal - expectedVal;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOpenShift ? <Lock className="w-5 h-5 text-emerald-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
            <h3 className="font-extrabold text-sm">
              {isOpenShift ? t.closeShiftTitle : t.openShiftTitle}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isOpenShift ? (
            /* CLOSE SHIFT FORM & RECONCILIATION */
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t.shiftOpenedAt}:</span>
                  <span className="font-medium">
                    {new Date(activeSession.openedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t.openingFloat}:</span>
                  <span className="font-mono">{formatEGP(activeSession.openingCash, lang)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t.cashSales}:</span>
                  <span className="font-mono text-emerald-700">+ {formatEGP(activeSession.totalSalesAmount, lang)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t.cashExpenses}:</span>
                  <span className="font-mono text-rose-600">- {formatEGP(activeSession.totalExpensesAmount, lang)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black pt-1.5 border-t border-slate-200 text-sm">
                  <span>{t.expectedCashInDrawer}:</span>
                  <span className="font-mono text-emerald-800">{formatEGP(expectedVal, lang)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.actualCashCounted}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closingCount}
                  onChange={e => setClosingCount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {closingCount !== '' && (
                <div className={`p-3 rounded-xl text-xs font-bold flex justify-between items-center ${
                  variance === 0 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : variance > 0 
                    ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span>{t.discrepancy}:</span>
                  <span className="text-sm font-mono">
                    {variance > 0 
                      ? `+${formatEGP(variance, lang)} (${t.surplus})` 
                      : variance < 0 
                      ? `-${formatEGP(Math.abs(variance), lang)} (${t.shortage})` 
                      : t.exactBalance}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {lang === 'ar' ? 'ملاحظات إغلاق الوردية (اختياري)' : 'Closing Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'تم جرد الدرج وتسليم العهدة' : 'Shift count verified'}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleCloseShift}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs cursor-pointer"
                >
                  {t.confirmCloseShift}
                </button>
              </div>
            </div>
          ) : (
            /* OPEN SHIFT FORM */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ar' 
                  ? 'يرجى إدخال مبلغ عهدة الفكة والنقدية لبداية الوردية في درج الكاشير قبل بدء تسجيل المبيعات.'
                  : 'Enter the initial cash float count present in the drawer to open this register session.'}
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.openingFloat} (EGP / ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(e.target.value)}
                  placeholder="1500.00"
                  className="w-full text-xl font-black font-mono py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleOpenShift}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> {t.confirmOpenShift}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
