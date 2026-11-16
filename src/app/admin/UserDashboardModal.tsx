'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserDashboardModal({ viewingUserProfile, setViewingUserProfile }: { viewingUserProfile: any; setViewingUserProfile: any }) {
  const [userName, setUserName] = useState('');
  const [userOdometer, setUserOdometer] = useState(0);
  const [expenseList, setExpenseList] = useState<any[]>([]);
  const [savingsList, setSavingsList] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    if (viewingUserProfile) {
      const currentRealName = viewingUserProfile.name || viewingUserProfile.user_metadata?.full_name || viewingUserProfile.user_metadata?.name || viewingUserProfile.email?.split('@')[0] || '';
      setUserName(currentRealName);
      setUserOdometer(viewingUserProfile.odometer || 0);

      const fetchUserDetailsFromSupabase = async () => {
        try {
          const userId = viewingUserProfile.id;
          if (!userId) return;

          // খরচের এন্ট্রি ফেচ
          const { data: expData } = await supabase
            .from('user_expense_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (expData) {
            setExpenseList(expData);
            setTotalCost(expData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
          }

          // সাশ্রয়ের এন্ট্রি ফেচ
          const { data: savData } = await supabase
            .from('user_savings_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (savData) {
            setSavingsList(savData);
            setTotalSavings(savData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
          }

          // বাইক ও পার্টস কনফিগারেশন ফেচ
          const { data: configData } = await supabase
            .from('user_bike_manual_configurations')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (configData && configData.parts_list) {
            setPartsList(configData.parts_list);
          } else {
            setPartsList(viewingUserProfile.partsList || []);
          }
        } catch (err) {
          console.error('Error fetching user detail data:', err);
        }
      };

      fetchUserDetailsFromSupabase();
    }
  }, [viewingUserProfile]);

  if (!viewingUserProfile) return null;

  const handleSaveChanges = async () => {
    try {
      const userId = viewingUserProfile.id;
      const { error } = await supabase
        .from('profiles')
        .update({ name: userName, odometer: Number(userOdometer) })
        .eq('id', userId);

      if (error) throw error;

      alert('✅ ইউজারের তথ্য সফলভাবে ডাটাবেজে আপডেট করা হয়েছে!');
      setViewingUserProfile(null);
      window.location.reload();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl p-6 rounded-3xl shadow-2xl space-y-5 text-xs text-white max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-sky-400 flex items-center gap-2">
            <span>👤</span> গ্রাহকের ড্যাশবোর্ড ওভারভিউ ও এডিট প্যানেল
          </h3>
          <button onClick={() => setViewingUserProfile(null)} className="text-slate-400 hover:text-white text-base cursor-pointer">✕</button>
        </div>

        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-bold">গ্রাহকের নাম (এডিটেবল):</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-bold">ওডোমিটার (KM - এডিটেবল):</label>
              <input
                type="number"
                value={userOdometer}
                onChange={(e) => setUserOdometer(Number(e.target.value))}
                className="w-full bg-slate-900 border border-sky-600 rounded-xl p-2.5 text-sky-400 font-bold font-mono text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow"
            >
              💾 পরিবর্তনগুলো সেভ করুন
            </button>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-900">
            <b>ইমেইল:</b> {viewingUserProfile.email} | <b>মোবাইল:</b> {viewingUserProfile.phone || 'নেই'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-4 rounded-2xl border border-rose-900/40 text-center space-y-1">
            <span className="text-slate-400 text-[11px] block">এ পর্যন্ত মোট খরচ</span>
            <span className="text-rose-400 text-lg font-black font-mono">৳{totalCost}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/40 text-center space-y-1">
            <span className="text-slate-400 text-[11px] block">সর্বমোট সাশ্রয়</span>
            <span className="text-emerald-400 text-lg font-black font-mono">৳{totalSavings}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-rose-400 border-b border-slate-800 pb-1.5">💸 খরচের এন্ট্রিগুলো</h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {expenseList.length === 0 ? (
                <p className="text-slate-500 text-center py-2">কোনো খরচ এন্ট্রি নেই।</p>
              ) : (
                expenseList.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-2 rounded-xl text-[11px]">
                    <div>
                      <span className="text-slate-300 font-bold">{item.category || item.title}</span>
                      <span className="text-[10px] text-slate-500 block">{item.date}</span>
                    </div>
                    <span className="text-rose-400 font-mono font-bold">-৳{item.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 border-b border-slate-800 pb-1.5">💰 সাশ্রয়ের এন্ট্রিগুলো</h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {savingsList.length === 0 ? (
                <p className="text-slate-500 text-center py-2">কোনো সাশ্রয় এন্ট্রি নেই।</p>
              ) : (
                savingsList.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-2 rounded-xl text-[11px]">
                    <div>
                      <span className="text-slate-300 font-bold">{item.title || item.note || 'সাশ্রয়'}</span>
                      <span className="text-[10px] text-slate-500 block">{item.date}</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">+৳{item.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="font-bold text-purple-400 border-b border-slate-800 pb-1.5">⚙️ সকল পার্টসের স্থায়িত্ব লাইফস্প্যান</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {partsList.length === 0 ? (
              <p className="text-slate-500 text-center py-2">কোনো পার্টস রুলস পাওয়া যায়নি।</p>
            ) : (
              partsList.map((part: any, i: number) => (
                <div key={i} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white flex items-center gap-2 text-xs">
                      <span className="text-base">{part.icon || '🔧'}</span> {part.name || part.names?.bn || part.id}
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                      টার্গেট: {part.km || part.activeLifespan || 2500} KM
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={() => setViewingUserProfile(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">বন্ধ করুন</button>
      </div>
    </div>
  );
}