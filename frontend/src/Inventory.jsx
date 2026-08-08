import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔍 ตัวกรองเพิ่มเติม (หมู่เลือด, องค์ประกอบเลือด, ช่วงวันที่)
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterComponent, setFilterComponent] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // 📄 State สำหรับระบบ Pagination (แสดงผลทีละ 20 รายการ)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ➕ State สำหรับ Modal เพิ่มเลือดทีละรายการ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_no: '',
    blood_group: 'A',
    rh_id: '1', // 1 = Rh+, 2 = Rh-
    component_id: '1', // 1=PRC, 2=FFP, 3=PC, 4=WB, 5=CRYO
    status: 'Available',
    record_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hospital_id: 'HOSP001'
  });

  const fileInputRef = useRef(null);

  // 🔄 Mapping ตัวเลข ID ใน DB เป็นชื่อมาตรฐานสากล
  const COMPONENT_MAP = { '1': 'PRC', '2': 'FFP', '3': 'PC', '4': 'WB', '5': 'CRYO' };
  const RH_MAP = { '1': 'Rh+', '2': 'Rh-' };

  // 🟢 ดึงข้อมูลทั้งหมดจาก Supabase
  const fetchInventory = async () => {
    setLoading(true);
    let allRows = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase
          .from('blood_inventory')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('record_date', { ascending: false });

        if (error) break;

        if (data && data.length > 0) {
          allRows = [...allRows, ...data];
          if (data.length < pageSize) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }
      setInventory(allRows);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 🔄 รีเซ็ตกลับไปหน้า 1 เมื่อมีการค้นหาหรือเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGroup, filterComponent, filterStartDate, filterEndDate]);

  // 🏷️ ฟังก์ชันคำนวณจำนวนตามข้อความสถานะใน DB
  const getStatusCount = (statusNames) => {
    const searchKeys = statusNames.map(s => String(s).toUpperCase().trim());
    return inventory.filter(item => {
      const st = String(item.status || '').toUpperCase().trim();
      return searchKeys.includes(st);
    }).length;
  };

  const statusCards = [
    { label: 'ว่าง', count: getStatusCount(['Available', 'ว่าง']), borderColor: 'border-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50/40' },
    { label: 'จ่าย', count: getStatusCount(['Released', 'จ่าย']), borderColor: 'border-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50/40' },
    { label: 'จอง', count: getStatusCount(['Booked', 'Dedicated', 'ReadyToIssue', 'Ready To Issue', 'Reserved', 'จอง']), borderColor: 'border-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50/40' },
    { label: 'กำลังดำเนินการ', count: getStatusCount(['In Screening Process', 'กำลังดำเนินการ', 'Screening']), borderColor: 'border-cyan-500', textColor: 'text-cyan-600', bgColor: 'bg-cyan-50/40' },
    { label: 'กำลังตรวจเช็ค', count: getStatusCount(['Quarantine', 'กำลังตรวจเช็ค', 'TESTING']), borderColor: 'border-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50/40' },
    { label: 'ทำลาย', count: getStatusCount(['Destroyed', 'ทำลาย', 'Discarded']), borderColor: 'border-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50/40' },
    { label: 'หมดอายุ', count: getStatusCount(['Expired', 'หมดอายุ']), borderColor: 'border-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-100/60' }
  ];

  // ➕ ฟังก์ชันเพิ่มเลือดทีละรายการ
  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit_no.trim()) {
      alert('กรุณากรอก Unit No.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        inventory_id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        unit_no: formData.unit_no.trim(),
        blood_group: formData.blood_group,
        rh_id: formData.rh_id,
        component_id: formData.component_id,
        status: formData.status,
        record_date: formData.record_date,
        expiry_date: formData.expiry_date,
        hospital_id: formData.hospital_id
      };

      const { error } = await supabase.from('blood_inventory').insert([payload]);

      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
      } else {
        alert('บันทึกข้อมูลยูนิตเลือดสำเร็จ!');
        setIsAddModalOpen(false);
        setFormData({
          unit_no: '',
          blood_group: 'A',
          rh_id: '1',
          component_id: '1',
          status: 'Available',
          record_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          hospital_id: 'HOSP001'
        });
        fetchInventory();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Import ไฟล์ Excel / CSV
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert('ไม่พบข้อมูลในไฟล์ที่เลือก');
          return;
        }

        const formattedData = rawData.map((row) => ({
          inventory_id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
          unit_no: String(row['Unit No'] || row['unit_no'] || ('UNIT-' + Math.floor(100000 + Math.random() * 900000))),
          blood_group: String(row['Blood Group'] || row['blood_group'] || 'O').toUpperCase(),
          rh_id: String(row['Rh'] || row['rh_id'] || '1'),
          component_id: String(row['Component'] || row['component_id'] || '1'),
          status: String(row['Status'] || row['status'] || 'Available'),
          hospital_id: String(row['Hospital'] || row['hospital_id'] || 'HOSP001'),
          record_date: row['record_date'] || new Date().toISOString().split('T')[0],
          expiry_date: row['expiry_date'] || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));

        const { error } = await supabase.from('blood_inventory').insert(formattedData);

        if (error) {
          alert('เกิดข้อผิดพลาดในการ Import: ' + error.message);
        } else {
          alert(`Import ข้อมูลสำเร็จจำนวน ${formattedData.length} รายการ!`);
          fetchInventory();
        }
      } catch (err) {
        alert('รูปแบบไฟล์ไม่ถูกต้อง โปรดตรวจสอบไฟล์ของคุณ');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 🔍 กรองข้อมูล
  const filteredData = inventory.filter(item => {
    const unitNo = String(item?.unit_no || '').toLowerCase();
    const group = String(item?.blood_group || '').toUpperCase();
    const status = String(item?.status || '').toLowerCase();
    const compStr = String(item?.component_id || '').trim();
    const mappedComp = COMPONENT_MAP[compStr] || compStr;
    const search = searchTerm.toLowerCase();

    const matchSearch = unitNo.includes(search) || group.toLowerCase().includes(search) || status.includes(search);
    const matchGroup = filterGroup === 'ALL' || group === filterGroup;
    const matchComp = filterComponent === 'ALL' || compStr === filterComponent || mappedComp === filterComponent;

    let matchDate = true;
    if (filterStartDate) matchDate = matchDate && (item.record_date >= filterStartDate);
    if (filterEndDate) matchDate = matchDate && (item.record_date <= filterEndDate);

    return matchSearch && matchGroup && matchComp && matchDate;
  });

  // 📄 คำนวณข้อมูลสำหรับ Pagination (20 รายการต่อหน้า)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* 🇹🇭 การ์ดสรุปจำนวนเลือดตามสถานะ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {statusCards.map((card, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded-2xl border-t-4 ${card.borderColor} ${card.bgColor} bg-white shadow-sm flex flex-col justify-between h-24 transition-all`}
          >
            <span className="text-xs text-slate-700 font-bold truncate">{card.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${card.textColor}`}>
                {loading ? '...' : card.count.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">ยูนิต</span>
            </div>
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      {/* 🛠️ Toolbar และตัวกรองข้อมูล */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        
        {/* แถวที่ 1: ปุ่มดำเนินการ และ Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="ค้นหาตาม Unit No, กรุ๊ปเลือด หรือสถานะ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none bg-[#BA1A1A] hover:bg-red-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มเลือดทีละรายการ
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Import File
            </button>
          </div>
        </div>

        {/* แถวที่ 2: ตัวกรองละเอียด */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-bold flex items-center gap-1 text-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            ตัวกรอง:
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">หมู่เลือด:</span>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 font-semibold"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
              <option value="O">Group O</option>
              <option value="AB">Group AB</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">องค์ประกอบ:</span>
            <select
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 font-semibold"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="1">PRC (1)</option>
              <option value="2">FFP (2)</option>
              <option value="3">PC (3)</option>
              <option value="4">WB (4)</option>
              <option value="5">CRYO (5)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-red-500 text-xs"
            />
            <span className="text-[11px] text-slate-400">ถึง:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-red-500 text-xs"
            />
          </div>

          {(filterGroup !== 'ALL' || filterComponent !== 'ALL' || filterStartDate || filterEndDate) && (
            <button
              onClick={() => {
                setFilterGroup('ALL');
                setFilterComponent('ALL');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="text-[#BA1A1A] hover:underline font-bold text-[11px] ml-auto"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

      </div>

      {/* 📋 Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="min-h-[400px] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Unit No.</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Rh</th>
                <th className="py-3.5 px-4">Component</th>
                <th className="py-3.5 px-4">Record Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 font-medium">
                    กำลังโหลดข้อมูลทั้งหมด...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    ไม่พบข้อมูลที่ตรงกับตัวกรอง
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const compStr = String(item.component_id || '').trim();
                  const rhStr = String(item.rh_id || '').trim();

                  return (
                    <tr key={item.inventory_id || item.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.unit_no || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          ['Released', 'จ่าย'].includes(item.status) ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          ['Available', 'ว่าง'].includes(item.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ['Booked', 'Dedicated', 'ReadyToIssue', 'Reserved', 'จอง'].includes(item.status) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          ['In Screening Process', 'กำลังดำเนินการ'].includes(item.status) ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          ['Quarantine', 'กำลังตรวจเช็ค', 'TESTING'].includes(item.status) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          ['ทำลาย', 'Destroyed'].includes(item.status) ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.status || 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#BA1A1A]">{item.blood_group || '-'}</td>
                      <td className="py-3 px-4 font-semibold">{RH_MAP[rhStr] || rhStr}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{COMPONENT_MAP[compStr] || compStr}</td>
                      <td className="py-3 px-4 text-slate-500">{item.record_date || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{item.expiry_date || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 แถบควบคุม Pagination เปลี่ยนหน้าทีละ 20 รายการ */}
        {!loading && filteredData.length > 0 && (
          <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              แสดง <span className="font-bold text-slate-800">{startIndex + 1}</span> ถึง{' '}
              <span className="font-bold text-slate-800">{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)}</span> จาก{' '}
              <span className="font-bold text-slate-800">{filteredData.length.toLocaleString()}</span> รายการ
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="หน้าแรก"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                title="หน้าก่อนหน้า"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold text-slate-700">
                หน้า {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                title="หน้าถัดไป"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="หน้าสุดท้าย"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔴 Modal สำหรับเพิ่มเลือดทีละรายการ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            
            <div className="bg-[#BA1A1A] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เพิ่มข้อมูลยูนิตเลือดทีละรายการ
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUnitSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 46969000199"
                  value={formData.unit_no}
                  onChange={(e) => setFormData({ ...formData, unit_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมู่เลือด (Blood Group)</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-bold text-red-700"
                  >
                    <option value="A">Group A</option>
                    <option value="B">Group B</option>
                    <option value="O">Group O</option>
                    <option value="AB">Group AB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rh Factor</label>
                  <select
                    value={formData.rh_id}
                    onChange={(e) => setFormData({ ...formData, rh_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  >
                    <option value="1">Rh+ (Positive)</option>
                    <option value="2">Rh- (Negative)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">องค์ประกอบเลือด</label>
                  <select
                    value={formData.component_id}
                    onChange={(e) => setFormData({ ...formData, component_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  >
                    <option value="1">PRC (Packed Red Cells)</option>
                    <option value="2">FFP (Fresh Frozen Plasma)</option>
                    <option value="3">PC (Platelet Concentrate)</option>
                    <option value="4">WB (Whole Blood)</option>
                    <option value="5">CRYO (Cryoprecipitate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สถานะ (Status)</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  >
                    <option value="Available">ว่าง (Available)</option>
                    <option value="Released">จ่าย (Released)</option>
                    <option value="Booked">จอง (Booked)</option>
                    <option value="In Screening Process">กำลังดำเนินการ (In Screening)</option>
                    <option value="Quarantine">กำลังตรวจเช็ค (Quarantine)</option>
                    <option value="Destroyed">ทำลาย (Destroyed)</option>
                    <option value="Expired">หมดอายุ (Expired)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันที่รับเข้า (Record Date)</label>
                  <input
                    type="date"
                    required
                    value={formData.record_date}
                    onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันที่หมดอายุ (Expiry Date)</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสโรงพยาบาล (Hospital ID)</label>
                <input
                  type="text"
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#BA1A1A] hover:bg-red-800 text-white shadow-sm transition-all"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}