'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: any) {
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const formatVehicleName = (type: string) => {
    if (type === 'motorcycle') return 'Motorcycle / Bike';
    if (type === 'ebike') return 'Electric Bike';
    if (type === 'other') return 'Other Vehicles';
    return type;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('⚠️ পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড এক হয়নি!');
      return;
    }
    if (password.length < 6) {
      alert('⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // সফল রেজিস্ট্রেশনের পর অ্যাডমিন প্যানেলে সিঙ্ক করার জন্য ডাটা সংরক্ষণ
      const newUser = {
        name: email.split('@')[0],
        email: email,
        phone: 'N/A',
        isNameVerified: false,
        odometer: 0
      };

      const existingUsers = JSON.parse(localStorage.getItem('bike_app_users_list') || '[]');
      const isExist = existingUsers.find((u: any) => u.email === newUser.email);
      if (!isExist) {
        existingUsers.push(newUser);
        localStorage.setItem('bike_app_users_list', JSON.stringify(existingUsers));
      }
      localStorage.setItem('bike_app_user', JSON.stringify(newUser));

      alert('✅ সফলভাবে নতুন অ্যাকাউন্ট তৈরি হয়েছে!');
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert('রেজিস্ট্রেশন ত্রুটি: ' + err.message);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { redirectTo: window.location.origin } 
      });
      if (error) throw error;
    } catch (err: any) {
      alert('গুগল অথেনটিকেশন ত্রুটি: ' + err.message);
    }
  };

  const handleFacebookAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'facebook', 
        options: { redirectTo: window.location.origin } 
      });
      if (error) throw error;
    } catch (err: any) {
      alert('ফেসবুক অথেনটিকেশন ত্রুটি: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-3xl text-white relative shadow-2xl">
        <h2 className="text-xl font-black mb-4 text-center text-emerald-400 tracking-wide">📝 রেজিস্ট্রেশন পোর্টাল</h2>

        {step === 1 ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-300 text-center font-bold mb-3 tracking-wide">প্রথমে আপনার গাড়ির ক্যাটাগরি সিলেক্ট করুন:</p>
            <button 
              onClick={() => { setVehicleType('motorcycle'); setStep(2); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-sky-500 p-3.5 rounded-2xl text-left transition font-bold flex items-center gap-3.5 group shadow-md"
            >
              <span className="text-xl p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">🏍️</span>
              <div>
                <span className="text-sm font-extrabold text-white block">Motorcycle / Bike</span>
                <span className="text-xs text-slate-400 font-normal">স্ট্যান্ডার্ড মোটরসাইকেল ও বাইক ট্র্যাকিং</span>
              </div>
            </button>
            <button 
              onClick={() => { setVehicleType('ebike'); setStep(2); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500 p-3.5 rounded-2xl text-left transition font-bold flex items-center gap-3.5 group shadow-md"
            >
              <span className="text-xl p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">⚡</span>
              <div>
                <span className="text-sm font-extrabold text-white block">Electric Bike</span>
                <span className="text-xs text-slate-400 font-normal">স্মার্ট ই-বাইক ও ব্যাটারি ম্যানেজমেন্ট</span>
              </div>
            </button>
            <button 
              onClick={() => { setVehicleType('other'); setStep(2); }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-blue-500 p-3.5 rounded-2xl text-left transition font-bold flex items-center gap-3.5 group shadow-md"
            >
              <span className="text-xl p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">🚗</span>
              <div>
                <span className="text-sm font-extrabold text-white block">Other Vehicles</span>
                <span className="text-xs text-slate-400 font-normal">অন্যান্য যানবাহন ও ফ্লিট হিসাব</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center shadow-inner">
              <span className="text-sky-300 font-extrabold tracking-wide text-xs">নির্বাচিত ক্যাটাগরি: {formatVehicleName(vehicleType)}</span>
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white underline font-bold text-xs">পরিবর্তন</button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 py-2.5 px-4 rounded-xl font-extrabold transition shadow flex items-center justify-center gap-2.5 text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.16 21.3 7.22 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.15 0 9.89 0 12s.43 3.85 1.18 5.38l4.09-3.14z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.16 2.7 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                <span>Google দিয়ে এক ক্লিকে রেজিস্টার</span>
              </button>
              
              <button 
                onClick={handleFacebookAuth}
                className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 px-4 rounded-xl font-extrabold transition shadow flex items-center justify-center gap-2.5 text-xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook দিয়ে এক ক্লিকে রেজিস্টার</span>
              </button>
            </div>

            <div className="flex items-center my-3">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-300 font-bold uppercase tracking-wider">অথবা ইমেল দিয়ে</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-bold text-xs">ইমেল এড্রেস</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="example@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm tracking-wide focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold text-xs">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm tracking-wide focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold text-xs">পুনরায় পাসওয়ার্ড দিন</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="পুনরায় পাসওয়ার্ড দিন"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm tracking-wide focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-extrabold shadow-lg shadow-emerald-600/20 transition tracking-wide text-xs mt-1">
                ✓ সাইন আপ সম্পন্ন করুন
              </button>
            </form>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-400 font-medium">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <button onClick={onSwitchToLogin} className="text-sky-400 hover:underline font-extrabold text-xs">
            লগইন করুন
          </button>
        </p>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm">✕</button>
      </div>
    </div>
  );
}