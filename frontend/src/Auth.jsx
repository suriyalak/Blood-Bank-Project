import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('ธนาคารเลือด');
  const [hospitalId, setHospitalId] = useState('');

  // 1. ดึงรายชื่อโรงพยาบาลมาใส่ Dropdown ตอนลงทะเบียน
  useEffect(() => {
    const fetchHospitals = async () => {
      const { data, error } = await supabase.from('hospitals').select('hospital_id, hospital_name');
      if (!error && data) {
        setHospitals(data);
        if (data.length > 0) setHospitalId(data[0].hospital_id);
      }
    };
    fetchHospitals();
  }, []);

  // ฟังก์ชันสุ่มรหัส user_id รูปแบบ USR-XXXXXX
  const generateUserId = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `USR-${randomDigits}`;
  };

  // 🔑 2. ระบบลงทะเบียน (Register)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      // Check ว่า username ซ้ำหรือไม่
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        setErrorMessage('ชื่อผู้ใช้นี้ (Username) ถูกใช้งานแล้ว');
        setLoading(false);
        return;
      }

      // Hash Password
      const salt = bcrypt.genSaltSync(12);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // สร้าง ID ใหม่
      const newUserId = generateUserId();

      // Insert ลงตาราง users
      const { error } = await supabase.from('users').insert([
        {
          user_id: newUserId,
          username: username.trim(),
          fullname: fullname.trim(),
          email: email.trim(),
          department: department.trim(),
          hospital_id: hospitalId,
          create_date: new Date().toISOString(),
          password_hash: hashedPassword
        }
      ]);

      if (error) throw error;

      setSuccessMessage('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
      setIsRegister(false);
      // Reset Form
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔓 3. ระบบเข้าสู่ระบบ (Login)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // ดึงข้อมูล User จาก Username
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (error || !userData) {
        setErrorMessage('ไม่พบชื่อผู้ใช้นี้ในระบบ');
        setLoading(false);
        return;
      }

      // ตรวจสอบ Hash Password
      const isPasswordValid = bcrypt.compareSync(password, userData.password_hash);

      if (!isPasswordValid) {
        setErrorMessage('รหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // บันทึก Session ลง LocalStorage
      localStorage.setItem('user', JSON.stringify(userData));

      // เรียก Callback แจ้งหน้าหลักว่า Login ผ่านแล้ว
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-[#BA1A1A] p-6 text-center text-white">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">ระบบจัดการคลังเลือด</h2>
          <p className="text-xs text-red-100 mt-1">Blood Inventory Management System</p>
        </div>

        {/* Form Container */}
        <div className="p-6">
          
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${!isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              ลงทะเบียนเข้าใช้งาน
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium">
              ⚠️ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3 rounded-xl font-medium">
              ✅ {successMessage}
            </div>
          )}

          {/* ----------------- FORM LOGIN ----------------- */}
          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น Suriyalak88"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BA1A1A] hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          ) : (

            /* ----------------- FORM REGISTER ----------------- */
            <form onSubmit={handleRegister} className="space-y-3 text-xs font-medium max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-600 mb-1">ชื่อ-นามสกุล (Fullname)</label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="เช่น นางสาวสุริยลักษณ์ สิทธิวงศ์"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น Suriyalak88"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">อีเมล (Email)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hospital@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">แผนก / ชุมชน (Department)</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น ธนาคารเลือด"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">โรงพยาบาลสังกัด (Hospital)</label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800 cursor-pointer"
                >
                  {hospitals.map((h) => (
                    <option key={h.hospital_id} value={h.hospital_id}>
                      {h.hospital_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ยืนยันรหัสผ่าน (Confirm Password)</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านซ้ำอีกครั้ง"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-bold text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#BA1A1A] hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-all cursor-pointer mt-3 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันลงทะเบียน'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}