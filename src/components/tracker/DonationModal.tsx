'use client';
import { useState } from 'react';

export default function DonationModal({ isOpen, onClose }: { isOpen: boolean; onClose: any }) {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  // বিকাশ, নগদ ও রকেট নম্বর (নির্দিষ্ট ফরম্যাটে হাইড বা সুরক্ষিত রাখা হয়েছে)
  const paymentMethods = [
    {
      name: 'বিকাশ (Bkash)',
      type: 'Personal',
      number: '01738771171', 
      color: 'from-pink-600 to-rose-600',
      borderColor: 'border-pink-500/40',
      textColor: 'text-pink-400',
    },
    {
      name: 'নগদ (Nagad)',
      type: 'Personal',
      number: '01738771171', 
      color: 'from-orange-600 to-amber-600',
      borderColor: 'border-orange-500/40',
      textColor: 'text-orange-400',
    },
    {
      name: 'রকেট (Rocket)',
      type: 'Personal',
      number: '017387711714', 
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-400',
    },
  ];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-3xl text-white relative shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
        
        {/* হেডার */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-cyan-400 flex items-center gap-2">
              <span>💖</span> ডেভেলপারকে অনুদান বা সাপোর্ট দিন
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              অ্যাপটি আপনার উপকারে আসলে স্বেচ্ছায় সহযোগিতা করতে পারেন।
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-base font-bold cursor-pointer p-1 rounded-lg bg-slate-800/80"
          >
            ✕
          </button>
        </div>

        {/* বিশেষ বার্তা (সাদকায়ে জারিয়া) */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 p-4 rounded-2xl border border-emerald-500/40 space-y-2 text-slate-200 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <span>✨</span>
            <span>আমাদের বিশেষ প্রতিশ্রুতি (সাদকায়ে জারিয়া):</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            এই অ্যাপে কোনো ধরনের বিজ্ঞাপন (Ads) কিংবা প্রিমিয়াম কোনো প্যাকেজ নেই। সবকিছুই আপনাদের জন্য সম্পূর্ণ ফ্রি করে দেওয়া হয়েছে। অ্যাপটি থেকে সামান্য উপকৃত হলে আপনারা ডেভেলপারকে সহযোগিতার হাত বাড়িয়ে দিতে পারেন। 
          </p>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30 text-[11px] text-amber-300 font-bold text-center">
            🤲 আপনার পাঠানো অনুদানের <span className="text-emerald-400 text-xs">২০%</span> গরীব-দুঃখী ও মসজিদের নির্মাণ/কল্যাণ তহবিলে দান করা হবে ইনশাআল্লাহ।
          </div>
        </div>

        {/* পেমেন্ট মেথড কার্ডগুলো */}
        <div className="space-y-3">
          {paymentMethods.map((method, idx) => (
            <div 
              key={idx} 
              className={`bg-slate-950 p-4 rounded-2xl border ${method.borderColor} space-y-2.5 shadow-lg`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-extrabold text-sm ${method.textColor}`}>{method.name}</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                  {method.type}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="font-mono font-black text-white text-sm tracking-widest">
                  {method.number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(method.number)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer shadow"
                >
                  {copiedNumber === method.number ? '✓ কপি হয়েছে!' : 'নম্বর কপি'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={onClose} 
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
        >
          বন্ধ করুন
        </button>

      </div>
    </div>
  );
}