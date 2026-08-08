import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. ลอง Login ผ่าน Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // หากยังไม่ได้ใช้ Supabase Auth สามารถทำ Mock Login เพื่อทดสอบเบื้องต้นได้
        if (email === 'admin@bloodbank.com' && password === '123456') {
          const mockUser = { email: 'admin@bloodbank.com', role: 'admin' };
          localStorage.setItem('user', JSON.stringify(mockUser));
          onLoginSuccess(mockUser);
          return;
        }
        throw error;
      }

      // หาก Login ผ่าน Supabase สำเร็จ
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);

    } catch (err) {
      setErrorMessage(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-lg border border-slate-100 overflow-hidden p-8 space-y-6">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 bg-[#BA1A1A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Blood Bank System</h2>
          <p className="text-xs text-slate-400">เข้าสู่ระบบเพื่อจัดการข้อมูลคลังเลือด</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email / Username</label>
            <input
              type="email"
              required
              placeholder="admin@bloodbank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-red-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BA1A1A] hover:bg-red-800 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400">
          <p>ทดสอบเข้าสู่ระบบ:</p>
          <p className="font-mono mt-0.5">Email: admin@bloodbank.com | Pass: 123456</p>
        </div>

      </div>
    </div>
  );
}