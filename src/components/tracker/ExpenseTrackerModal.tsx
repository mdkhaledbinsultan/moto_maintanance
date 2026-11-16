'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS_LIST = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS_LIST = [
  { value: '01', name: 'জানুয়ারি' }, { value: '02', name: 'ফেব্রুয়ারি' }, { value: '03', name: 'মার্চ' },
  { value: '04', name: 'এপ্রিল' }, { value: '05', name: 'মে' }, { value: '06', name: 'জুন' },
  { value: '07', name: 'জুলাই' }, { value: '08', name: 'আগস্ট' }, { value: '09', name: 'সেপ্টেম্বর' },
  { value: '10', name: 'অক্টোবর' }, { value: '11', name: 'নভেম্বর' }, { value: '12', name: 'ডিসেম্বর' },
];
const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function ExpenseTrackerModal({
  user,
  expenseEntriesList,
  setExpenseEntriesList,
  showQuickExpenseModal,
  setShowQuickExpenseModal,
  showCostDetailsModal,
  setShowCostDetailsModal,
  formatMoney,
  vehicleType = 'fuel_bike'
}: any) {
  const [selectedDay, setSelectedDay] = useState('12');
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [selectedYear, setSelectedYear] = useState('2026');

  const defaultCategory = vehicleType === 'fuel_bike' ? 'Fuel' : 'Maintenance';
  const [quickExpense, setQuickExpense] = useState({ category: defaultCategory, customCategory: '', amount: '', note: '' });
  
  const [expenseOdometer, setExpenseOdometer] = useState('');
  const [currentLiveOdometer, setCurrentLiveOdometer] = useState(0);

  const [selectedExpenseYear, setSelectedExpenseYear] = useState<string | null>(null);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string | null>(null);
  const [expandedExpenseYear, setExpandedExpenseYear] = useState<string | null>(null);

  useEffect(() => {
    if (showQuickExpenseModal) {
      const today = new Date();
      setSelectedYear(String(today.getFullYear()));
      setSelectedMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setSelectedDay(String(today.getDate()).padStart(2, '0'));

      if (typeof window !== 'undefined') {
        const savedOdo = Number(localStorage.getItem('bike_current_odo') || '0');
        setCurrentLiveOdometer(savedOdo);
        setExpenseOdometer(String(savedOdo));
      }
    }
  }, [showQuickExpenseModal]);

  const getFilteredEntries = (entries: any[], year: string | null, month: string | null) => {
    if (year && month) {
      return entries.filter(item => {
        const d = item.date || '2026-09-12';
        const [y, m] = d.split('-');
        return y === year && m === month;
      });
    } else if (year) {
      return entries.filter(item => {
        const d = item.date || '2026-09-12';
        const [y] = d.split('-');
        return y === year;
      });
    } else if (month) {
      return entries.filter(item => {
        const d = item.date || '2026-09-12';
        const [, m] = d.split('-');
        return m === month;
      });
    }
    return entries; 
  };

  const getYearMonthStructure = (entries: any[]) => {
    const yearsMap: Record<string, string[]> = {};
    const monthsObj: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };

    entries.forEach(e => {
      const d = e.date || '2026-09-12';
      const [y, m] = d.split('-');
      if (y && m) {
        if (!yearsMap[y]) yearsMap[y] = [];
        if (!yearsMap[y].includes(m)) yearsMap[y].push(m);
      }
    });

    return Object.keys(yearsMap).sort().reverse().map(y => ({
      year: y,
      months: yearsMap[y].sort().map(m => ({
        value: m,
        name: monthsObj[m] || m,
        totalAmount: entries
          .filter(item => {
            const itemDate = item.date || '2026-09-12';
            const [itemY, itemM] = itemDate.split('-');
            return itemY === y && itemM === m;
          })
          .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0)
      }))
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullDateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    const expCost = parseFloat(quickExpense.amount) || 0;
    const finalCategoryName = quickExpense.category === 'Others' ? (quickExpense.customCategory || 'অন্যান্য') : quickExpense.category;

    const isFuelOrOil = vehicleType === 'fuel_bike' && (quickExpense.category === 'Fuel' || quickExpense.category === 'Engine Oil');
    let enteredOdo = 0;
    
    if (isFuelOrOil || quickExpense.category === 'Maintenance') {
      enteredOdo = Number(expenseOdometer);
      if (!isNaN(enteredOdo) && enteredOdo > currentLiveOdometer && typeof window !== 'undefined') {
        localStorage.setItem('bike_current_odo', String(enteredOdo));
        window.dispatchEvent(new Event('bike_odometer_updated'));
        window.dispatchEvent(new Event('storage'));

        if (user) {
          try {
            await supabase
              .from('profiles')
              .upsert({ id: user.id, odometer: enteredOdo }, { onConflict: 'id' });
          } catch (err) {
            console.error('Error syncing odometer to Supabase:', err);
          }
        }
      }
    }

    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_expense_entries')
          .insert([
            {
              user_id: user.id,
              title: finalCategoryName,
              amount: expCost,
              category: finalCategoryName,
              date: fullDateStr,
              odometer: enteredOdo > 0 ? enteredOdo : 0
            }
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedList = [data[0], ...expenseEntriesList];
          setExpenseEntriesList(updatedList);
        }
      }
    } catch (err: any) {
      console.error('Error saving expense to Supabase:', err.message);
    }

    setShowQuickExpenseModal(false);
    alert(`✅ ${fullDateStr} তারিখের (${finalCategoryName}) খরচ সফলভাবে সংরক্ষিত হয়েছে!`);
  };

  const handleDeleteExpense = async (id: any) => {
    if (!confirm('আপনি কি এই খরচ এন্ট্রিটি ডিলিট করতে চান?')) return;

    try {
      const { error } = await supabase
        .from('user_expense_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedList = expenseEntriesList.filter((e: any) => e.id !== id);
      setExpenseEntriesList(updatedList);
    } catch (err: any) {
      console.error('Error deleting expense:', err.message);
    }
  };

  return (
    <>
      {showQuickExpenseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">খরচ এন্ট্রি</h3>
              <button onClick={() => setShowQuickExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-rose-400 font-bold block mb-1">তারিখ সিলেক্ট করুন (দিন - মাস - সাল):</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="bg-slate-950 border border-rose-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center font-mono"
                  >
                    {DAYS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-950 border border-rose-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center"
                  >
                    {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                  </select>

                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-950 border border-rose-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center font-mono"
                  >
                    {YEARS_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-100 font-bold block mb-1">খাতের নাম:</label>
                <select 
                  value={quickExpense.category} 
                  onChange={(e) => setQuickExpense({...quickExpense, category: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {vehicleType === 'fuel_bike' ? (
                    <>
                      <option value="Fuel">ফুয়েল</option>
                      <option value="Engine Oil">ইঞ্জিন অয়েল</option>
                      <option value="Maintenance">মেইনটেন্যান্স</option>
                      <option value="Others">অন্যান্য</option>
                    </>
                  ) : (
                    <>
                      <option value="Maintenance">মেইনটেন্যান্স (সার্ভিসিং ও পার্টস)</option>
                      <option value="Others">অন্যান্য (চার্জিং/অন্যান্য খরচ)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/50 space-y-1 animate-fadeIn">
                <label className="text-sky-400 font-bold block">বর্তমান ওডোমিটার (KM):</label>
                <input 
                  type="number" 
                  value={expenseOdometer} 
                  onChange={(e) => setExpenseOdometer(e.target.value)} 
                  placeholder="যেমন: 1200" 
                  className="w-full bg-slate-900 border border-sky-500 rounded-xl p-2.5 text-white font-bold font-mono" 
                />
                <span className="text-[10px] text-slate-400 block">বর্তমান রিডিং: {currentLiveOdometer} KM</span>
              </div>

              {quickExpense.category === 'Others' && (
                <div>
                  <label className="text-amber-400 font-bold block mb-1">অন্যান্য খাতের নাম লিখুন:</label>
                  <input type="text" required maxLength={30} value={quickExpense.customCategory} onChange={(e) => setQuickExpense({...quickExpense, customCategory: e.target.value})} placeholder="সর্বোচ্চ ৩০ অক্ষর" className="w-full bg-slate-950 border border-amber-500 rounded-xl p-2.5 text-white font-bold" />
                </div>
              )}
              <div>
                <label className="text-slate-100 font-bold block mb-1">পরিমাণ (৳):</label>
                <input type="number" required value={quickExpense.amount} onChange={(e) => setQuickExpense({...quickExpense, amount: e.target.value})} placeholder="100" className="w-full bg-slate-950 border border-rose-700 rounded-xl p-2.5 text-white font-bold" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl font-bold">+ খরচ সংরক্ষণ করুন</button>
            </form>
          </div>
        </div>
      )}

      {showCostDetailsModal && (() => {
        const yearMonthStructure = getYearMonthStructure(expenseEntriesList);
        const displayedEntries = getFilteredEntries(expenseEntriesList, selectedExpenseYear, selectedExpenseMonth);

        const totalDisplayedAmount = displayedEntries.reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
        
        const fuelAmount = displayedEntries
          .filter(item => (item.title || item.category || '').toLowerCase().includes('fuel') || (item.title || item.category || '').includes('ফুয়েল'))
          .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);

        const engineOilAmount = displayedEntries
          .filter(item => (item.title || item.category || '').toLowerCase().includes('engine oil') || (item.title || item.category || '').includes('ইঞ্জিন'))
          .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);

        const maintenanceAmount = displayedEntries
          .filter(item => (item.title || item.category || '').toLowerCase().includes('maintenance') || (item.title || item.category || '').includes('মেইনটেন্যান্স'))
          .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);

        const othersAmount = Math.max(0, totalDisplayedAmount - (fuelAmount + engineOilAmount + maintenanceAmount));

        const fuelPercent = totalDisplayedAmount > 0 ? Math.round((fuelAmount / totalDisplayedAmount) * 100) : 0;
        const engineOilPercent = totalDisplayedAmount > 0 ? Math.round((engineOilAmount / totalDisplayedAmount) * 100) : 0;
        const maintenancePercent = totalDisplayedAmount > 0 ? Math.round((maintenanceAmount / totalDisplayedAmount) * 100) : 0;
        const othersPercent = totalDisplayedAmount > 0 ? Math.max(0, 100 - (fuelPercent + engineOilPercent + maintenancePercent)) : 0;

        const p1 = fuelPercent;
        const p2 = p1 + engineOilPercent;
        const p3 = p2 + maintenancePercent;

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-rose-700/60 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative text-xs text-white">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-2 rounded-xl bg-rose-950 border border-rose-800">💸</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">খরচ এন্ট্রি ও ডেট-ওয়াইজ হিস্ট্রি</h3>
                    <p className="text-[11px] text-rose-400">সর্বমোট {expenseEntriesList.length} টি খরচ এন্ট্রি</p>
                  </div>
                </div>
                <button onClick={() => setShowCostDetailsModal(false)} className="text-slate-400 hover:text-white text-base p-1.5 rounded-full bg-slate-800/80">✕</button>
              </div>

              {/* গ্রাফ ও পাই-চার্ট অ্যানালিটিক্স প্যানেল */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 text-center">📊 খরচের খাত অনুযায়ী অনুপাত (গ্রাফ বিশ্লেষণ)</h4>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-inner"
                       style={{
                         background: `conic-gradient(#f43f5e 0% ${p1}%, #38bdf8 ${p1}% ${p2}%, #fbbf24 ${p2}% ${p3}%, #a855f7 ${p3}% 100%)`
                       }}>
                    <div className="absolute inset-1.5 bg-slate-950 rounded-full flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-black text-[#00e1ff] tracking-wider drop-shadow-[0_0_8px_rgba(0,225,255,0.3)]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                        {totalDisplayedAmount}
                      </span>
                      <span className="text-[8px] text-slate-400 font-extrabold">মোট (৳)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs w-full sm:w-auto">
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> ফুয়েল:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{fuelPercent}% ({formatMoney(fuelAmount)})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span> ইঞ্জিন অয়েল:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{engineOilPercent}% ({formatMoney(engineOilAmount)})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> মেইনটেন্যান্স:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{maintenancePercent}% ({formatMoney(maintenanceAmount)})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> অন্যান্য:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{othersPercent}% ({formatMoney(othersAmount)})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* সাল ও মাস অনুযায়ী ফিল্টার প্যানেল */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-400">সাল ও মাস অনুযায়ী ফিল্টার:</span>
                  {(selectedExpenseYear || selectedExpenseMonth) && (
                    <button 
                      onClick={() => { setSelectedExpenseYear(null); setSelectedExpenseMonth(null); setExpandedExpenseYear(null); }}
                      className="text-[10px] text-sky-400 underline font-bold"
                    >
                      সব দেখাও (রিসেট)
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {yearMonthStructure.map(({ year, months }) => {
                    const isExp = expandedExpenseYear === year;
                    return (
                      <div key={year} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            const nextExp = isExp ? null : year;
                            setExpandedExpenseYear(nextExp);
                            setSelectedExpenseYear(nextExp);
                            setSelectedExpenseMonth(null);
                          }}
                          className="w-full p-2.5 flex justify-between items-center text-xs font-bold text-white hover:bg-slate-800/80 transition"
                        >
                          <span>📅 সাল: {year}</span>
                          <span className="text-rose-400">{isExp ? '▲' : '▼'}</span>
                        </button>

                        {isExp && (
                          <div className="space-y-1 p-2 bg-slate-950 border-t border-slate-800">
                            {months.map(m => {
                              const isMonthSelected = selectedExpenseMonth === m.value;
                              return (
                                <button
                                  key={m.value}
                                  type="button"
                                  onClick={() => setSelectedExpenseMonth(isMonthSelected ? null : m.value)}
                                  className={`w-full text-xs p-2 rounded-lg font-bold border flex justify-between items-center transition ${isMonthSelected ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                                >
                                  <span>{m.name}</span>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isMonthSelected ? 'bg-rose-800 text-white' : 'bg-rose-950/80 text-rose-400'}`}>
                                    খরচ: {formatMoney(m.totalAmount)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* খরচের এন্ট্রি লিস্ট */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {displayedEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">কোনো খরচ এন্ট্রি নেই।</p>
                ) : (
                  displayedEntries.map((item, idx) => (
                    <div key={item.id || idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-rose-400 font-mono font-bold block">{item.date}</span>
                        <span className="text-slate-300 text-[11px]">{item.title || item.category} {item.odometer ? `(Odo: ${item.odometer} KM)` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-rose-400 text-sm">-{formatMoney(Number(item.amount))}</span>
                        <button 
                          type="button"
                          onClick={() => handleDeleteExpense(item.id)}
                          className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={() => setShowCostDetailsModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs">বন্ধ করুন</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}