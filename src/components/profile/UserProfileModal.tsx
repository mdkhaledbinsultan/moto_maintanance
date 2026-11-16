'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserProfileModal({ isOpen, onClose, user, onProfileComplete }: any) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  
  const [isProfileAlreadyCompleted, setIsProfileAlreadyCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 🚀 এডিট মোড টগল করার স্টেট

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserAuthState = async () => {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        setEmail(sbUser.email || '');
        setName(sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || '');
        
        const identities = sbUser.identities || [];
        const hasGoogle = identities.some((id: any) => id.provider === 'google');
        const hasFacebook = identities.some((id: any) => id.provider === 'facebook');

        setIsGoogleLinked(hasGoogle);
        setIsFacebookLinked(hasFacebook);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .single();

        if (profile) {
          if (profile.phone) setPhone(profile.phone);
          if (profile.name) setName(profile.name);
          if (profile.profile_completed || (profile.phone && profile.phone !== 'N/A')) {
            setIsProfileAlreadyCompleted(true);
          }
        }
      }
    };
    if (isOpen) {
      checkUserAuthState();
      setIsEditing(false); // মডাল ওপেন হলে ডিফল্টভাবে ভিউ মোডে থাকবে
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🚀 প্রোফাইল তথ্য বা পাসওয়ার্ড আপডেট করার ফাংশন
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) {
      alert('⚠️ নাম এবং মোবাইল নম্বর বাধ্যতামূলক!');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      alert('⚠️ নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert('❌ পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি!');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        // পাসওয়ার্ড পরিবর্তনের ইনপুট দেওয়া থাকলে সেটি আপডেট করা
        if (newPassword) {
          const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
          if (passError) throw passError;
        }

        // ইউজার মেটাডাটা ও প্রোফাইল টেবিল আপডেট
        await supabase.auth.updateUser({ data: { mobile: phone, full_name: name } });
        
        const { error } = await supabase.from('profiles').upsert([
          { 
            id: sbUser.id, 
            email: sbUser.email, 
            name: name, 
            phone: phone, 
            profile_completed: true, 
            updated_at: new Date().toISOString() 
          }
        ], { onConflict: 'id' });

        if (error) throw error;
      }

      alert('✅ আপনার প্রোফাইল তথ্য এবং পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!');
      setIsProfileAlreadyCompleted(true);
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileComplete) onProfileComplete(true);
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // গুগল অ্যাকাউন্ট লিংক করা
  const handleLinkGoogle = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({ 
        provider: 'google', 
        options: { redirectTo: window.location.origin } 
      });
      if (error) throw error;
    } catch (err: any) {
      alert('গুগল ইন্টিগ্রেশন ত্রুটি: ' + err.message);
    }
  };

  // ফেসবুক অ্যাকাউন্ট লিংক করা
  const handleLinkFacebook = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({ 
        provider: 'facebook', 
        options: { redirectTo: window.location.origin } 
      });
      if (error) throw error;
    } catch (err: any) {
      alert('ফেসবুক ইন্টিগ্রেশন ত্রুটি: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-3xl text-white relative shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-sm font-extrabold text-sky-400">
            {isEditing ? '✏️ প্রোফাইল ও পাসওয়ার্ড পরিবর্তন' : '👤 ইউজার প্রোফাইল ও অ্যাকাউন্ট ম্যানেজমেন্ট'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
        </div>

        {/* যদি প্রোফাইল ইতিমধ্যে সম্পূর্ণ থাকে এবং এডিট মোডে না থাকে, তবে ডিটেইলস দেখাবে */}
        {isProfileAlreadyCompleted && !isEditing ? (
          <div className="space-y-4 py-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">নাম:</span>
                <span className="text-white font-bold text-sm">{name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">ইমেল:</span>
                <span className="text-sky-300">{email}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">মোবাইল নম্বর:</span>
                <span className="text-emerald-400">{phone || 'সংযুক্ত নয়'}</span>
              </div>
            </div>

            {/* সোশ্যাল ইন্টিগ্রেশন স্ট্যাটাস */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="font-bold text-slate-300 block mb-2">সংযুক্ত সোশ্যাল অ্যাকাউন্টস:</span>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span>🌐 গুগল অ্যাকাউন্ট</span>
                {isGoogleLinked ? (
                  <span className="text-emerald-400 font-bold text-[11px]">সংযুক্ত (✓)</span>
                ) : (
                  <button type="button" onClick={handleLinkGoogle} className="bg-white text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer">
                    লিংক করুন
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span>👥 ফেসবুক অ্যাকাউন্ট</span>
                {isFacebookLinked ? (
                  <span className="text-emerald-400 font-bold text-[11px]">সংযুক্ত (✓)</span>
                ) : (
                  <button type="button" onClick={handleLinkFacebook} className="bg-[#1877F2] text-white px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer">
                    লিংক করুন
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="w-1/2 bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-bold text-white cursor-pointer shadow"
              >
                ✏️ এডিট / পরিবর্তন করুন
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-white cursor-pointer"
              >
                বন্ধ করুন ✕
              </button>
            </div>
          </div>
        ) : (
          /* প্রথমবার বা এডিট মোডে থাকলে ফর্ম দেখাবে */
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <p className="text-slate-400 text-[11px]">আপনার নাম, মোবাইল নম্বর অথবা পাসওয়ার্ড পরিবর্তন করতে চাইলে নিচের ঘরগুলোতে সঠিক তথ্য দিয়ে সেভ করুন।</p>
            
            <div>
              <label className="block text-slate-300 mb-1 font-bold">আপনার নাম</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="আপনার নাম লিখুন" 
                required 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold text-sm" 
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="017XXXXXXXX" 
                required 
                className="w-full bg-slate-950 border border-sky-500 rounded-xl p-3 text-white font-bold font-mono text-sm" 
              />
            </div>

            <div className="border-t border-slate-800 pt-2 space-y-3">
              <span className="font-bold text-amber-400 block">পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক):</span>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">নতুন পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="পরিবর্তন করতে চাইলে কমপক্ষে ৬ অক্ষর দিন" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" 
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">কনফার্ম নতুন পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="পুনরায় নতুন পাসওয়ার্ড দিন" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" 
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {isProfileAlreadyCompleted && (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading} 
                className={`${isProfileAlreadyCompleted ? 'w-1/2' : 'w-full'} bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold shadow-lg transition cursor-pointer text-white`}
              >
                {loading ? 'সংরক্ষণ হচ্ছে...' : '✓ পরিবর্তন সেভ করুন'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}