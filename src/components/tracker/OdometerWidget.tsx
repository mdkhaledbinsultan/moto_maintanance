'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OdometerWidgetProps {
  currentOdometer?: number | string;
  onUpdateOdometer?: (val: number) => void;
  onAdminVerificationRequest?: (payload: any) => void;
  purchaseDate?: string;
}

export default function OdometerWidget({
  currentOdometer = 0,
  onUpdateOdometer,
  purchaseDate = '',
}: OdometerWidgetProps) {
  const [odometerVal, setOdometerVal] = useState<number>(() => {
    return Number(currentOdometer) || 0;
  });

  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [newInputKm, setNewInputKm] = useState<string>(String(odometerVal));

  useEffect(() => {
    if (currentOdometer !== undefined && currentOdometer !== null) {
      const num = Number(currentOdometer) || 0;
      setOdometerVal(num);
      setNewInputKm(String(num));
    } else {
      setOdometerVal(0);
      setNewInputKm('0');
    }
  }, [currentOdometer]);

  const calculateBikeAge = (dateStr: string): string => {
    if (!dateStr) return '০ দিন';
    try {
      const parts = dateStr.split('-');
      let pDate: Date;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          pDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          pDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      } else {
        return '০ দিন';
      }

      const today = new Date();
      let years = today.getFullYear() - pDate.getFullYear();
      let months = today.getMonth() - pDate.getMonth();
      let days = today.getDate() - pDate.getDate();

      if (days < 0) {
        months--;
        const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += prevMonthDays;
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      if (years <= 0 && months <= 0 && days <= 0) return '০ দিন';

      let result = '';
      if (years > 0) result += `${years} বছর `;
      if (months > 0 || years > 0) result += `${months} মাস `;
      result += `${days} দিন`;
      return result;
    } catch {
      return '০ দিন';
    }
  };

  const bikeAgeText = calculateBikeAge(purchaseDate);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newInputKm);

    if (isNaN(val) || val < 0) {
      alert('⚠️ সঠিক কিলোমিটার সংখ্যা লিখুন!');
      return;
    }

    // ওডোমিটার কমানো বা বাড়ানোর ওপর থেকে সকল বাধা বা বাধ্যবাধকতা তুলে দেওয়া হয়েছে
    setOdometerVal(val);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('bike_current_odo', String(val));
      window.dispatchEvent(new Event('bike_odometer_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, odometer: val }, { onConflict: 'id' });

        if (error) {
          console.error('Error updating odometer in Supabase:', JSON.stringify(error, null, 2));
        }
      }
    } catch (err) {
      console.error('Error updating odometer in Supabase catch:', err);
    }

    if (onUpdateOdometer) onUpdateOdometer(val);
    setShowUpdateModal(false);
    alert(`✅ ওডোমিটার সফলভাবে ${val} কিমি আপডেট করা হয়েছে এবং পার্টসের লাইফস্প্যানে সিঙ্ক হয়েছে!`);
  };

  return (
    <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl shadow-2xl text-xs text-slate-100 w-full max-w-sm space-y-3">
      {/* লাল, হলুদ ও সবুজ রঙের ফ্লাশিং অ্যানিমেশন স্টাইল */}
      <style jsx global>{`
        @keyframes odo-color-flash {
          0% { color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
          33% { color: #eab308; text-shadow: 0 0 15px rgba(234, 179, 8, 0.6); }
          66% { color: #22c55e; text-shadow: 0 0 15px rgba(34, 197, 94, 0.6); }
          100% { color: #ef4444; text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
        }
        .flashing-odo-number {
          animation: odo-color-flash 4s infinite ease-in-out;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <span className="font-extrabold text-slate-300 text-sm">বর্তমান ওডোমিটার</span>

        <div className="flex items-center gap-1.5">
          {/* শুধুমাত্র এডিট বা আপডেট বাটন রাখা হয়েছে, সংশোধন বাটন বাদ দেওয়া হয়েছে */}
          <button
            type="button"
            onClick={() => {
              setNewInputKm(String(odometerVal));
              setShowUpdateModal(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer shadow active:scale-95"
          >
            <span>✏️</span> আপডেট
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 pt-0.5">
        <span
          className="text-4xl md:text-5xl font-black flashing-odo-number tracking-wider"
          style={{ fontFamily: 'Arial Black, sans-serif' }}
        >
          {odometerVal}
        </span>
        <span className="text-sm font-extrabold text-slate-400">KM</span>
      </div>

      <div className="border-t border-slate-800/80 pt-2.5 flex justify-between items-center text-xs">
        <span className="text-slate-400 font-bold">বাইকের বয়স:</span>
        <span className="text-amber-400 font-extrabold tracking-wide">{bikeAgeText}</span>
      </div>

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-4 text-xs text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-sky-400">ওডোমিটার আপডেট করুন</h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="text-slate-400 block font-bold mb-1">নতুন ওডোমিটার রিডিং (KM) [কমানো বা বাড়ানো যাবে]:</label>
                <input
                  type="number"
                  value={newInputKm}
                  onChange={(e) => setNewInputKm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm"
                  style={{ fontFamily: 'Arial Black, sans-serif' }}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-bold cursor-pointer shadow-lg"
                >
                  ✓ সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}