import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Forecasting from './Forecasting';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 📱 State สำหรับเปิด-ปิด เมนู Sidebar บนมือถือ
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ⏱️ Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <Auth onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const formattedDate = currentTime.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-x-hidden">
      
      {/* ⬛ Backdrop สำหรับมือถือ */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* 📌 1. แถบ Sidebar แบบ Fixed (ล็อคแน่นติดขอบจอซ้ายตลอดเวลา) */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 
          flex flex-col justify-between shrink-0 shadow-md md:shadow-none transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ส่วนบน: Logo และ เมนูนำทาง */}
        <div className="flex flex-col min-h-0">
          
          {/* Logo Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#BA1A1A] rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-red-200 shrink-0 text-base">
                🩸
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-sm leading-tight">Blood Inventory</h1>
                <p className="text-[10px] text-slate-400 font-medium">Management System</p>
              </div>
            </div>

            {/* ปุ่มปิดเมนูมือถือ */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* เมนูหลัก (Nav Links) */}
          <nav className="p-3 space-y-1.5 text-xs font-bold overflow-y-auto">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-red-50 text-[#BA1A1A] font-extrabold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="truncate">Dashboard</span>
            </button>

            <button
              onClick={() => handleTabChange('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-red-50 text-[#BA1A1A] font-extrabold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="truncate text-xs">จัดการคลังเลือด</span>
            </button>

            <button
              onClick={() => handleTabChange('forecasting')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'forecasting'
                  ? 'bg-red-50 text-[#BA1A1A] font-extrabold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="truncate text-xs">พยากรณ์ (Forecasting)</span>
            </button>
          </nav>
        </div>

        {/* ส่วนล่าง: โปรไฟล์ผู้ใช้ แนบชิดขอบจอล่างสุดเสมอ */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-100 text-[#BA1A1A] rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {currentUser.fullname ? currentUser.fullname.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-slate-800 truncate">{currentUser.fullname}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.department || 'ธนาคารเลือด'} ({currentUser.user_id})</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 📌 2. พื้นที่แสดงเนื้อหาหลักด้านขวา (เพิ่ม md:ml-64 เพื่อเว้นที่ให้ Sidebar แบบ Fixed) */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        
        {/* Header Bar ด้านบน */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden bg-slate-100 p-2 rounded-xl text-slate-700 hover:bg-slate-200 transition-all shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="overflow-hidden">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                {activeTab === 'dashboard' && 'ภาพรวมคลังเลือด (Dashboard)'}
                {activeTab === 'inventory' && 'จัดการคลังเลือด (Inventory)'}
                {activeTab === 'forecasting' && 'Blood Forecasting'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                {activeTab === 'forecasting' ? 'ระบบพยากรณ์ปริมาณการสำรองเลือดสัปดาห์ถัดไป' : 'ระบบติดตามและบริหารจัดการถุงเลือด'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-50 text-emerald-700 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-emerald-100 shadow-sm">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="hidden sm:inline">ระบบออนไลน์</span>
              <span className="text-emerald-300 font-light hidden sm:inline">|</span>
              <span className="text-emerald-600 font-mono font-medium">
                <span className="hidden md:inline">{formattedDate} </span>
                {formattedTime} น.
              </span>
            </div>
          </div>
        </header>

        {/* ส่วนแสดงเนื้อหาหลัก */}
        <main className="p-3 sm:p-6 flex-1 overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'forecasting' && <Forecasting />}
        </main>
      </div>

    </div>
  );
}