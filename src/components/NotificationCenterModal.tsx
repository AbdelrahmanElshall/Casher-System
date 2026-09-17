import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, ShieldAlert, X, Check, ArrowRight } from 'lucide-react';
import { SystemNotification } from '../types';
import { PosStorageEngine } from '../storage';
import { Language } from '../utils/i18n';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNavigateModule?: (module: 'POS' | 'INVENTORY' | 'FINANCE' | 'CUSTOMERS') => void;
  onRefreshNotifications?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateModule,
  onRefreshNotifications,
}) => {
  const isAr = lang === 'ar';
  const notifications = PosStorageEngine.getNotifications();

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    PosStorageEngine.markNotificationAsRead(id);
    onRefreshNotifications?.();
  };

  const handleMarkAllAsRead = () => {
    PosStorageEngine.markAllNotificationsAsRead();
    onRefreshNotifications?.();
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'ALERT':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                <span>{isAr ? 'مركز الإشعارات والتنبيهات الذكية' : 'System Notifications & Alerts'}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                    {unreadCount} {isAr ? 'جديد' : 'new'}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'تنبيهات المخزون، الامتثال الضريبي، والتحذيرات الرقابية' : 'Real-time stock alerts and tax compliance'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 px-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-semibold">
            {notifications.length} {isAr ? 'تنبيهات مسجلة' : 'Total Alerts'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isAr ? 'لا توجد أي إشعارات أو تنبيهات حالياً' : 'No notifications'}
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex gap-3.5 ${
                  n.read
                    ? 'bg-white border-slate-200 text-slate-700 opacity-80'
                    : 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
                }`}
              >
                <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    {n.linkModule && onNavigateModule ? (
                      <button
                        onClick={() => {
                          onNavigateModule(n.linkModule as any);
                          onClose();
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAr ? 'الانتقال للقسم المعني' : 'View Module'}</span>
                        <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                      </button>
                    ) : <div />}

                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
                      >
                        {isAr ? 'تمت القراءة' : 'Dismiss'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
