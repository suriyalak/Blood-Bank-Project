import React from 'react';

export default function Forecasting() {
  const reserveData = [
    { group: 'A', amount: 5 },
    { group: 'B', amount: 3 },
    { group: 'O', amount: 8 },
    { group: 'AB', amount: 1 },
  ];

  const monthlyData = [
    { month: 'Jan', value: 10, y: 140 },
    { month: 'Feb', value: 18, y: 110 },
    { month: 'Mar', value: 20, y: 102 },
    { month: 'Apr', value: 32, y: 65 },
    { month: 'May', value: 35, y: 55 },
    { month: 'Jun', value: 42, y: 35 },
    { month: 'Jul', value: 29, y: 75 },
  ];

  // 🎨 กำหนดสีของแท่งกราฟตามกรุ๊ปเลือด (AB ใช้สีขาวพร้อมขอบสีดำ)
  const groupUsageData = [
    { group: 'Group A', value: 38, height: 140, barStyle: 'bg-amber-400' },
    { group: 'Group B', value: 30, height: 110, barStyle: 'bg-pink-500' },
    { group: 'Group O', value: 22, height: 80, barStyle: 'bg-sky-500' },
    { group: 'Group AB', value: 14, height: 50, barStyle: 'bg-white border-2 border-slate-400' },
  ];

  // 🎨 ฟังก์ชันกำหนดสีหัวการ์ดตามกรุ๊ปเลือด
  const getGroupHeaderStyle = (group) => {
    switch (group) {
      case 'A':
        return 'bg-amber-400 text-white';
      case 'B':
        return 'bg-pink-500 text-white';
      case 'O':
        return 'bg-sky-500 text-white';
      case 'AB':
        return 'bg-white text-slate-800 border-b border-slate-100';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      <h2 className="text-base font-bold text-slate-800">Reserving Blood</h2>

      {/* 📌 1. ส่วนการ์ด 4 กรุ๊ปเลือด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reserveData.map((item) => (
          <div 
            key={item.group} 
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col text-center transition-all hover:shadow-md"
          >
            <div className={`py-2 font-black text-xl tracking-wider ${getGroupHeaderStyle(item.group)}`}>
              {item.group}
            </div>
            
            <div className="p-5 bg-slate-100 flex flex-col items-center justify-center flex-1">
              <span className="text-[11px] text-slate-400 font-medium">needs to reserve</span>
              <span className="text-4xl font-black text-slate-800 my-1">{item.amount}</span>
              <span className="text-xs font-bold text-slate-500">units</span>
              <span className="text-[10px] text-slate-400 mt-0.5">of blood for next week</span>
            </div>
          </div>
        ))}
      </div>

      {/* 📌 2. ส่วนแสดงกราฟ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 📈 กราฟเส้นซ้าย */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-700 text-center mb-6">
            The amount of blood used by Month
          </h3>

          <div className="w-full h-60 relative flex flex-col justify-between pt-2 pb-1">
            <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-slate-300 pointer-events-none pb-6">
              <div className="border-b border-slate-100 w-full">50</div>
              <div className="border-b border-slate-100 w-full">40</div>
              <div className="border-b border-slate-100 w-full">30</div>
              <div className="border-b border-slate-100 w-full">20</div>
              <div className="border-b border-slate-100 w-full">10</div>
              <div className="border-b border-slate-200 w-full">0</div>
            </div>

            <div className="relative w-full h-44">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 180" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#BA1A1A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="50,140 150,110 250,102 350,65 450,55 550,35 650,75"
                />
                {monthlyData.map((d, i) => {
                  const xCoords = [50, 150, 250, 350, 450, 550, 650];
                  return (
                    <circle
                      key={i}
                      cx={xCoords[i]}
                      cy={d.y}
                      r="4"
                      fill="#BA1A1A"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-4">
              {monthlyData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 📊 กราฟแท่งขวา (ปรับแต่งสีแต่ละหมู่เลือด + ขอบสีดำสำหรับ AB) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-700 text-center mb-6">
            The amount of blood used by Blood Group
          </h3>

          <div className="w-full h-60 flex flex-col justify-end">
            <div className="flex items-end justify-around h-44 w-full border-b border-slate-200 pb-1 px-2">
              {groupUsageData.map((d) => (
                <div key={d.group} className="flex flex-col items-center group w-12">
                  <span className="text-[10px] font-bold text-slate-600 mb-1">{d.value}</span>
                  <div 
                    className={`w-7 rounded-t-sm transition-all duration-300 ${d.barStyle}`}
                    style={{ height: `${d.height}px` }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="flex justify-around text-[9px] text-slate-500 font-medium mt-3">
              {groupUsageData.map((d) => (
                <span key={d.group} className="w-12 text-center truncate">{d.group}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}