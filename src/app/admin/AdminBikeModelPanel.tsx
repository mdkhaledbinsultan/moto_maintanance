'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BD_BRTA_BRANDS = ['Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Hero', 'Kawasaki', 'KTM', 'Royal Enfield'];
const INITIAL_CC_LIST = ['80cc', '100cc', '110cc', '125cc', '135cc', '150cc', '155cc', '160cc', '200cc', '250cc', '300cc', '350cc'];

export default function AdminBikeModelPanel({ selectedUser }: any) {
  const [brands, setBrands] = useState<string[]>(BD_BRTA_BRANDS);
  const [ccList, setCcList] = useState<string[]>(INITIAL_CC_LIST);
  
  const [manualBrand, setManualBrand] = useState(brands[0]);
  const [manualCc, setManualCc] = useState('155cc');
  const [customBikeName, setCustomBikeName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_BRAND') {
      const newBrand = prompt('নতুন ব্র্যান্ডের নাম লিখুন:');
      if (newBrand && newBrand.trim()) {
        const formatted = newBrand.trim();
        if (!brands.includes(formatted)) {
          setBrands(prev => [...prev, formatted]);
        }
        setManualBrand(formatted);
      }
    } else {
      setManualBrand(val);
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
        setManualCc(formatted);
      }
    } else {
      setManualCc(val);
    }
  };

  // 🚀 সুপাবেস admin_bike_models_master টেবিলে বাইক মডেল সেভ করার ফাংশন
  const handleSaveManualBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBikeName.trim()) {
      alert('⚠️ দয়া করে বাইকের মডেল বা নাম লিখুন!');
      return;
    }

    const trimmedModel = customBikeName.trim();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('admin_bike_models_master')
        .insert([
          {
            brand: manualBrand,
            cc: manualCc,
            model_name: trimmedModel
          }
        ]);

      if (error) throw error;

      alert(`✅ সফলভাবে সুপাবেস ডাটাবেজে বাইক ও মডেল (${manualBrand} - ${trimmedModel} [${manualCc}]) সংরক্ষণ করা হয়েছে!`);
      setCustomBikeName('');
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-slate-100">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
          <span>⚙️</span> ১. অ্যাডমিন ম্যানুয়াল বাইক ও মডেল কনফিগারেশন প্যানেল (সুপাবেস ডাটাবেজ যুক্ত)
        </h3>
        <p className="text-[11px] text-slate-400">বাইকের ব্র্যান্ড, সিসি এবং নির্দিষ্ট মডেল সেট করুন যা সরাসরি সুপাবেস টেবিলে জমা হবে এবং সকল ব্যবহারকারী দেখতে পাবে।</p>
      </div>

      <form onSubmit={handleSaveManualBike} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">বাইকের ব্র্যান্ড (Brand):</label>
            <select
              value={manualBrand}
              onChange={handleBrandChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
            >
              {brands.map((b, idx) => (
                <option key={idx} value={b}>{b}</option>
              ))}
              <option value="ADD_NEW_CUSTOM_BRAND" className="text-sky-400 font-extrabold">＋ নতুন ব্র্যান্ড যুক্ত করুন...</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">সিসি ক্যাটাগরি (CC):</label>
            <select
              value={manualCc}
              onChange={handleCcChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
            >
              {ccList.map((cc, idx) => (
                <option key={idx} value={cc}>{cc}</option>
              ))}
              <option value="ADD_NEW_CUSTOM_CC" className="text-emerald-400 font-extrabold">＋ নতুন সিসি যুক্ত করুন...</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold block">বাইকের মডেল / নাম (Bike Model Name):</label>
          <input
            type="text"
            value={customBikeName}
            onChange={(e) => setCustomBikeName(e.target.value)}
            placeholder="যেমন: R15 V4, FZS V3 ইত্যাদি..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? 'সংরক্ষণ করা হচ্ছে...' : '✓ ডাটাবেজে ম্যানুয়াল বাইক ও মডেল সেভ করুন'}
        </button>
      </form>
    </div>
  );
}