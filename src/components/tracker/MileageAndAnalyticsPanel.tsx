'use client';
import { useState, useMemo } from 'react';

export default function MileageAndAnalyticsPanel({ expenseList, savingsList, currentOdometer }: { expenseList: any[]; savingsList: any[]; currentOdometer: number }) {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // সময়ভিত্তিক ফিল্টারিং লজিক
  const filteredData = useMemo(() => {
    const now = new Date();
    return {
      expenses: expenseList.filter(item => {
        const itemDate = new Date(item.date || item.created_at || now);
        if (timeFilter === 'daily') {
          return itemDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'weekly') {
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        } else if (timeFilter === 'monthly') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'yearly') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      }),
      savings: savingsList.filter(item => {
        const itemDate = new Date(item.date || item.created_at || now);
        if (timeFilter === 'daily') {
          return itemDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'weekly') {
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        } else if (timeFilter === 'monthly') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'yearly') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      })
    };
  }, [expenseList, savingsList, timeFilter]);

  // খরচ ক্যাটাগরি অনুযায়ী হিসাব
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = { Fuel: 0, 'Engine Oil': 0, Others: 0 };
    filteredData.expenses.forEach(item => {
      const cat = item.category || 'Others';
      map[cat] = (map[cat] || 0) + (Number(item.amount) || 0);
    });
    return map;
  }, [filteredData.expenses]);

  const totalExpense = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
  const totalSavings = filteredData.savings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // শতাংশ হিসাব
  const fuelPercent = totalExpense > 0 ? ((expenseByCategory['Fuel'] || 0) / totalExpense) * 100 : 0;
  const oilPercent = totalExpense > 0 ? ((expenseByCategory['Engine Oil'] || 0) / totalExpense) * 100 : 0;
  const othersPercent = totalExpense > 0 ? ((expenseByCategory['Others'] || 0) / totalExpense) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0c1322] to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 text-xs text-slate-100 relative overflow-hidden">
      
      {/* ব্যাকগ্রাউন্ড থ্রিডি গ্লো ইফেক্ট */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* প্যানেল হেডার ও ফিল্টার ট্যাব */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div>
          <h3 className="font-extrabold text-sky-400 text-sm flex items-center gap-2">
            <span>📊</span> বাইকের মাইলেজ, খরচ ও থ্রিডি অ্যানালিটিক্স প্যানেল
          </h3>
          <p className="text-[11px] text-slate-400">ওডোমিটার: <b className="text-amber-400">{currentOdometer} KM</b> | রিয়েল-টাইম থ্রিডি গ্রাফ ওভারভিউ</p>
        </div>

        {/* সময় ফিল্টার বাটন */}
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setTimeFilter('daily')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${timeFilter === 'daily' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            দৈনিক
          </button>
          <button
            onClick={() => setTimeFilter('weekly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${timeFilter === 'weekly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            সাপ্তাহিক
          </button>
          <button
            onClick={() => setTimeFilter('monthly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${timeFilter === 'monthly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            মাসিক
          </button>
          <button
            onClick={() => setTimeFilter('yearly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${timeFilter === 'yearly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            বাৎসরিক
          </button>
        </div>
      </div>

      {/* থ্রিডি প্রোগ্রেসিভ কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* ফুয়েল খরচ কার্ড */}
        <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-xl transform transition hover:scale-[1.02]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5"><span>⛽</span> ফুয়েল খরচ</span>
            <span className="text-amber-400 font-mono font-bold">{fuelPercent.toFixed(0)}%</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">৳{expenseByCategory['Fuel'] || 0}</div>
          
          {/* থ্রিডি গ্রাস ফিল প্রোগ্রেস বার */}
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(251,191,36,0.5)]" 
              style={{ width: `${fuelPercent}%` }} 
            />
          </div>
        </div>

        {/* ইঞ্জিন অয়েল খরচ কার্ড */}
        <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-xl transform transition hover:scale-[1.02]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5"><span>🛢️</span> ইঞ্জিন অয়েল খরচ</span>
            <span className="text-sky-400 font-mono font-bold">{oilPercent.toFixed(0)}%</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400">৳{expenseByCategory['Engine Oil'] || 0}</div>
          
          {/* থ্রিডি প্রোগ্রেস বার */}
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-sky-600 to-sky-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(56,189,248,0.5)]" 
              style={{ width: `${oilPercent}%` }} 
            />
          </div>
        </div>

        {/* অন্যান্য মেইনটেনেন্স খরচ কার্ড */}
        <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-xl transform transition hover:scale-[1.02]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5"><span>⚙️</span> অন্যান্য মেইনটেনেন্স</span>
            <span className="text-rose-400 font-mono font-bold">{othersPercent.toFixed(0)}%</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">৳{expenseByCategory['Others'] || 0}</div>
          
          {/* থ্রিডি প্রোগ্রেস বার */}
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(251,113,133,0.5)]" 
              style={{ width: `${othersPercent}%` }} 
            />
          </div>
        </div>

      </div>

      {/* থ্রিডি গ্রাফ ও সাশ্রয় তুলনামূলক প্যানেল */}
      <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-4 relative z-10 shadow-inner">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <span>📈</span> খরচ বনাম সাশ্রয় থ্রিডি গ্রাফ অ্যানালিটিক্স ({timeFilter === 'daily' ? 'আজকের' : timeFilter === 'weekly' ? 'সাপ্তাহিক' : timeFilter === 'monthly' ? 'মাসিক' : 'বাৎসরিক'})
          </h4>
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-sky-300 font-mono px-2 py-0.5 rounded">রিয়েল-টাইম সিঙ্কড</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
            <span className="text-slate-400 block text-[11px]">নির্বাচিত সময়ের মোট খরচ</span>
            <span className="text-rose-400 font-extrabold text-xl font-mono">৳{totalExpense}</span>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${totalExpense > 0 ? 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
            <span className="text-slate-400 block text-[11px]">নির্বাচিত সময়ের মোট সাশ্রয়</span>
            <span className="text-emerald-400 font-extrabold text-xl font-mono">৳{totalSavings}</span>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${totalSavings > 0 ? 100 : 0}%` }} />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}