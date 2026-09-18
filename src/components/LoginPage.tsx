import React, { useState } from 'react';
import { Store, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { PosStorageEngine } from '../storage';
import { User } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface LoginPageProps {
  onLogin: (user: User) => void;
  lang: Language;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang }) => {
  const isAr = lang === 'ar';
  const t = TRANSLATIONS[lang];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = PosStorageEngine.authenticate(username, password);
    if (res.success && res.user) {
      onLogin(res.user);
    } else {
      setError(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
    }
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <Store className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-black mb-1">POS System</h1>
          <p className="text-emerald-100 font-medium">{isAr ? 'تسجيل الدخول للنظام' : 'System Login'}</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                placeholder={isAr ? 'أدخل اسم المستخدم' : 'Enter username'}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none`}
                placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <LogIn className="w-5 h-5" />
            {isAr ? 'دخول' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
