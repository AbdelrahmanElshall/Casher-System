import React, { useState } from 'react';
import { Shield, Clock, Search, Filter, User as UserIcon, Database, ArrowRight, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';
import { PosStorageEngine } from '../storage';
import { Language } from '../utils/i18n';

interface AuditLogsViewerProps {
  lang: Language;
}

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [logs, setLogs] = useState<AuditLog[]>(() => PosStorageEngine.getAuditLogs());
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const refreshLogs = () => {
    setLogs(PosStorageEngine.getAuditLogs());
  };

  const filteredLogs = logs.filter(l => {
    const matchesAction = filterAction === 'ALL' || l.action === filterAction;
    const matchesSearch = 
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.entityId && l.entityId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('ADJUSTMENT')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>{isAr ? 'سجل التدقيق الأمني والرقابة (Audit Logs - Phase 17)' : 'Enterprise Audit & Compliance Logs'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr 
              ? 'سجل غير قابل للتعديل يوثق كافة العمليات الحساسة: إضافة وحذف الأصناف والتصنيفات وتعديل الأسعار والمخزون' 
              : 'Immutable event audit trail for regulatory compliance, security, and traceability'}
          </p>
        </div>

        <button
          onClick={refreshLogs}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isAr ? 'تحديث السجل' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، الإجراء، أو المعرف...' : 'Search logs by user, action, entity...'}
            className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">{isAr ? 'جميع العمليات الحساسة' : 'All Action Types'}</option>
            <option value="CREATE_PRODUCT">{isAr ? 'إضافة منتج (CREATE_PRODUCT)' : 'CREATE_PRODUCT'}</option>
            <option value="DELETE_PRODUCT">{isAr ? 'حذف منتج (DELETE_PRODUCT)' : 'DELETE_PRODUCT'}</option>
            <option value="CREATE_CATEGORY">{isAr ? 'إضافة تصنيف (CREATE_CATEGORY)' : 'CREATE_CATEGORY'}</option>
            <option value="DELETE_CATEGORY">{isAr ? 'حذف تصنيف (DELETE_CATEGORY)' : 'DELETE_CATEGORY'}</option>
            <option value="STOCK_ADJUSTMENT">{isAr ? 'تسوية مخزون (STOCK_ADJUSTMENT)' : 'STOCK_ADJUSTMENT'}</option>
            <option value="UPDATE_SETTINGS">{isAr ? 'تعديل الإعدادات (UPDATE_SETTINGS)' : 'UPDATE_SETTINGS'}</option>
            <option value="OPEN_SESSION">{isAr ? 'فتح وردية (OPEN_SESSION)' : 'OPEN_SESSION'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'المستخدم المنفذ' : 'User'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'نوع العملية' : 'Action'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الكيان المتأثر' : 'Entity Target'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'تفاصيل التغيير' : 'Change Details'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'فحص كامل' : 'Inspect'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-start font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="py-3 px-4 text-start">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.userName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.userId}</div>
                  </td>
                  <td className="py-3 px-4 text-start">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-start font-mono text-slate-700">
                    <span className="font-bold">{log.entity}</span>
                    {log.entityId && <span className="text-[10px] text-slate-400 block">{log.entityId}</span>}
                  </td>
                  <td className="py-3 px-4 text-start text-slate-600 max-w-xs truncate font-mono text-[11px]">
                    {log.newValues ? JSON.stringify(log.newValues) : log.oldValues ? `Old: ${JSON.stringify(log.oldValues)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                    >
                      {isAr ? 'عرض' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'تفاصيل تدقيق العملية (Audit Payload)' : 'Audit Payload Inspector'}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'المستخدم' : 'Operator'}:</span>
                  <span className="font-bold text-slate-800">{selectedLog.userName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الوقت' : 'Timestamp'}:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'العملية' : 'Action'}:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الكيان' : 'Entity'}:</span>
                  <span className="font-mono text-slate-800">{selectedLog.entity} ({selectedLog.entityId || '-'})</span>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <h4 className="font-bold text-rose-700 mb-1">{isAr ? 'القيم السابقة (Old State):' : 'Old State:'}</h4>
                  <pre className="bg-slate-950 text-rose-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <h4 className="font-bold text-emerald-700 mb-1">{isAr ? 'القيم الجديدة (New State):' : 'New State:'}</h4>
                  <pre className="bg-slate-950 text-emerald-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
