import React, { useState } from 'react';
import { 
  Lock, UserCheck, UserPlus, KeyRound, ShieldAlert, LogOut, 
  CheckCircle2, Eye, EyeOff, Building2, Phone, Mail, Sparkles 
} from 'lucide-react';
import { User } from '../types';
import { PosStorageEngine } from '../storage';
import { Language } from '../utils/i18n';
import { INITIAL_BRANCHES } from '../data/seed';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  lang: Language;
  onClose: () => void;
  onUserChanged: (user: User) => void;
  requireLogin?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  lang,
  onClose,
  onUserChanged,
  requireLogin = false,
}) => {
  const isArabic = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'ADD_USER' | 'SWITCH'>(requireLogin ? 'LOGIN' : 'SWITCH');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Switch user state
  const [switchTargetUser, setSwitchTargetUser] = useState<User | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');

  // Add user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleName, setNewRoleName] = useState('Senior Cashier (كاشير رئيسي)');
  const [newBranchId, setNewBranchId] = useState(INITIAL_BRANCHES[0].id);
  const [addSuccessMessage, setAddSuccessMessage] = useState('');
  const [addError, setAddError] = useState('');

  if (!isOpen) return null;

  const users = PosStorageEngine.getUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const res = PosStorageEngine.authenticate(loginUsername, loginPassword);
    if (res.success && res.user) {
      onUserChanged(res.user);
      setLoginPassword('');
      onClose();
    } else {
      setLoginError(res.error || (isArabic ? 'فشل تسجيل الدخول، يرجى التأكد من البيانات' : 'Login failed, please check credentials'));
    }
  };

  const handleSwitchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTargetUser) return;
    setSwitchError('');

    const res = PosStorageEngine.authenticate(switchTargetUser.username, switchPassword);
    if (res.success && res.user) {
      onUserChanged(res.user);
      setSwitchPassword('');
      setSwitchTargetUser(null);
      onClose();
    } else {
      setSwitchError(isArabic ? 'كلمة المرور غير صحيحة لهذا المستخدم' : 'Incorrect password for selected user');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccessMessage('');

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddError(isArabic ? 'يرجى ملء جميع الحقول الإلزامية (*)' : 'Please fill all mandatory fields (*)');
      return;
    }

    // Check duplicate username
    const existing = users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (existing) {
      setAddError(isArabic ? 'اسم المستخدم هذا مسجل بالفعل لموظف آخر' : 'This username already exists');
      return;
    }

    const permissions = newRoleName.includes('Manager') || newRoleName.includes('مدير')
      ? [
          'POS_SELL', 'POS_APPLY_DISCOUNT', 'POS_OVERRIDE_DISCOUNT', 'POS_CHANGE_PRICE',
          'POS_HOLD_SALE', 'POS_VIEW_COST', 'POS_OPEN_SESSION', 'POS_CLOSE_SESSION',
          'INV_MODIFY_STOCK', 'INV_TRANSFER', 'FIN_VIEW_REPORTS', 'FIN_MANAGE_EXPENSE',
          'MANAGE_USERS', 'MANAGE_SETTINGS'
        ]
      : [
          'POS_SELL', 'POS_APPLY_DISCOUNT', 'POS_HOLD_SALE',
          'POS_OPEN_SESSION', 'POS_CLOSE_SESSION'
        ];

    const created = PosStorageEngine.addUser({
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      roleId: newRoleName.includes('Manager') ? 'role-superadmin' : 'role-cashier',
      roleName: newRoleName,
      branchId: newBranchId,
      phone: newPhone.trim() || '0100 000 0000',
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@nilehorizon.com.eg`,
      permissions,
    });

    setAddSuccessMessage(isArabic 
      ? `تم إنشاء المستخدم "${created.name}" بنجاح! يمكنه تسجيل الدخول الآن بكلمة المرور المسجلة.` 
      : `User "${created.name}" created successfully! They can now log in.`
    );

    // Reset fields
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewPhone('');
    setNewEmail('');

    // Offer to switch to newly created user
    setTimeout(() => {
      setActiveTab('LOGIN');
      setLoginUsername(created.username);
    }, 1500);
  };

  const fillQuickLogin = (uname: string, pass: string) => {
    setLoginUsername(uname);
    setLoginPassword(pass);
    setLoginError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                {isArabic ? 'إدارة الدخول والمستخدمين' : 'User Authentication & Access'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isArabic ? 'تسجيل الدخول بكلمة المرور وإضافة كاشير جديد' : 'Log in with password or register new users'}
              </p>
            </div>
          </div>

          {!requireLogin && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2">
          {!requireLogin && (
            <button
              onClick={() => { setActiveTab('SWITCH'); setSwitchTargetUser(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'SWITCH' 
                  ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                {isArabic ? 'المستخدم الحالي والتبديل' : 'Current & Switch'}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('LOGIN')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'LOGIN' 
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              {isArabic ? 'تسجيل الدخول بكلمة المرور' : 'Log In With Password'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ADD_USER')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'ADD_USER' 
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              {isArabic ? 'إضافة مستخدم جديد' : 'Add New User'}
            </span>
          </button>
        </div>

        {/* TAB 1: CURRENT USER & SWITCH USER */}
        {activeTab === 'SWITCH' && !requireLogin && (
          <div className="p-6 space-y-5">
            {/* Active User Card */}
            {currentUser && (
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center font-black text-base text-emerald-400">
                    {currentUser.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {isArabic ? 'المستخدم النشط حالياً' : 'Currently Active User'}
                    </div>
                    <h4 className="text-sm font-black">{currentUser.name}</h4>
                    <p className="text-xs text-slate-300">@{currentUser.username} • {currentUser.roleName}</p>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg text-slate-300 font-mono">
                    ID: {currentUser.id}
                  </span>
                </div>
              </div>
            )}

            {/* Switch User Selection */}
            {!switchTargetUser ? (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2.5">
                  {isArabic ? 'تبديل المستخدم إلى:' : 'Switch Active Operator to:'}
                </h4>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSwitchTargetUser(u);
                        setSwitchPassword('');
                        setSwitchError('');
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        currentUser?.id === u.id
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {u.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">
                            @{u.username} • <span className="font-semibold text-emerald-700">{u.roleName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentUser?.id === u.id ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                            {isArabic ? 'الحالي' : 'Active'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                          >
                            {isArabic ? 'اختيار وكتابة المرور' : 'Select'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Password prompt for switching user */
              <form onSubmit={handleSwitchUser} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-800">
                    {isArabic ? 'تأكيد كلمة المرور للمستخدم:' : 'Confirm Password for:'}{' '}
                    <span className="text-emerald-700 font-black">{switchTargetUser.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSwitchTargetUser(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={switchPassword}
                    onChange={e => setSwitchPassword(e.target.value)}
                    placeholder={isArabic ? `أدخل كلمة المرور للمستخدم (${switchTargetUser.username})...` : 'Enter password...'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    {switchTargetUser.username === 'admin' ? '(Default password: admin123)' :
                     switchTargetUser.username === 'cashier' ? '(Default password: cashier123)' : ''}
                  </div>
                </div>

                {switchError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{switchError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSwitchTargetUser(null)}
                    className="flex-1 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    {isArabic ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isArabic ? 'تسجيل الدخول' : 'Switch Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: LOG IN WITH PASSWORD */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isArabic ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'} *
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder={isArabic ? 'مثال: admin أو cashier أو اسم المستخدم' : 'e.g. admin or cashier'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isArabic ? 'كلمة المرور' : 'Password'} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder={isArabic ? 'أدخل كلمة المرور...' : 'Enter your password...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-10 rtl:pl-10 rtl:pr-3.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Help */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'حسابات النظام الجاهزة للاختبار السريع:' : 'Demo Quick Credentials:'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickLogin('admin', 'admin123')}
                  className="p-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 text-start cursor-pointer transition-all"
                >
                  <div className="font-bold text-slate-900 text-[11px]">{isArabic ? 'د. أحمد (مدير)' : 'Dr. Ahmed (Manager)'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin / admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('cashier', 'cashier123')}
                  className="p-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 text-start cursor-pointer transition-all"
                >
                  <div className="font-bold text-slate-900 text-[11px]">{isArabic ? 'محمود (كاشير)' : 'Mahmoud (Cashier)'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">cashier / cashier123</div>
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {isArabic ? 'تسجيل الدخول للنظام' : 'Log In to System'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADD NEW USER */}
        {activeTab === 'ADD_USER' && (
          <form onSubmit={handleAddUser} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {addSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isArabic ? 'الاسم الكامل للموظف / الكاشير' : 'Full Staff / Cashier Name'} *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={isArabic ? 'مثال: كريم طارق الشريف' : 'e.g. Karim Tarek'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'اسم المستخدم للدخول' : 'Username'} *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="karim_pos"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'كلمة المرور' : 'Password'} *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'الدور / الصلاحية' : 'Role / Permissions'}
                </label>
                <select
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="Senior Cashier (كاشير رئيسي)">{isArabic ? 'كاشير رئيسي (Senior Cashier)' : 'Senior Cashier'}</option>
                  <option value="Store General Manager (مدير عام الفرع)">{isArabic ? 'مدير عام الفرع (Store General Manager)' : 'Store General Manager'}</option>
                  <option value="Shift Supervisor (مشرف وردية)">{isArabic ? 'مشرف وردية (Shift Supervisor)' : 'Shift Supervisor'}</option>
                  <option value="Inventory Specialist (أخصائي مخازن)">{isArabic ? 'أخصائي مخازن (Inventory Specialist)' : 'Inventory Specialist'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'الفرع المخصص' : 'Branch'}
                </label>
                <select
                  value={newBranchId}
                  onChange={e => setNewBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {INITIAL_BRANCHES.map(b => (
                    <option key={b.id} value={b.id}>{b.name.split('(')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'رقم الهاتف / الموبايل' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="0101 234 5678"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="user@store.eg"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {isArabic ? 'حفظ وتفعيل المستخدم الجديد' : 'Save & Activate New User'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
