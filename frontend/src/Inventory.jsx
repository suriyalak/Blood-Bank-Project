import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 ตัวกรองค้นหา และ ตัวกรองแบบระบุเงื่อนไข
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterComponent, setFilterComponent] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 📄 State สำหรับระบบ Pagination (20 รายการ/หน้า)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ➕ State สำหรับ Modal เพิ่มข้อมูล
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_no: '',
    blood_group: 'A',
    rh_id: '1',
    component_id: '1',
    status: 'Available',
    expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hospital_id: ''
  });

  const fileInputRef = useRef(null);

  // 🔄 Mapping ตัวเลข ID เป็นชื่อสากล
  const COMPONENT_MAP = { '1': 'PRC', '2': 'FFP', '3': 'PC', '4': 'WB', '5': 'CRYO' };
  const RH_MAP = { '1': 'Rh+', '2': 'Rh-' };

  // 🏥 ดึงรายชื่อโรงพยาบาลทั้งหมด
  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase.from('hospitals').select('*');
      if (!error && data && data.length > 0) {
        setHospitals(data);
        setFormData(prev => ({ ...prev, hospital_id: data[0].hospital_id }));
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    }
  };

  // 🟢 ดึงข้อมูลคลังเลือดทั้งหมดจาก Supabase
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
          .select('*, hospitals(hospital_name)')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          const fallback = await supabase
            .from('blood_inventory')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (!fallback.error && fallback.data) {
            allRows = [...allRows, ...fallback.data];
            if (fallback.data.length < pageSize) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        } else if (data && data.length > 0) {
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
    fetchHospitals();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGroup, filterComponent, startDate, endDate]);

  // 🏷️ คำนวณจำนวนตามสถานะ
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
    { label: 'จอง', count: getStatusCount(['Booked', 'Dedicated', 'ReadyToIssue', 'Reserved', 'จอง']), borderColor: 'border-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50/40' },
    { label: 'กำลังดำเนินการ', count: getStatusCount(['In Screening Process', 'กำลังดำเนินการ', 'Screening']), borderColor: 'border-cyan-500', textColor: 'text-cyan-600', bgColor: 'bg-cyan-50/40' },
    { label: 'กำลังตรวจเช็ค', count: getStatusCount(['Quarantine', 'กำลังตรวจเช็ค', 'TESTING']), borderColor: 'border-amber-500', textColor: 'text-[#d97706]', bgColor: 'bg-amber-50/40' },
    { label: 'ทำลาย', count: getStatusCount(['Destroyed', 'ทำลาย', 'Discarded']), borderColor: 'border-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50/40' },
    { label: 'หมดอายุ', count: getStatusCount(['Expired', 'หมดอายุ']), borderColor: 'border-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-100/60' }
  ];

  // 👤 ฟังก์ชันดึง user_id จาก Local/Session Storage หรือ Supabase Auth
  const getUserId = async () => {
    let customUserId = null;
    const localUserStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        customUserId = parsed.user_id || parsed.id || parsed.usr_id;
      } catch (err) {
        console.error('Error parsing local user:', err);
      }
    }

    if (!customUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', user.email)
          .maybeSingle();

        if (userData) {
          customUserId = userData.user_id;
        }
      }
    }
    return customUserId;
  };

  // ➕ บันทึกยูนิตเลือดใหม่ทีละรายการ
  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit_no.trim()) {
      alert('กรุณากรอก Unit No.');
      return;
    }

    if (!formData.hospital_id) {
      alert('กรุณาเลือกโรงพยาบาล');
      return;
    }

    setIsSubmitting(true);
    try {
      const customUserId = await getUserId();

      const payload = {
        unit_no: formData.unit_no.trim(),
        blood_group: formData.blood_group,
        rh_id: formData.rh_id,
        component_id: formData.component_id,
        status: formData.status,
        expiry_date: formData.expiry_date,
        hospital_id: formData.hospital_id,
        created_at: new Date().toISOString(),
        user_id: customUserId
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
          expiry_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          hospital_id: hospitals[0]?.hospital_id || ''
        });
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📥 ฟังก์ชัน Import ไฟล์ CSV / Excel (ดึง hospital_id ที่มีอยู่จริงจาก DB ป้องกัน Foreign Key Error)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. ดึงข้อมูลโรงพยาบาลที่มีอยู่จริงในฐานข้อมูล Supabase มาก่อน
      const { data: dbHospitals, error: hospErr } = await supabase.from('hospitals').select('*');
      
      if (hospErr || !dbHospitals || dbHospitals.length === 0) {
        alert('ไม่พบข้อมูลในตาราง hospitals ในระบบ กรุณาเพิ่มข้อมูลโรงพยาบาลในฐานข้อมูลก่อน Import');
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // ใช้ ID โรงพยาบาลรายการแรกที่มีจริงเป็นค่าสำรองกรณีไม่พบข้อมูลในไฟล์
      const fallbackHospitalId = dbHospitals[0].hospital_id;
      const customUserId = await getUserId();

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target.result;
          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!jsonData || jsonData.length === 0) {
            alert('ไม่พบข้อมูลในไฟล์ที่อัปโหลด');
            setLoading(false);
            return;
          }

          const cleanKey = (str) => String(str || '')
            .replace(/^\ufeff/, '')
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙]/g, '');

          const parseToDateString = (rawDate) => {
            if (!rawDate) return '';
            if (rawDate instanceof Date) {
              if (isNaN(rawDate.getTime())) return '';
              return rawDate.toISOString().split('T')[0];
            }
            if (typeof rawDate === 'number') {
              const jsDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000);
              return !isNaN(jsDate.getTime()) ? jsDate.toISOString().split('T')[0] : '';
            }
            const str = String(rawDate).trim();
            if (!str) return '';
            const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (dmyMatch) {
              let day = dmyMatch[1].padStart(2, '0');
              let month = dmyMatch[2].padStart(2, '0');
              let year = parseInt(dmyMatch[3], 10);
              if (year > 2400) year -= 543;
              return `${year}-${month}-${day}`;
            }
            if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
              return str.split('T')[0].split(' ')[0];
            }
            return str;
          };

          const rowsToInsert = jsonData.map(row => {
            const getVal = (...targetKeys) => {
              const rowKeys = Object.keys(row);
              for (let key of targetKeys) {
                const matchedKey = rowKeys.find(rk => cleanKey(rk) === cleanKey(key));
                if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                  return row[matchedKey];
                }
              }
              return '';
            };

            const unitNo = getVal('Unit No.', 'Unit No', 'unit_no', 'unitno', 'ยูนิต', 'หมายเลขยูนิต');

            const rawBloodGroup = getVal('BloodGroup', 'Blood Group', 'blood_group', 'กรุ๊ปเลือด', 'กลุ่มเลือด');
            const bloodGroup = String(rawBloodGroup || 'A').trim().toUpperCase();

            const rawRh = String(getVal('Rh', 'Rh Factor', 'rh_id', 'อาร์เอช') || '').trim().toUpperCase();
            let rhId = '1';
            if (rawRh.includes('NEG') || rawRh.includes('-') || rawRh === '2') {
              rhId = '2';
            } else if (rawRh.includes('POS') || rawRh.includes('+') || rawRh === '1') {
              rhId = '1';
            }

            const rawComp = String(getVal('ชนิด Blood Component', 'ชนิดBlood Component', 'Blood Component', 'component_id', 'component') || '').trim().toUpperCase();
            let componentId = '1';
            if (rawComp.includes('PRC') || rawComp.includes('RED') || rawComp.includes('PACKED') || rawComp.includes('LEUKOCYTE')) {
              componentId = '1';
            } else if (rawComp.includes('FFP') || rawComp.includes('PLASMA') || rawComp.includes('FRESH')) {
              componentId = '2';
            } else if (rawComp.includes('PC') || rawComp.includes('PLATELET')) {
              componentId = '3';
            } else if (rawComp.includes('WB') || rawComp.includes('WHOLE')) {
              componentId = '4';
            } else if (rawComp.includes('CRYO')) {
              componentId = '5';
            } else if (['1', '2', '3', '4', '5'].includes(rawComp)) {
              componentId = rawComp;
            }

            const status = String(getVal('สถานะ', 'status') || 'Available').trim();

            // 🔍 แมปสถานที่รับบริจาค/โรงพยาบาลจากไฟล์เข้ากับข้อมูลที่มีจริงใน Supabase
            const rawHospInput = String(getVal('สถานที่รับบริจาค', 'hospital_id', 'hospital', 'โรงพยาบาล') || '').trim();
            
            let targetHospitalId = fallbackHospitalId;
            if (rawHospInput) {
              const matchedHospital = dbHospitals.find(h => 
                String(h.hospital_id).trim().toLowerCase() === rawHospInput.toLowerCase() ||
                String(h.hospital_name || '').trim().toLowerCase() === rawHospInput.toLowerCase() ||
                (h.hospital_name && rawHospInput && String(h.hospital_name).toLowerCase().includes(rawHospInput.toLowerCase()))
              );
              if (matchedHospital) {
                targetHospitalId = matchedHospital.hospital_id;
              }
            }

            const rawExp = getVal('วันหมดอายุ', 'expiry_date', 'exp');
            let expiryDate = parseToDateString(rawExp);
            if (!expiryDate) {
              expiryDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            return {
              unit_no: String(unitNo).trim(),
              blood_group: bloodGroup,
              rh_id: String(rhId),
              component_id: String(componentId),
              status: status,
              expiry_date: expiryDate,
              hospital_id: String(targetHospitalId).trim(),
              created_at: new Date().toISOString(),
              user_id: customUserId
            };
          }).filter(item => item.unit_no !== '');

          if (rowsToInsert.length === 0) {
            alert('ไม่พบข้อมูล Unit No. ในไฟล์ที่อัปโหลด กรุณาตรวจสอบว่าแถวแรกเป็นหัวคอลัมน์');
            setLoading(false);
            return;
          }

          const { error } = await supabase.from('blood_inventory').insert(rowsToInsert);

          if (error) {
            alert('เกิดข้อผิดพลาดในการ Import: ' + error.message);
          } else {
            alert(`Import ข้อมูลสำเร็จจำนวน ${rowsToInsert.length} รายการ!`);
            fetchInventory();
          }
        } catch (parseErr) {
          console.error('Error parsing file:', parseErr);
          alert('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV/Excel');
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🔍 กรองข้อมูลตามทุกเงื่อนไข
  const filteredData = inventory.filter(item => {
    const invId = String(item?.inventory_id || '').toLowerCase();
    const unitNo = String(item?.unit_no || '').toLowerCase();
    const group = String(item?.blood_group || '').toUpperCase();
    const status = String(item?.status || '').toLowerCase();
    const compStr = String(item?.component_id || '').trim();
    const mappedComp = COMPONENT_MAP[compStr] || compStr;
    const hospName = String(item?.hospital_name || item?.hospitals?.hospital_name || item?.hospital_id || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const recordDate = item?.created_at ? String(item.created_at).split('T')[0] : '';

    const matchSearch = invId.includes(search) || unitNo.includes(search) || group.toLowerCase().includes(search) || status.includes(search) || hospName.includes(search);
    const matchGroup = filterGroup === 'ALL' || group === filterGroup;
    const matchComp = filterComponent === 'ALL' || compStr === filterComponent || mappedComp === filterComponent;
    const matchStartDate = !startDate || (recordDate && recordDate >= startDate);
    const matchEndDate = !endDate || (recordDate && recordDate <= endDate);

    return matchSearch && matchGroup && matchComp && matchStartDate && matchEndDate;
  });

  // 📄 คำนวณ Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      
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

      {/* 🛠️ Toolbar ค้นหา และแถบตัวกรองข้อมูล */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        
        {/* แถวบน: ช่องค้นหา + ปุ่มดำเนินการ */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="ค้นหาตาม Unit No, กรุ๊ปเลือด หรือสถานะ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none bg-[#BA1A1A] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มเลือดทีละรายการ
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
            />
          </div>
        </div>

        {/* แถวล่าง: ตัวกรอง */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 border-t border-slate-50">
          <div className="flex items-center gap-1.5 font-bold text-slate-500 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            ตัวกรอง:
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">กรุ๊ปเลือด</span>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-red-500"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="A">Group A</option>
              <option value="B">Group B</option>
              <option value="O">Group O</option>
              <option value="AB">Group AB</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">องค์ประกอบ</span>
            <select
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-red-500"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="PRC">PRC</option>
              <option value="FFP">FFP</option>
              <option value="PC">PC</option>
              <option value="WB">WB</option>
              <option value="CRYO">CRYO</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">ตั้งแต่วันที่</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-red-500"
            />
          </div>

          {(filterGroup !== 'ALL' || filterComponent !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setFilterGroup('ALL');
                setFilterComponent('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-red-600 hover:text-red-800 font-bold ml-auto text-[11px] underline"
            >
              ล้างตัวกรอง
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
                <th className="py-3.5 px-4">UNIT NO.</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">BLOOD GROUP</th>
                <th className="py-3.5 px-4">RH</th>
                <th className="py-3.5 px-4">COMPONENT</th>
                <th className="py-3.5 px-4">RECORD DATE</th>
                <th className="py-3.5 px-4">EXPIRY DATE</th>
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
                  const recordDateDisplay = item.created_at ? String(item.created_at).split('T')[0] : '-';

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
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{recordDateDisplay}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.expiry_date || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 📄 ส่วนเลือกหน้า Pagination */}
        {filteredData.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              แสดง {startIndex + 1} ถึง {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} จาก {filteredData.length.toLocaleString()} รายการ
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                ก่อนหน้า
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔴 Modal สำหรับเพิ่มเลือดทีละรายการ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden">
            
            <div className="bg-[#BA1A1A] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
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
                  placeholder="เช่น 00000000001"
                  value={formData.unit_no}
                  onChange={(e) => setFormData({ ...formData, unit_no: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  โรงพยาบาล (Hospital) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
                >
                  {hospitals.length === 0 ? (
                    <option value="">กำลังโหลดโรงพยาบาล...</option>
                  ) : (
                    hospitals.map((hosp) => (
                      <option key={hosp.hospital_id} value={hosp.hospital_id}>
                        {hosp.hospital_name || hosp.hospital_id} ({hosp.hospital_id})
                      </option>
                    ))
                  )}
                </select>
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