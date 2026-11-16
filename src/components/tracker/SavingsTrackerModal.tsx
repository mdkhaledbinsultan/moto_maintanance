'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS_LIST = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS_LIST = [
  { value: '01', name: 'জানুয়ারি' },
  { value: '02', name: 'ফেব্রুয়ারি' },
  { value: '03', name: 'মার্চ' },
  { value: '04', name: 'এপ্রিল' },
  { value: '05', name: 'মে' },
  { value: '06', name: 'জুন' },
  { value: '07', name: 'জুলাই' },
  { value: '08', name: 'আগস্ট' },
  { value: '09', name: 'সেপ্টেম্বর' },
  { value: '10', name: 'অক্টোবর' },
  { value: '11', name: 'নভেম্বর' },
  { value: '12', name: 'ডিসেম্বর' },
];
const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function SavingsTrackerModal({
  user,
  savingsEntriesList,
  setSavingsEntriesList,
  showSavingsModal,
  setShowSavingsModal,
  showSavingsDetailsModal,
  setShowSavingsDetailsModal,
  formatMoney
}: any) {
  const [selectedDay, setSelectedDay] = useState('12');
  const [selectedMonth, setSelectedMonth] = useState('09');
  const [selectedYear, setSelectedYear] = useState('2026');

  const [savingEntry, setSavingEntry] = useState({ amount: '', savingType: 'vara', customNote: '' });
  const [selectedSavingsYear, setSelectedSavingsYear] = useState<string | null>(null);
  const [selectedSavingsMonth, setSelectedSavingsMonth] = useState<string | null>(null);
  const [expandedSavingsYear, setExpandedSavingsYear] = useState<string | null>(null);

  useEffect(() => {
    if (showSavingsModal) {
      const today = new Date();
      const curYear = String(today.getFullYear());
      const curMonth = String(today.getMonth() + 1).padStart(2, '0');
      const curDay = String(today.getDate()).padStart(2, '0');

      setSelectedYear(curYear);
      setSelectedMonth(curMonth);
      setSelectedDay(curDay);
    }
  }, [showSavingsModal]);

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

  const handleSaveSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullDateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    const addVal = Number(savingEntry.amount) || 0;
    
    let finalNote = 'ভাড়া বাবদ সাশ্রয়';
    if (savingEntry.savingType === 'vara') {
      finalNote = 'ভাড়া বাবদ সাশ্রয়';
    } else if (savingEntry.savingType === 'ride_income') {
      finalNote = 'উবার ও পাঠাও হতে প্রাপ্ত ইনকাম';
    } else {
      finalNote = savingEntry.customNote || 'অন্যান্য সাশ্রয়';
    }

    try {
      if (user) {
        const { data, error } = await supabase
          .from('user_savings_entries')
          .insert([
            {
              user_id: user.id,
              title: finalNote,
              amount: addVal,
              date: fullDateStr
            }
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedList = [data[0], ...savingsEntriesList];
          setSavingsEntriesList(updatedList);
        }
      }
    } catch (err: any) {
      console.error('Error saving to Supabase:', err.message);
    }

    setShowSavingsModal(false);
    alert(`✅ ${fullDateStr} তারিখের সাশ্রয় এন্ট্রি সফলভাবে সুপাবেসে যোগ হয়েছে![cite: 16]`);
  };

  const handleDeleteSavings = async (id: any) => {
    if (!confirm('আপনি কি এই সাশ্রয় এন্ট্রিটি ডিলিট করতে চান?')) return;

    try {
      const { error } = await supabase
        .from('user_savings_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedList = savingsEntriesList.filter((item: any) => item.id !== id);
      setSavingsEntriesList(updatedList);
    } catch (err: any) {
      console.error('Error deleting savings:', err.message);
    }
  };

  return (
    <>
      {showSavingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">সাশ্রয় এন্ট্রি</h3>
              <button onClick={() => setShowSavingsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveSavings} className="space-y-3 text-xs">
              <div>
                <label className="text-emerald-400 font-bold block mb-1">তারিখ সিলেক্ট করুন (দিন - মাস - সাল):</label>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="bg-slate-950 border border-emerald-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center font-mono"
                  >
                    {DAYS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-950 border border-emerald-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center"
                  >
                    {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                  </select>

                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-slate-950 border border-emerald-500 rounded-xl p-2 text-white font-bold cursor-pointer text-center font-mono"
                  >
                    {YEARS_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-emerald-400 font-bold block mb-1">খাতের বিবরণ:</label>
                <select
                  value={savingEntry.savingType}
                  onChange={(e) => setSavingEntry({...savingEntry, savingType: e.target.value})}
                  className="w-full bg-slate-950 border border-emerald-500 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                >
                  <option value="vara">ভাড়া বাবদ সাশ্রয়</option>
                  <option value="ride_income">উবার ও পাঠাও হতে প্রাপ্ত ইনকাম</option>
                  <option value="others">অন্যান্য</option>
                </select>
              </div>

              {savingEntry.savingType === 'others' && (
                <div>
                  <label className="text-slate-100 font-bold block mb-1">নোট (ঐচ্ছিক বিবরণ):</label>
                  <input type="text" value={savingEntry.customNote} onChange={(e) => setSavingEntry({...savingEntry, customNote: e.target.value})} placeholder="যেমন: নিজে ওয়াশ করেছি" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" />
                </div>
              )}
              <div>
                <label className="text-slate-100 font-bold block mb-1">পরিমাণ (৳):</label>
                <input type="number" required value={savingEntry.amount} onChange={(e) => setSavingEntry({...savingEntry, amount: e.target.value})} placeholder="60" className="w-full bg-slate-950 border border-emerald-700 rounded-xl p-2.5 text-white font-bold" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold">+ সাশ্রয় যোগ করুন</button>
            </form>
          </div>
        </div>
      )}

      {showSavingsDetailsModal && (() => {
        const yearMonthStructure = getYearMonthStructure(savingsEntriesList);
        const displayedEntries = getFilteredEntries(savingsEntriesList, selectedSavingsYear, selectedSavingsMonth);

        const totalDisplayedAmount = displayedEntries.reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
        const varaAmount = displayedEntries
          .filter(item => (item.title || item.note || '').includes('ভাড়া'))
          .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
        const othersAmount = Math.max(0, totalDisplayedAmount - varaAmount);

        const varaPercent = totalDisplayedAmount > 0 ? Math.round((varaAmount / totalDisplayedAmount) * 100) : 0;
        const othersPercent = totalDisplayedAmount > 0 ? Math.max(0, 100 - varaPercent) : 0;

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-emerald-700/60 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-2 rounded-xl bg-emerald-950 border border-emerald-800">💰</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">সাশ্রয় এন্ট্রি ও ডেট-ওয়াইজ হিস্ট্রি</h3>
                    <p className="text-[11px] text-emerald-400">সর্বমোট {savingsEntriesList.length} টি এন্ট্রি</p>
                  </div>
                </div>
                <button onClick={() => setShowSavingsDetailsModal(false)} className="text-slate-400 hover:text-white text-base p-1.5 rounded-full bg-slate-800/80">✕</button>
              </div>

              {/* ওডোমিটারের অবিকল হুহু ফন্ট ও স্টাইলে গোল গ্রাফ প্যানেল */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 text-center">📊 সাশ্রয়ের খাত অনুযায়ী অনুপাত (গ্রাফ বিশ্লেষণ)</h4>
                
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                  {/* গোল বৃত্তাকার প্রোগ্রেস বা গ্রাফ */}
                  <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-inner"
                       style={{
                         background: `conic-gradient(#10b981 0% ${varaPercent}%, #00e1ff ${varaPercent}% 100%)`
                       }}>
                    <div className="absolute inset-1.5 bg-slate-950 rounded-full flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-black text-[#00e1ff] tracking-wider drop-shadow-[0_0_8px_rgba(0,225,255,0.3)]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                        {totalDisplayedAmount}
                      </span>
                      <span className="text-[8px] text-slate-400 font-extrabold">মোট (৳)</span>
                    </div>
                  </div>

                  {/* ক্যাটাগরি বিবরণ ও শতকরা হার */}
                  <div className="space-y-1.5 text-xs w-full sm:w-auto">
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> ভাড়া বাবদ:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{varaPercent}% ({formatMoney(varaAmount)})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> অন্যান্য:
                      </span>
                      <span className="font-black text-[#00e1ff] tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>{othersPercent}% ({formatMoney(othersAmount)})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">সাল ও মাস অনুযায়ী ফিল্টার:</span>
                  {(selectedSavingsYear || selectedSavingsMonth) && (
                    <button 
                      onClick={() => { setSelectedSavingsYear(null); setSelectedSavingsMonth(null); setExpandedSavingsYear(null); }}
                      className="text-[10px] text-sky-400 underline font-bold"
                    >
                      সব দেখাও (রিসেট)
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {yearMonthStructure.map(({ year, months }) => {
                    const isExp = expandedSavingsYear === year;
                    return (
                      <div key={year} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                        <button
                          onClick={() => {
                            const nextExp = isExp ? null : year;
                            setExpandedSavingsYear(nextExp);
                            setSelectedSavingsYear(nextExp);
                            setSelectedSavingsMonth(null);
                          }}
                          className="w-full p-2.5 flex justify-between items-center text-xs font-bold text-white hover:bg-slate-800/80 transition"
                        >
                          <span>📅 সাল: {year}</span>
                          <span className="text-emerald-400">{isExp ? '▲' : '▼'}</span>
                        </button>

                        {isExp && (
                          <div className="space-y-1 p-2 bg-slate-950 border-t border-slate-800">
                            {months.map(m => {
                              const isMonthSelected = selectedSavingsMonth === m.value;
                              return (
                                <button
                                  key={m.value}
                                  onClick={() => setSelectedSavingsMonth(isMonthSelected ? null : m.value)}
                                  className={`w-full text-xs p-2 rounded-lg font-bold border flex justify-between items-center transition ${isMonthSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                                >
                                  <span>{m.name}</span>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isMonthSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-950/80 text-emerald-400'}`}>
                                    সাশ্রয়: {formatMoney(m.totalAmount)}
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

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {displayedEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">কোনো সাশ্রয় এন্ট্রি নেই।</p>
                ) : (
                  displayedEntries.map((entry, idx) => (
                    <div key={entry.id || idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-emerald-400 font-mono font-bold block">{entry.date}</span>
                        <span className="text-slate-300 text-[11px]">{entry.title || entry.note || 'সাধারণ সাশ্রয়'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#00e1ff] tracking-wider drop-shadow-[0_0_10px_rgba(0,225,255,0.3)]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                          +{formatMoney(Number(entry.amount))}
                        </span>
                        <button 
                          onClick={() => handleDeleteSavings(entry.id)}
                          className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button onClick={() => setShowSavingsDetailsModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs">বন্ধ করুন</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}