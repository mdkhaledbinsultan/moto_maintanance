'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'জানুয়ারি (01)' }, { value: '02', label: 'ফেব্রুয়ারি (02)' }, { value: '03', label: 'মার্চ (03)' },
  { value: '04', label: 'এপ্রিল (04)' }, { value: '05', label: 'মে (05)' }, { value: '06', label: 'জুন (06)' },
  { value: '07', label: 'জুলাই (07)' }, { value: '08', label: 'আগস্ট (08)' }, { value: '09', label: 'সেপ্টেম্বর (09)' },
  { value: '10', label: 'অক্টোবর (10)' }, { value: '11', label: 'নভেম্বর (11)' }, { value: '12', label: 'ডিসেম্বর (12)' }
];
const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

export default function NewBikeFreeandPaidService({ user, fetchLogs, manualPurchaseDate, vehicleType = 'fuel_bike' }: { user: any; fetchLogs?: any; manualPurchaseDate?: string; vehicleType?: string }) {
  const [serviceRules, setServiceRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [remainingKmCount, setRemainingKmCount] = useState(0);
  const [targetService, setTargetService] = useState<any>(null);

  // 🚀 বর্তমান ওডোমিটার রিয়েল-টাইম সিঙ্ক করার জন্য স্টেট ও ইভেন্ট লিসেনার
  const [liveOdometer, setLiveOdometer] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedOdo = localStorage.getItem('bike_current_odo');
      if (savedOdo !== null && savedOdo !== '') return Number(savedOdo) || 0;
    }
    return Number(user?.odometer || 0);
  });

  useEffect(() => {
    const handleOdometerSync = () => {
      if (typeof window !== 'undefined') {
        const savedOdo = localStorage.getItem('bike_current_odo');
        if (savedOdo !== null && savedOdo !== '') {
          setLiveOdometer(Number(savedOdo) || 0);
        }
      }
    };

    handleOdometerSync();
    window.addEventListener('bike_odometer_updated', handleOdometerSync);
    window.addEventListener('storage', handleOdometerSync);

    return () => {
      window.removeEventListener('bike_odometer_updated', handleOdometerSync);
      window.removeEventListener('storage', handleOdometerSync);
    };
  }, []);

  const [syncedPurchaseDate, setSyncedPurchaseDate] = useState<string>(() => {
    return manualPurchaseDate || '06-05-2026';
  });

  const [completedHistoryList, setCompletedHistoryList] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceKm, setNewServiceKm] = useState('');
  const [newServiceDays, setNewServiceDays] = useState('');
  const [newServiceType, setNewServiceType] = useState('free');

  const [selectedServiceToComplete, setSelectedServiceToComplete] = useState<any>(null);
  const [doneDay, setDoneDay] = useState('06');
  const [doneMonth, setDoneMonth] = useState('05');
  const [doneYear, setDoneYear] = useState('2026');
  const [serviceDoneOdo, setServiceDoneOdo] = useState('');

  const defaultServices = vehicleType === 'fuel_bike' ? [
    { id: 'service_1', title: '১ম ফ্রি সার্ভিস', targetKm: 1000, targetDays: 30, type: 'free', completed: false, date: null, odometer: null },
    { id: 'service_2', title: '২য় ফ্রি সার্ভিস', targetKm: 3000, targetDays: 90, type: 'free', completed: false, date: null, odometer: null },
    { id: 'service_3', title: '৩য় ফ্রি সার্ভিস', targetKm: 5000, targetDays: 180, type: 'free', completed: false, date: null, odometer: null },
    { id: 'service_4', title: '১ম পেইড সার্ভিস', targetKm: 7500, targetDays: 240, type: 'paid', completed: false, date: null, odometer: null },
    { id: 'service_5', title: '২য় পেইড সার্ভিস', targetKm: 10000, targetDays: 300, type: 'paid', completed: false, date: null, odometer: null }
  ] : [];

  const currentUserId = user?.id;

  useEffect(() => {
    const fetchServiceRulesFromSupabase = async () => {
      try {
        let userId = currentUserId;
        if (!userId) {
          const { data } = await supabase.auth.getUser();
          userId = data?.user?.id;
        }

        if (userId) {
          const { data, error } = await supabase
            .from('user_service_states')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            if (data.service_rules && Array.isArray(data.service_rules)) {
              setServiceRules(data.service_rules);
            }
            if (data.history_list && Array.isArray(data.history_list)) {
              setCompletedHistoryList(data.history_list);
            }
            setLoading(false);
            return;
          }
        }

        setServiceRules(defaultServices);
      } catch (err) {
        setServiceRules(defaultServices);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRulesFromSupabase();
  }, [currentUserId, vehicleType]);

  const saveStateToSupabase = async (newRules: any[], newHistory: any[]) => {
    let userId = currentUserId;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id;
    }

    if (userId) {
      try {
        await supabase.from('user_service_states').upsert([
          {
            user_id: userId,
            service_rules: newRules,
            history_list: newHistory,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'user_id' });
      } catch (err) {
        console.error('Error saving state to Supabase:', err);
      }
    }
  };

  useEffect(() => {
    const rules = serviceRules.length > 0 ? serviceRules : defaultServices;
    const nextIndex = rules.findIndex((r: any) => !r.completed);
    const upcoming = nextIndex >= 0 ? rules[nextIndex] : null;
    setTargetService(upcoming);

    if (!upcoming) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setRemainingKmCount(0);
      return;
    }

    const targetKm = Number(upcoming.targetKm ?? upcoming.target_km ?? 0);
    const odo = Number(liveOdometer) || 0;
    const remainingKm = Math.max(0, targetKm - odo);
    setRemainingKmCount(remainingKm);
  }, [liveOdometer, serviceRules]);

  const handleAddNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) {
      alert('⚠️ দয়া করে সার্ভিসের নাম লিখুন!');
      return;
    }

    const newServiceItem = {
      id: 'custom_serv_' + Date.now(),
      title: newServiceTitle.trim(),
      targetKm: Number(newServiceKm) || 1000,
      targetDays: Number(newServiceDays) || 30,
      type: newServiceType,
      completed: false,
      date: null,
      odometer: null
    };

    const updatedRules = [...serviceRules, newServiceItem];
    setServiceRules(updatedRules);
    await saveStateToSupabase(updatedRules, completedHistoryList);

    setNewServiceTitle('');
    setNewServiceKm('');
    setNewServiceDays('');
    setShowAddServiceModal(false);
    alert('✅ নতুন সার্ভিস সফলভাবে যুক্ত করা হয়েছে!');
  };

  const handleConfirmCompleteService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceToComplete) return;
    setSubmitting(true);

    try {
      const formattedDateString = `${doneDay}-${doneMonth}-${doneYear}`;
      const doneOdo = Number(serviceDoneOdo) || liveOdometer;
      
      const historyItem = {
        id: 'hist_' + Date.now(),
        serviceId: selectedServiceToComplete.id,
        title: selectedServiceToComplete.title,
        date: formattedDateString,
        odometer: doneOdo,
        type: selectedServiceToComplete.type
      };

      const updatedHistory = [historyItem, ...completedHistoryList];
      setCompletedHistoryList(updatedHistory);

      const updatedRules = serviceRules.map((r: any) => 
        r.id === selectedServiceToComplete.id ? { ...r, completed: true, date: formattedDateString, odometer: doneOdo } : r
      );
      setServiceRules(updatedRules);

      await saveStateToSupabase(updatedRules, updatedHistory);

      alert(`✅ ${selectedServiceToComplete.title} সফলভাবে সংরক্ষিত হয়েছে!`);
      setSelectedServiceToComplete(null);
      if (typeof fetchLogs === 'function') fetchLogs();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverService = async (historyItem: any) => {
    const updatedHistory = completedHistoryList.filter((h: any) => h.id !== historyItem.id);
    setCompletedHistoryList(updatedHistory);

    const updatedRules = serviceRules.map((r: any) => 
      r.id === historyItem.serviceId || r.title === historyItem.title ? { ...r, completed: false, date: null, odometer: null } : r
    );
    setServiceRules(updatedRules);

    await saveStateToSupabase(updatedRules, updatedHistory);
    alert(`🔄 ${historyItem.title} রিকভার করা হয়েছে!`);
  };

  const formatDateToDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateString;
    }
    return dateString;
  };

  if (vehicleType !== 'fuel_bike') {
    return null;
  }

  if (loading) return <div className="text-xs text-slate-400 p-4">সার্ভিস শিডিউল লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes flash-red-green {
          0% { background-color: rgba(220, 38, 38, 0.4); border-color: #ef4444; }
          50% { background-color: rgba(16, 185, 129, 0.4); border-color: #10b981; }
          100% { background-color: rgba(220, 38, 38, 0.4); border-color: #ef4444; }
        }
        .flashing-service-banner {
          animation: flash-red-green 1.5s infinite ease-in-out;
        }
      `}</style>

      {serviceRules.length === 0 && (
        <div className="flashing-service-banner p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-lg">
          <div className="text-center sm:text-left">
            <h4 className="font-extrabold text-white text-sm">✨ নতুন বাইক রেজিস্ট্রেশন সম্পন্ন! আপনার ম্যানুয়াল মোতাবেক সার্ভিসসমূহ অ্যাড করুন।</h4>
            <p className="text-[11px] text-slate-200">এখানে ফ্রি ও পেইড সার্ভিস শিডিউল অ্যাড করার জন্য নিচের বাটনটিতে ক্লিক করুন।</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddServiceModal(true)}
            className="bg-white hover:bg-slate-100 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-xl cursor-pointer whitespace-nowrap"
          >
            ＋ সার্ভিসসমূহ অ্যাড করুন
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4 text-xs text-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sky-400 text-sm flex items-center gap-2">
              <span>🛠️</span> ফ্রি ও পেইড সার্ভিস ট্র্যাকিং প্যানেল
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              বর্তমান ওডোমিটার: <span className="text-amber-400 font-mono font-bold">{liveOdometer} KM</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddServiceModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <span>＋</span> নতুন সার্ভিস অ্যাড
            </button>
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold px-3 py-2 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <span>📜</span> হিস্ট্রি ({completedHistoryList.length})
            </button>
          </div>
        </div>

        {serviceRules.length === 0 ? (
          <div className="text-center py-8 space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800">
            <p className="text-slate-400">আপনার এই নতুন যানবাহনের জন্য কোনো সার্ভিস শিডিউল অ্যাড করা নেই।</p>
            <button
              type="button"
              onClick={() => setShowAddServiceModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer shadow"
            >
              ＋ আপনার ম্যানুয়াল মোতাবেক সার্ভিস অ্যাড করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {serviceRules.map((rule, idx) => (
              <div 
                key={rule.id || idx} 
                className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                  rule.completed 
                    ? 'bg-slate-950/60 border-slate-800 opacity-60 grayscale-[30%]' 
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rule.type === 'free' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rule.type === 'free' ? '🎁 ফ্রি সার্ভিস' : '💳 পেইড সার্ভিস'}
                    </span>
                    <h4 className="font-extrabold text-white text-sm mt-1.5">{rule.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/50">
                      টার্গেট: {Number(rule.targetKm ?? 0)} KM
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = serviceRules.filter((_, i) => i !== idx);
                        setServiceRules(updated);
                        await saveStateToSupabase(updated, completedHistoryList);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                  <span>নির্ধারিত দিন: <b>{Number(rule.targetDays ?? 30)} দিন</b></span>
                  
                  {rule.completed ? (
                    <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600 text-emerald-300 px-3 py-1 rounded-xl font-extrabold text-xs">
                      <span>✅</span> সম্পন্ন ({formatDateToDDMMYYYY(rule.date)})
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceToComplete(rule);
                        setServiceDoneOdo(liveOdometer.toString());
                      }}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow cursor-pointer"
                    >
                      ✓ সার্ভিস সম্পন্ন
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4 text-xs text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-emerald-400">＋ ম্যানুয়াল সার্ভিস শিডিউল যুক্ত করুন</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddNewService} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">সার্ভিসের নাম:</label>
                <input
                  type="text"
                  required
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="যেমন: ৪র্থ সার্ভিস / ব্যাটারি চেকআপ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">টার্গেট KM:</label>
                  <input
                    type="number"
                    required
                    value={newServiceKm}
                    onChange={(e) => setNewServiceKm(e.target.value)}
                    placeholder="যেমন: 12000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">টার্গেট দিন:</label>
                  <input
                    type="number"
                    required
                    value={newServiceDays}
                    onChange={(e) => setNewServiceDays(e.target.value)}
                    placeholder="যেমন: 365"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">সার্ভিসের ক্যাটাগরি:</label>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                >
                  <option value="free">🎁 ফ্রি সার্ভিস (Free Service)</option>
                  <option value="paid">💳 পেইড সার্ভিস (Paid Service)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                ✓ সার্ভিস শিডিউল সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 text-xs text-white max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-sky-400">📜 সম্পন্ন হওয়া সার্ভিস হিস্ট্রি</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              {completedHistoryList.length === 0 ? (
                <p className="text-slate-500 text-center py-6">এখনো কোনো সার্ভিস সম্পন্ন করা হয়নি।</p>
              ) : (
                completedHistoryList.map((hist: any, index: number) => (
                  <div key={hist.id || index} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-emerald-400">{hist.title}</h4>
                      <p className="text-[10px] text-slate-400">তারিখ: {formatDateToDDMMYYYY(hist.date)} | ওডোমিটার: {hist.odometer} KM</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRecoverService(hist)}
                      className="bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                    >
                      ↩️ রিকভার
                    </button>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setShowHistoryModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl">বন্ধ করুন</button>
          </div>
        </div>
      )}

      {selectedServiceToComplete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4 text-xs text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-sky-400">{selectedServiceToComplete.title} সম্পন্ন আপডেট</h3>
              <button onClick={() => setSelectedServiceToComplete(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleConfirmCompleteService} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">তারিখ নির্বাচন করুন:</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={doneDay} onChange={(e) => setDoneDay(e.target.value)} className="bg-slate-950 border border-sky-500 rounded-xl p-2 text-white font-bold text-center">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={doneMonth} onChange={(e) => setDoneMonth(e.target.value)} className="bg-slate-950 border border-sky-500 rounded-xl p-2 text-white font-bold text-center">
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={doneYear} onChange={(e) => setDoneYear(e.target.value)} className="bg-slate-950 border border-sky-500 rounded-xl p-2 text-white font-bold text-center">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">ওডোমিটার সংখ্যা (KM):</label>
                <input
                  type="number"
                  required
                  value={serviceDoneOdo}
                  onChange={(e) => setServiceDoneOdo(e.target.value)}
                  className="w-full bg-slate-950 border border-sky-500 rounded-xl p-2.5 text-white font-bold font-mono"
                />
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl">
                ✓ সার্ভিস সম্পন্ন হিসেবে সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}