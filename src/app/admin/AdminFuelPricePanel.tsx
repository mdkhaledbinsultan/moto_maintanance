'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminFuelPricePanel() {
  const [effectiveDate, setEffectiveDate] = useState('');
  const [fuelType, setFuelType] = useState('Octane');
  const [pricePerLitre, setPricePerLitre] = useState('');
  const [fuelPricesList, setFuelPricesList] = useState<any[]>([]);

  const fetchFuelPrices = async () => {
    const { data } = await supabase
      .from('admin_fuel_prices')
      .select('*')
      .order('effective_date', { ascending: false });
    if (data) setFuelPricesList(data);
  };

  useEffect(() => {
    fetchFuelPrices();
  }, []);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDate || !pricePerLitre) {
      alert('⚠️ কার্যকর তারিখ এবং প্রতি লিটার মূল্য আবশ্যক!');
      return;
    }

    try {
      const { error } = await supabase.from('admin_fuel_prices').insert([
        {
          effective_date: effectiveDate,
          fuel_tag: fuelType,
          price_per_liter: Number(pricePerLitre)
        }
      ]);

      if (error) throw error;

      alert('✅ ফুয়েল প্রাইস সফলভাবে কনফিগার ও সেভ করা হয়েছে!');
      setPricePerLitre('');
      fetchFuelPrices();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-slate-100 mt-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
          <span>⛽</span> Fuel Price Configuration (অ্যাডমিন প্যানেল)
        </h3>
        <p className="text-[11px] text-slate-400">কার্যকর তারিখ অনুযায়ী বিভিন্ন জ্বালানির প্রতি লিটারের মূল্য নির্ধারণ ও আপডেট করুন।</p>
      </div>

      <form onSubmit={handleSavePrice} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-slate-300 font-bold block mb-1">কার্যকর তারিখ:</label>
          <input 
            type="date" 
            value={effectiveDate} 
            onChange={(e) => setEffectiveDate(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold" 
            required 
          />
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">Fuel Type:</label>
          <select 
            value={fuelType} 
            onChange={(e) => setFuelType(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
          >
            <option value="Octane">Octane</option>
            <option value="Petrol">Petrol</option>
          </select>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">Price / Litre (৳):</label>
          <input 
            type="number" 
            step="0.01"
            value={pricePerLitre} 
            onChange={(e) => setPricePerLitre(e.target.value)} 
            placeholder="যেমন: 145" 
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono" 
            required 
          />
        </div>

        <div className="flex items-end">
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer">
            + প্রাইস সেভ করুন
          </button>
        </div>
      </form>

      <div className="pt-2">
        <h4 className="font-bold text-slate-400 mb-2">নির্ধারিত ফুয়েল রেট লিস্ট (হিস্টোরিক্যাল):</h4>
        <div className="max-h-40 overflow-y-auto space-y-1.5">
          {fuelPricesList.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="font-mono text-slate-300">📅 {item.effective_date}</span>
              <span className="font-bold text-sky-400">{item.fuel_tag}</span>
              <span className="font-mono font-bold text-emerald-400">৳{item.price_per_liter} / লিটার</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}