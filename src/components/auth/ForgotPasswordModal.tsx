'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordModal({ isOpen, onClose }: any) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email) {
      alert('দয়া করে আপনার নিবন্ধিত ইমেল এড্রেস দিন।');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false }
      });

      if (error) throw error;

      alert('✅ আপনার ইমেলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে।');
      setOtpSent(true);
    } catch (err: any) {
      alert('ত্রুটি: ' + (err.message || 'ওটিপি পাঠানো যায়নি।'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!otp || !newPass || !confirmPass) {
      alert('দয়া করে ওটিপি এবং পাসওয়ার্ডের উভয় ঘর পূরণ করুন।');
      return;
    }

    if (newPass !== confirmPass) {
      alert('❌ পাসওয়ার্ড দুটি মেলেনি!');
      return;
    }

    if (newPass.length < 6) {
      alert('⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) throw updateError;

      alert('✅ সফলভাবে আপনার পাসওয়ার্ড পরিবর্তন করা হয়েছে!');
      onClose();
    } catch (err: any) {
      alert('ভেরিফিকেশন ত্রুটি: ' + (err.message || 'কোডটি সঠিক নয়।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-3xl text-white relative shadow-2xl text-xs space-y-4">
        <h2 className="text-base font-extrabold text-center text-sky-400">🔑 পাসওয়ার্ড রিকভারি (শুধুমাত্র ইমেল)</h2>

        {!otpSent ? (
          <div className="space-y-3">
            <label className="block text-slate-400 font-bold">আপনার নিবন্ধিত ইমেল এড্রেস দিন:</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
            />
            <button onClick={handleSendOtp} disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-bold shadow-lg cursor-pointer">
              {loading ? 'প্রসেসিং...' : 'ওটিপি পাঠান'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-emerald-400 text-center font-bold">ইমেলে প্রাপ্ত ওটিপি ও নতুন পাসওয়ার্ড দিন:</p>
            <div>
              <label className="block text-slate-400 font-bold mb-1">ওটিপি কোড</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="৬ ডিজিটের ওটিপি"
                className="w-full bg-slate-950 border border-emerald-500 rounded-xl p-3 text-white font-mono text-center tracking-widest font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">নতুন পাসওয়ার্ড</label>
              <input 
                type="password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">কনফার্ম পাসওয়ার্ড</label>
              <input 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="পুনরায় পাসওয়ার্ড দিন"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold"
              />
            </div>
            <button onClick={handleVerifyAndReset} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold shadow-lg cursor-pointer">
              {loading ? 'যাচাই হচ্ছে...' : '✓ পাসওয়ার্ড রিসেট করুন'}
            </button>
          </div>
        )}

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
      </div>
    </div>
  );
}