'use client';
import { useState } from 'react';

const BD_BRTA_BRANDS = ['Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Hero', 'Kawasaki', 'KTM', 'Royal Enfield'];
const INITIAL_CC_LIST = ['80cc', '100cc', '110cc', '125cc', '135cc', '150cc', '155cc', '160cc', '200cc', '250cc', '300cc', '350cc'];

export default function AdminManualConfigPanel({ selectedUser }: any) {
  const [brands, setBrands] = useState<string[]>(BD_BRTA_BRANDS);
  const [ccList, setCcList] = useState<string[]>(INITIAL_CC_LIST);
  const [selectedBrand, setSelectedBrand] = useState(brands[0]);
  const [selectedCc, setSelectedCc] = useState('155cc');
  const [customBikeName, setCustomBikeName] = useState('');

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_BRAND') {
      const newBrand = prompt('নতুন ব্র্যান্ডের নাম লিখুন:');
      if (newBrand && newBrand.trim()) {
        const formatted = newBrand.trim();
        if (!brands.includes(formatted)) {
          setBrands(prev => [...prev, formatted]);
        }
        setSelectedBrand(formatted);
      }
    } else {
      setSelectedBrand(val);
    }
  };

  const handleCcChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_CC') {
      const newCc = prompt('নতুন সিসি লিখুন (যেমন: 400cc):');
      if (newCc && newCc.trim()) {
        const formatted = newCc.trim().toLowerCase().includes('cc') ? newCc.trim() : newCc.trim() + 'cc';
        if (!ccList.includes(formatted)) {
          setCcList(prev => [...prev, formatted]);
        }
        setSelectedCc(formatted);
      }
    } else {
      setSelectedCc(val);
    }
  };

  const handleSaveManualConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBikeName.trim()) {
      alert('⚠️ দয়া করে বাইকের মডেল বা নাম লিখুন!');
      return;
    }

    const payload = {
      brand: selectedBrand,
      cc: selectedCc,
      model: customBikeName.trim(),
      updatedForUser: selectedUser?.email || 'General Config'
    };

    console.log('Manual Config Saved:', payload);
    alert(`✅ সফলভাবে "${selectedBrand} - ${customBikeName.trim()} (${selectedCc})" ম্যানুয়াল কনফিগারেশন সেট করা হয়েছে!`);
    setCustomBikeName('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-slate-100 mt-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
          <span>⚙️</span> অ্যাডমিন ম্যানুয়াল কনফিগারেশন প্যানেল
        </h3>
        <p className="text-[11px] text-slate-400">গ্রাহকের বাইকের ব্র্যান্ড, সিসি এবং মডেল ম্যানুয়ালি সেট করুন।</p>
      </div>

      <form onSubmit={handleSaveManualConfig} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* ব্র্যান্ড সিলেকশন */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">বাইকের ব্র্যান্ড (Brand):</label>
            <select
              value={selectedBrand}
              onChange={handleBrandChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
            >
              {brands.map((b, idx) => (
                <option key={idx} value={b}>{b}</option>
              ))}
              <option value="ADD_NEW_CUSTOM_BRAND" className="text-sky-400 font-extrabold">
                ＋ নতুন ব্র্যান্ড যুক্ত করুন...
              </option>
            </select>
          </div>

          {/* সিসি ক্যাটাগরি ও প্লাস অপশন */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">সিসি ক্যাটাগরি (CC):</label>
            <select
              value={selectedCc}
              onChange={handleCcChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
            >
              {ccList.map((cc, idx) => (
                <option key={idx} value={cc}>{cc}</option>
              ))}
              <option value="ADD_NEW_CUSTOM_CC" className="text-emerald-400 font-extrabold">
                ＋ নতুন সিসি যুক্ত করুন...
              </option>
            </select>
          </div>

        </div>

        {/* বাইকের নাম বা মডেল লেখার ইনপুট */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold block">বাইকের মডেল / নাম (Bike Model Name):</label>
          <input
            type="text"
            value={customBikeName}
            onChange={(e) => setCustomBikeName(e.target.value)}
            placeholder="যেমন: R15 V4, FZS V3, Gixxer SF ইত্যাদি..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer"
        >
          ✓ ম্যানুয়াল কনফিগারেশন সেভ করুন
        </button>
      </form>
    </div>
  );
}