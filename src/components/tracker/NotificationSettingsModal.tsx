'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationSettingsModal({ isOpen, onClose, user }: any) {
  const [settings, setSettings] = useState({
    engine_oil_alert: true,
    filter_check_alert: true,
    chain_lube_alert: true,
    service_reminder_alert: true,
    fuel_refill_alert: true,
    monthly_budget_alert: false,
    brta_document_alert: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setSettings({
            engine_oil_alert: data.engine_oil_alert,
            filter_check_alert: data.filter_check_alert,
            chain_lube_alert: data.chain_lube_alert,
            service_reminder_alert: data.service_reminder_alert,
            fuel_refill_alert: data.fuel_refill_alert,
            monthly_budget_alert: data.monthly_budget_alert,
            brta_document_alert: data.brta_document_alert,
          });
        }
      } catch (err) {
        console.error('Error fetching notification settings:', err);
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('user_notification_settings').upsert(
        [
          {
            user_id: user.id,
            ...settings,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      alert('✅ আপনার নোটিফিকেশন প্রেফারেন্স সফলভাবে সংরক্ষিত হয়েছে!');
      onClose();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-5 text-xs text-white max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
              <span>🔔</span> নোটিফিকেশন ও অ্যালার্ট সেটিংস
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              কোন কোন নোটিফিকেশনগুলো দেখতে চান তা নিজের পছন্দমতো সিলেক্ট করুন।
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            
            {/* পার্টস ও মেইনটেন্যান্স নোটিফিকেশন */}
            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">🛢️ ইঞ্জিন অয়েল পরিবর্তন অ্যালার্ট</span>
                <span className="text-[10px] text-slate-400">মেয়াদ বা কিলোমিটার শেষ হওয়ার সময় রিমাইন্ডার</span>
              </div>
              <input
                type="checkbox"
                checked={settings.engine_oil_alert}
                onChange={() => handleToggle('engine_oil_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">💨 এয়ার ও অয়েল ফিল্টার চেক</span>
                <span className="text-[10px] text-slate-400">ফিল্টার পরিবর্তনের সময় এলেই অ্যালার্ট</span>
              </div>
              <input
                type="checkbox"
                checked={settings.filter_check_alert}
                onChange={() => handleToggle('filter_check_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">⛓️ চেইন লুব রিমাইন্ডার</span>
                <span className="text-[10px] text-slate-400">প্রতি ৫০০ কিমি বা নির্দিষ্ট সময় পর পর নোটিফিকেশন</span>
              </div>
              <input
                type="checkbox"
                checked={settings.chain_lube_alert}
                onChange={() => handleToggle('chain_lube_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">🛠️ ফ্রি ও পেইড সার্ভিস রিমাইন্ডার</span>
                <span className="text-[10px] text-slate-400">আসন্ন সার্ভিসিংয়ের তারিখ বা কিমি কাছাকাছি আসলে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.service_reminder_alert}
                onChange={() => handleToggle('service_reminder_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* ফুয়েল ও বাজেট নোটিফিকেশন */}
            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">⛽ ফুয়েল রিফিল আপডেট</span>
                <span className="text-[10px] text-slate-400">ফুয়েল খরচ ও মাইলেজ হিস্ট্রি আপডেট রিমাইন্ডার</span>
              </div>
              <input
                type="checkbox"
                checked={settings.fuel_refill_alert}
                onChange={() => handleToggle('fuel_refill_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-900">
              <div>
                <span className="font-bold text-white block">💰 মাসিক খরচ বাজেট অ্যালার্ট</span>
                <span className="text-[10px] text-slate-400">বাজেট লিমিট ক্রস করলে সতর্কবার্তা</span>
              </div>
              <input
                type="checkbox"
                checked={settings.monthly_budget_alert}
                onChange={() => handleToggle('monthly_budget_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {/* বিআরটিএ ডকুমেন্ট */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-bold text-white block">🚗 বিআরটিএ ও পেপার্স মেয়াদ রিমাইন্ডার</span>
                <span className="text-[10px] text-slate-400">ফিটনেস, ট্যাক্স টোকেন বা ইন্স্যুরেন্সের মেয়াদ শেষ হওয়ার আগে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.brta_document_alert}
                onChange={() => handleToggle('brta_document_alert')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-slate-300 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-white shadow-lg cursor-pointer"
            >
              {loading ? 'সংরক্ষণ হচ্ছে...' : '✓ সেটিংস সেভ করুন'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}