'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSwitchToForgotPassword }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(60);

  useEffect(() => {
    const lockExpiry = localStorage.getItem('login_lock_expiry');
    if (lockExpiry) {
      const remainingTime = Math.ceil((Number(lockExpiry) - Date.now()) / 1000);
      if (remainingTime > 0) {
        setIsLocked(true);
        setLockoutTimer(remainingTime);
      } else {
        localStorage.removeItem('login_lock_expiry');
      }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLocked && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('login_lock_expiry');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('⚠️ এই ইমেইলে কোনো পাসওয়ার্ড অ্যাকাউন্ট নেই বা তথ্য ভুল। আপনি যদি গুগল বা ফেসবুক দিয়ে রেজিস্ট্রেশন করে থাকেন, তবে উপরের এক-ক্লিক সোশ্যাল বাটন দিয়ে সাইন ইন করুন।');
        }
        
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTimer(60);
          const expiryTime = Date.now() + 60 * 1000;
          localStorage.setItem('login_lock_expiry', expiryTime.toString());
        }
        
        throw error;
      }

      // 🚀 সফল লগইনের পর সুপাবেস profiles টেবিলে ডাটা সিঙ্ক করার লজিক (যাতে অ্যাডমিন প্যানেলে শো করে)
      if (data.user) {
        const userObj = data.user;
        const realName = userObj.user_metadata?.full_name || userObj.user_metadata?.name || email.split('@')[0];
        
        await supabase.from('profiles').upsert([
          {
            id: userObj.id,
            email: userObj.email,
            name: realName,
            phone: userObj.phone || 'N/A',
            verification_status: 'pending',
            is_google_linked: false,
            is_facebook_linked: false,
            created_at: new Date().toISOString()
          }
        ], { onConflict: 'email' });
      }

      setLoginAttempts(0);
      localStorage.removeItem('login_lock_expiry');
      alert('✅ সফলভাবে সাইন ইন সম্পন্ন হয়েছে!');
      onClose();
      window.location.reload();
    } catch (err: any) {
      if (!isLocked) {
        alert(err.message || 'লগইন ত্রুটি: সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
      }
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
        <h2 className="text-xl font-black mb-4 text-center text-sky-400 tracking-wide">🔐 সাইন ইন পোর্টাল</h2>

        <div className="space-y-3 text-sm">
          {loginAttempts > 0 && !isLocked && (
            <div className="bg-amber-950/60 border border-amber-800 p-2.5 rounded-xl text-center text-amber-300 text-xs font-bold animate-pulse">
              ⚠️ ভুল পাসওয়ার্ড দেওয়া হয়েছে! মোট ৫ বার ভুল হলে অ্যাকাউন্ট ১ মিনিটের জন্য ব্লক হবে (বর্তমান ভুল: {loginAttempts}/5)।
            </div>
          )}

          <div className="space-y-2">
            <button 
              type="button"
              onClick={handleGoogleAuth}
              className="w-full bg-white hover:bg-slate-100 text-slate-950 py-2.5 px-4 rounded-xl font-extrabold transition shadow flex items-center justify-center gap-2.5 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.16 21.3 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.15 0 9.89 0 12s.43 3.85 1.18 5.38l4.09-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.16 2.7 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              <span>Google দিয়ে এক ক্লিকে সাইন ইন</span>
            </button>
            
            <button 
              type="button"
              onClick={handleFacebookAuth}
              className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 px-4 rounded-xl font-extrabold transition shadow flex items-center justify-center gap-2.5 text-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook দিয়ে এক ক্লিকে সাইন ইন</span>
            </button>
          </div>

          <div className="flex items-center my-3">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-xs text-slate-300 font-bold uppercase tracking-wider">অথবা ইমেল দিয়ে</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-slate-300 mb-1 font-bold text-xs">ইমেল এড্রেস</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@gmail.com"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm tracking-wide focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-300 font-bold text-xs">পাসওয়ার্ড</label>
                <button 
                  type="button" 
                  onClick={onSwitchToForgotPassword}
                  className="text-sky-400 hover:underline text-[11px] font-bold"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="আপনার পাসওয়ার্ড দিন"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm tracking-wide focus:outline-none focus:border-sky-500"
              />
            </div>

            {isLocked && (
              <div className="bg-red-950/60 border border-red-800 p-2.5 rounded-xl text-center text-red-300 text-xs font-bold">
                ⚠️ অতিরিক্ত ভুল চেষ্টার কারণে ১ মিনিটের জন্য লক করা হয়েছে! {lockoutTimer} সেকেন্ড পর আবার চেষ্টা করুন।
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLocked}
              className={`w-full py-3 rounded-xl font-extrabold shadow-lg transition tracking-wide text-xs mt-1 ${
                isLocked 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
              }`}
            >
              {isLocked ? `লকড (${lockoutTimer}s)` : '✓ সাইন ইন সম্পন্ন করুন'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400 font-medium">
          কোনো অ্যাকাউন্ট নেই?{' '}
          <button onClick={onSwitchToRegister} className="text-emerald-400 hover:underline font-extrabold text-xs">
            রেজিস্ট্রেশন করুন
          </button>
        </p>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm">✕</button>
      </div>
    </div>
  );
}