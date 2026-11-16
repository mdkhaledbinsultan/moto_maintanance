'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomerMileageCalculatorModal({ isOpen, onClose, user, expenseEntriesList, formatMoney }: any) {
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      const { data } = await supabase.from('admin_fuel_prices').select('*').order('effective_date', { ascending: true });
      if (data) setFuelPrices(data);
    };
    fetchPrices();
  }, []);

  const getEffectivePriceForDate = (entryDate: string) => {
    if (!fuelPrices || fuelPrices.length === 0) return 140;
    let matchedPrice = fuelPrices[0].price_per_liter;
    
    for (const fp of fuelPrices) {
      if (new Date(fp.effective_date) <= new Date(entryDate)) {
        matchedPrice = fp.price_per_liter;
      } else {
        break;
      }
    }
    return Number(matchedPrice);
  };

  useEffect(() => {
    const fuelEntries = (expenseEntriesList || [])
      .filter((item: any) => {
        const cat = (item.title || item.category || '').toLowerCase();
        return cat.includes('fuel') || cat.includes('ফুয়েল');
      })
      .sort((a: any, b: any) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());

    let processed = [];
    const totalCount = fuelEntries.length;

    for (let i = 0; i < totalCount; i++) {
      const curr = fuelEntries[i];
      const currentEntryDate = curr.date || '2026-05-06';
      const cost = Number(curr.amount) || 0;
      
      // এই নির্দিষ্ট ফুয়েল এন্ট্রির সময় যে ওডোমিটার ইনপুট দেওয়া হয়েছিল (আজকের গ্লোবাল ওডোমিটার এখানে কোনোভাবেই কাউন্ট হবে না)
      let currentOdo = Number(curr.odometer ?? curr.expenseOdometer ?? 0);

      const pricePerLitre = getEffectivePriceForDate(currentEntryDate);
      const litres = pricePerLitre > 0 ? cost / pricePerLitre : 0;

      let startDateStr = currentEntryDate;
      let startOdo = 0;
      let distance = 0;
      let mileage = null;
      let rawMileageNum = 0;

      if (i > 0) {
        const prev = fuelEntries[i - 1];
        startDateStr = prev.date || '2026-05-06';
        
        // ঠিক পূর্ববর্তী রিফিলের সময়কার নিজস্ব ওডোমিটার রিডিং
        startOdo = Number(prev.odometer ?? prev.expenseOdometer ?? 0);
        
        // পূর্ববর্তী ওডোমিটার থেকে বর্তমান রিফিলের নিজস্ব ওডোমিটারের প্রকৃত দূরত্ব
        distance = Math.max(0, currentOdo - startOdo);
        
        // পূর্বের রিফিলের তেলের পরিমাণের ওপর ভিত্তি করে সঠিক মাইলেজ হিসাব
        const prevCost = Number(prev.amount) || 0;
        const prevPrice = getEffectivePriceForDate(startDateStr);
        const prevLitres = prevPrice > 0 ? prevCost / prevPrice : 0;
        
        if (distance > 0 && prevLitres > 0) {
          rawMileageNum = distance / prevLitres;
          mileage = rawMileageNum.toFixed(2) + ' KM/L';
        }
      } else {
        startDateStr = currentEntryDate;
        startOdo = 0;
      }

      const formatDateToDDMMYYYY = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateStr;
        }
        return dateStr;
      };

      processed.push({
        id: curr.id || i,
        rawDate: currentEntryDate,
        startDate: formatDateToDDMMYYYY(startDateStr),
        endDate: formatDateToDDMMYYYY(currentEntryDate),
        fuelType: 'Octane',
        pricePerLitre,
        cost,
        litres: litres.toFixed(2),
        startOdo,
        endOdo: currentOdo, // একদম সুনির্দিষ্টভাবে ওই তেল নেওয়ার সময়কার ওডোমিটার
        distance: i > 0 ? `${distance} KM` : '—',
        mileageNum: rawMileageNum,
        mileage: mileage !== null ? mileage : '—'
      });
    }

    setHistoryData(processed.reverse());
  }, [expenseEntriesList, fuelPrices]);

  const validMileages = historyData.filter((i: any) => i.mileageNum > 0);
  const averageMileage = validMileages.length > 0 
    ? (validMileages.reduce((sum, curr) => sum + curr.mileageNum, 0) / validMileages.length).toFixed(2) 
    : '0.00';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <style jsx global>{`
        @keyframes odo-color-flash {
          0% { color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
          33% { color: #eab308; text-shadow: 0 0 15px rgba(234, 179, 8, 0.6); }
          66% { color: #22c55e; text-shadow: 0 0 15px rgba(34, 197, 94, 0.6); }
          100% { color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
        }
        .flashing-average-mileage {
          animation: odo-color-flash 4s infinite ease-in-out;
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl p-6 rounded-3xl shadow-2xl space-y-5 text-xs text-white max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
              <span>⛽</span> ফুয়েল টু ফুয়েল ডেট-ওয়াইজ মাইলেজ হিসাব
            </h3>
            <p className="text-[11px] text-amber-400 mt-0.5">
              প্রতিটি ফুয়েল রিফিলের নিজস্ব ওডোমিটার রিডিং অনুযায়ী সঠিক দূরত্ব এবং মাইলেজ।
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base cursor-pointer">✕</button>
        </div>

        {/* ফ্লাশিং এভারেজ মাইলেজ ডিসপ্লে প্যানেল */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-bold text-slate-300 block">সর্বমোট গড় এভারেজ মাইলেজ:</span>
            <span className="text-[10px] text-slate-500">ফুয়েল টু ফুয়েল এন্ট্রির সঠিক হিসাব</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span 
              className="text-3xl md:text-4xl font-black tracking-wider flashing-average-mileage"
              style={{ fontFamily: 'Arial Black, sans-serif' }}
            >
              {averageMileage}
            </span>
            <span className="text-xs font-extrabold text-slate-400">KM/L</span>
          </div>
        </div>

        {/* ফুয়েল টু ফুয়েল হিস্ট্রি টেবিল */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-3">পূর্বের তারিখ (Start)</th>
                  <th className="p-3">আজকের তারিখ (End)</th>
                  <th className="p-3">ফুয়েল</th>
                  <th className="p-3">মূল্য/লিটার</th>
                  <th className="p-3">মোট খরচ</th>
                  <th className="p-3">লিটার</th>
                  <th className="p-3">পূর্বের ওডো</th>
                  <th className="p-3">বর্তমান ওডো (End)</th>
                  <th className="p-3">দূরত্ব (Distance)</th>
                  <th className="p-3 text-right">মাইলেজ (KM/L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {historyData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-500 font-sans">কোনো ফুয়েল এন্ট্রি পাওয়া যায়নি। সঠিক মাইলেজ দেখতে ফুয়েল খরচ এন্ট্রি দিন।</td>
                  </tr>
                ) : (
                  historyData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 text-sky-300 font-bold">{item.startDate}</td>
                      <td className="p-3 text-sky-400 font-bold">{item.endDate}</td>
                      <td className="p-3 text-slate-300">{item.fuelType}</td>
                      <td className="p-3 text-amber-400">৳{item.pricePerLitre}</td>
                      <td className="p-3 text-rose-400 font-bold">{formatMoney(item.cost)}</td>
                      <td className="p-3 text-emerald-400">{item.litres} L</td>
                      <td className="p-3 text-slate-400">{item.startOdo.toLocaleString()} KM</td>
                      <td className="p-3 text-slate-200">{item.endOdo.toLocaleString()} KM</td>
                      <td className="p-3 text-sky-400 font-bold">{item.distance}</td>
                      <td className="p-3 text-right font-black text-[#00e1ff]">{item.mileage}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">
          বন্ধ করুন
        </button>

      </div>
    </div>
  );
}