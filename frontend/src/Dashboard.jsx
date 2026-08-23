import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔔 Pop-up แจ้งเตือนหมดอายุใน 7 วัน
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);

  // 📍 ข้อมูลตารางอ้างอิงจาก Supabase
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  // ค่า ID ของ Dropdown ที่เลือก
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');

  // 🎨 ฟังก์ชันกำหนดสีหัวการ์ดตามกรุ๊ปเลือด
  const getGroupHeaderStyle = (group) => {
    switch (group) {
      case 'A':
        return 'bg-amber-400 text-white';    // สีเหลือง + ตัวอักษรสีขาว
      case 'B':
        return 'bg-pink-500 text-white';     // สีชมพู
      case 'O':
        return 'bg-sky-500 text-white';      // สีฟ้า
      case 'AB':
        return 'bg-white text-slate-800 border-b border-slate-100'; // สีขาว
      default:
        return 'bg-slate-700 text-white';
    }
  };

  // ----------------------------------------------------
  // 1. ดึงข้อมูลทั้งหมดจาก Supabase
  // ----------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, provRes, distRes, hospRes] = await Promise.all([
          supabase.from('regions').select('*'),
          supabase.from('provinces').select('*'),
          supabase.from('districts').select('*'),
          supabase.from('hospitals').select('*')
        ]);

        const defaultRegions = [
          { region_id: '1', region_name: 'ภาคเหนือ' },
          { region_id: '2', region_name: 'ภาคกลาง' },
          { region_id: '3', region_name: 'ภาคตะวันออกเฉียงเหนือ' },
          { region_id: '4', region_name: 'ภาคตะวันออก' },
          { region_id: '5', region_name: 'ภาคตะวันตก' },
          { region_id: '6', region_name: 'ภาคใต้' }
        ];

        setRegions(regRes.data && regRes.data.length > 0 ? regRes.data : defaultRegions);
        setProvinces(provRes.data || []);
        setDistricts(distRes.data || []);
        setHospitals(hospRes.data || []);

        let allBloodRecords = [];
        let pageFrom = 0;
        const pageSize = 1000;
        let keepFetching = true;

        while (keepFetching) {
          const { data: bloodBatch, error: bloodErr } = await supabase
            .from('blood_inventory')
            .select('*')
            .range(pageFrom, pageFrom + pageSize - 1);

          if (bloodErr || !bloodBatch || bloodBatch.length === 0) {
            keepFetching = false;
          } else {
            allBloodRecords = [...allBloodRecords, ...bloodBatch];
            if (bloodBatch.length < pageSize) keepFetching = false;
            pageFrom += pageSize;
          }
        }

        setInventory(allBloodRecords);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ----------------------------------------------------
  // 2. Lookup & Auto-Extract
  // ----------------------------------------------------
  const availableProvinces = useMemo(() => {
    if (provinces.length > 0) {
      if (!selectedRegion) return provinces;
      return provinces.filter(p => String(p.region_id) === String(selectedRegion));
    }
    
    const uniqueProvIds = Array.from(new Set(hospitals.map(h => h.province_id).filter(Boolean)));
    return uniqueProvIds.map(id => ({
      province_id: id,
      province_name: id
    }));
  }, [provinces, selectedRegion, hospitals]);

  const availableDistricts = useMemo(() => {
    let sourceDistricts = districts;

    if (sourceDistricts.length > 0) {
      if (selectedProvince) {
        return sourceDistricts.filter(d => String(d.province_id) === String(selectedProvince));
      }
      return sourceDistricts;
    }

    let filteredHosps = hospitals;
    if (selectedProvince) {
      filteredHosps = filteredHosps.filter(h => String(h.province_id) === String(selectedProvince));
    }
    const uniqueDistIds = Array.from(new Set(filteredHosps.map(h => h.district_id).filter(Boolean)));
    return uniqueDistIds.map(id => ({
      district_id: id,
      district_name: id
    }));
  }, [districts, selectedProvince, hospitals]);

  const availableHospitals = useMemo(() => {
    return hospitals.filter(h => {
      if (selectedDistrict && String(h.district_id) !== String(selectedDistrict)) return false;
      if (selectedProvince && String(h.province_id) !== String(selectedProvince)) return false;
      return true;
    });
  }, [hospitals, selectedDistrict, selectedProvince]);

  const hospitalMap = useMemo(() => {
    const map = {};
    hospitals.forEach(h => {
      const provObj = provinces.find(p => String(p.province_id) === String(h.province_id));
      map[h.hospital_id] = {
        ...h,
        region_id: provObj ? provObj.region_id : null
      };
    });
    return map;
  }, [hospitals, provinces]);

  // ----------------------------------------------------
  // 3. กรองรายการเลือดในคลัง
  // ----------------------------------------------------
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const hInfo = hospitalMap[item.hospital_id];

      if (selectedHospital) {
        return String(item.hospital_id) === String(selectedHospital);
      }
      if (selectedDistrict) {
        return hInfo && String(hInfo.district_id) === String(selectedDistrict);
      }
      if (selectedProvince) {
        return hInfo && String(hInfo.province_id) === String(selectedProvince);
      }
      if (selectedRegion) {
        return hInfo && String(hInfo.region_id) === String(selectedRegion);
      }

      return true;
    });
  }, [inventory, hospitalMap, selectedHospital, selectedDistrict, selectedProvince, selectedRegion]);

  // ----------------------------------------------------
  // 4. คำนวณสถิติ
  // ----------------------------------------------------
  const expiringUnits = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    return filteredInventory.filter(item => {
      const status = String(item.status || '').toLowerCase();
      const inactiveStatus = ['destroyed', 'ทำลาย', 'expired', 'หมดอายุ', 'released', 'จ่าย'];
      if (inactiveStatus.includes(status)) return false;

      if (!item.expiry_date) return false;
      const expDate = new Date(item.expiry_date);

      return expDate >= today && expDate <= sevenDaysLater;
    });
  }, [filteredInventory]);

  const availableUnitsCount = useMemo(() => {
    return filteredInventory.filter(item => {
      const s = String(item.status || '').toLowerCase();
      return s === 'available' || s === 'ว่าง' || s === 'พร้อมใช้';
    }).length;
  }, [filteredInventory]);

  const getRh = (item) => {
    const rhStr = String(item.rh_id || '').toLowerCase();
    if (rhStr === '1' || rhStr.includes('+') || rhStr.includes('pos')) return '+';
    if (rhStr === '2' || rhStr.includes('-') || rhStr.includes('neg')) return '-';
    return '+';
  };

  const getBloodGroupCount = (group, rhType) => {
    return filteredInventory.filter(item => {
      const rawGroup = String(item.blood_group || '').toUpperCase().trim();
      const cleanGroup = rawGroup.replace(/[\+\-\s]/g, '').replace('RH', '');
      return cleanGroup === group && getRh(item) === rhType;
    }).length;
  };

  const getComponentType = (item) => {
    const cMap = { '1': 'PRC', '2': 'FFP', '3': 'PC', '4': 'WB', '5': 'CRYO' };
    const rawComp = String(item.component_id || '').toUpperCase().trim();
    return cMap[rawComp] || rawComp || 'PRC';
  };

  const getComponentCount = (comp) => {
    return filteredInventory.filter(item => getComponentType(item) === comp).length;
  };

  const compCounts = ['PRC', 'FFP', 'PC', 'WB', 'CRYO'].map(c => getComponentCount(c));
  const maxCompCount = Math.max(...compCounts, 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-4">
      
      {/* 📍 1. ตัวกรองพื้นที่ */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 whitespace-nowrap min-w-[110px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>ตัวกรองพื้นที่:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full text-xs">
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedProvince('');
              setSelectedDistrict('');
              setSelectedHospital('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700 outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="">ทุกภูมิภาค</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>
                {r.region_name || r.name || r.region_id}
              </option>
            ))}
          </select>

          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedDistrict('');
              setSelectedHospital('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700 outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="">ทุกจังหวัด</option>
            {availableProvinces.map((p) => (
              <option key={p.province_id} value={p.province_id}>
                {p.province_name}
              </option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedHospital('');
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700 outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="">ทุกอำเภอ</option>
            {availableDistricts.map((d) => (
              <option key={d.district_id} value={d.district_id}>
                {d.district_name}
              </option>
            ))}
          </select>

          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-700 outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="">ทุกโรงพยาบาล</option>
            {availableHospitals.map((h) => (
              <option key={h.hospital_id} value={h.hospital_id}>
                {h.hospital_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 2. สรุปยอด */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800">Total Unit</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-800">
              {loading ? '...' : filteredInventory.length.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">Units</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800">Available</h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-500">
              {loading ? '...' : availableUnitsCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">Units</span>
          </div>
        </div>

        <div 
          onClick={() => setIsNotiModalOpen(true)}
          className="bg-red-50/60 p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-between cursor-pointer hover:bg-red-100/50 transition-all"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-red-800">Expiring Soon</h3>
            <span className="text-[10px] bg-red-600 text-white font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              แจ้งเตือน 7 วัน
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-red-600">
              {loading ? '...' : expiringUnits.length.toLocaleString()}
            </span>
            <span className="text-xs text-red-400 font-medium">Units</span>
          </div>
        </div>
      </div>

      {/* 🩸 3. Blood Group Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">Blood Group</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['A', 'B', 'O', 'AB'].map(group => {
            const posCount = getBloodGroupCount(group, '+');
            const negCount = getBloodGroupCount(group, '-');
            const totalGroup = posCount + negCount;

            return (
              <div key={group} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className={`py-2.5 text-center font-black text-xl tracking-wider ${getGroupHeaderStyle(group)}`}>
                  {group}
                </div>
                
                <div className="p-5 bg-slate-50 flex-1">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-slate-800">
                      {loading ? '...' : totalGroup.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">UNITS</span>
                  </div>

                  <div className="space-y-2 text-xs pt-3 border-t border-slate-200/60">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-slate-600">{group}+</span>
                      <span className="font-bold text-slate-800">{loading ? '...' : posCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-slate-400">{group}-</span>
                      <span className="font-bold text-slate-600">{loading ? '...' : negCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🧪 4. Blood Component Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-base font-bold text-slate-800">Blood Component</h2>
        
        <div className="space-y-3.5 pt-2">
          {['PRC', 'FFP', 'PC', 'WB', 'CRYO'].map(comp => {
            const count = getComponentCount(comp);
            const percentage = maxCompCount > 0 ? (count / maxCompCount) * 100 : 0;

            return (
              <div key={comp} className="flex items-center gap-4 text-xs font-bold">
                <span className="w-12 text-right text-slate-700">{comp}</span>
                <div className="flex-1 bg-slate-100 h-7 rounded-full overflow-hidden relative flex items-center">
                  <div
                    className="bg-[#BA1A1A] h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%` }}
                  >
                    {count > 0 && percentage > 12 && (
                      <span className="text-white text-[11px] font-black">{count.toLocaleString()}</span>
                    )}
                  </div>
                  {(percentage <= 12 || count === 0) && (
                    <span className="ml-3 text-slate-700 text-[11px] font-black">{count.toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚨 POPUP MODAL */}
      {isNotiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden">
            <div className="bg-[#BA1A1A] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>🚨</span>
                <span>เลือดที่จะหมดอายุใน 7 วัน ({expiringUnits.length} ยูนิต)</span>
              </h3>
              <button onClick={() => setIsNotiModalOpen(false)} className="text-white hover:opacity-80 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto text-xs">
              {expiringUnits.length === 0 ? (
                <div className="text-center py-8 text-slate-400">🎉 ไม่มีรายการเลือดที่กำลังจะหมดอายุในพื้นที่นี้</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                      <th className="py-2.5 px-3">Unit No.</th>
                      <th className="py-2.5 px-3">หมู่เลือด</th>
                      <th className="py-2.5 px-3">ชนิด</th>
                      <th className="py-2.5 px-3">วันหมดอายุ</th>
                      <th className="py-2.5 px-3">โรงพยาบาล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiringUnits.map((item, idx) => {
                      const hInfo = hospitalMap[item.hospital_id];
                      return (
                        <tr key={item.inventory_id || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold">{item.unit_no || '-'}</td>
                          <td className="py-2.5 px-3 font-extrabold text-[#BA1A1A]">{item.blood_group || '-'}</td>
                          <td className="py-2.5 px-3">{getComponentType(item)}</td>
                          <td className="py-2.5 px-3 font-bold text-red-600">{item.expiry_date || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{hInfo ? hInfo.hospital_name : item.hospital_id || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsNotiModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}