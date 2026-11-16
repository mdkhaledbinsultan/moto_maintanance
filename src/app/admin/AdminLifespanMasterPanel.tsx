'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const BD_BRTA_BRANDS = ['Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Hero', 'Kawasaki', 'KTM', 'Royal Enfield'];
const INITIAL_CC_LIST = ['80cc', '100cc', '110cc', '125cc', '135cc', '150cc', '155cc', '160cc', '200cc', '250cc', '300cc', '350cc'];

const ENGINE_OIL_CATEGORIES = [
  { id: 'mineral', name: 'মিনারেল (Mineral)', defaultKm: 1200 },
  { id: 'semi', name: 'সেমি-সিন্থেটিক (Semi-Synthetic)', defaultKm: 1500 },
  { id: 'full', name: 'সিন্থেটিক (Fully Synthetic)', defaultKm: 2500 },
  { id: 'rs4gp', name: 'RS4GP / Premium (Racing)', defaultKm: 3000 },
];

export default function AdminLifespanMasterPanel() {
  const [assignType, setAssignType] = useState<'common' | 'cc_wise' | 'model_specific'>('common');
  const [brands, setBrands] = useState<string[]>(BD_BRTA_BRANDS);
  const [ccList, setCcList] = useState<string[]>(INITIAL_CC_LIST);
  
  const [lifespanBrand, setLifespanBrand] = useState(brands[0]);
  const [lifespanCc, setLifespanCc] = useState('155cc');
  const [lifespanSelectedModel, setLifespanSelectedModel] = useState('');
  const [masterBikeModels, setMasterBikeModels] = useState<any[]>([]);

  const [partsRules, setPartsRules] = useState<any[]>([
    { id: 'engine_oil', name: 'ইঞ্জিন অয়েল', km: 2500, days: 90, icon: '🛢️' },
    { id: 'oil_filter', name: 'অয়েল ফিল্টার', km: 2500, days: 90, icon: '⚙️' },
    { id: 'air_filter', name: 'এয়ার ফিল্টার', km: 9000, days: 180, icon: '💨' },
    { id: 'chain_lube', name: 'চেইন লুব', km: 500, days: 30, icon: '⛓️' }
  ]);

  const [newPartName, setNewPartName] = useState('');
  const [newPartKm, setNewPartKm] = useState<number | ''>('');
  const [newPartDays, setNewPartDays] = useState<number | ''>(365);

  useEffect(() => {
    const fetchMasterModels = async () => {
      try {
        const { data } = await supabase.from('admin_bike_models_master').select('*');
        if (data && data.length > 0) {
          setMasterBikeModels(data);
          const uniqueBrands = Array.from(new Set([...BD_BRTA_BRANDS, ...data.map((i: any) => i.brand)]));
          const uniqueCc = Array.from(new Set([...INITIAL_CC_LIST, ...data.map((i: any) => i.cc)]));
          setBrands(uniqueBrands as string[]);
          setCcList(uniqueCc as string[]);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    };
    fetchMasterModels();
  }, []);

  const handlePartChange = (index: number, field: string, value: any) => {
    const updated = [...partsRules];
    updated[index][field] = value;
    setPartsRules(updated);
  };

  const handleOilCategorySelect = (index: number, catId: string) => {
    const matched = ENGINE_OIL_CATEGORIES.find(c => c.id === catId);
    if (matched) {
      const updated = [...partsRules];
      updated[index].km = matched.defaultKm;
      setPartsRules(updated);
    }
  };

  const handleAddCustomPart = () => {
    if (!newPartName.trim()) {
      alert('⚠️ দয়া করে পার্টসের নাম লিখুন।');
      return;
    }
    const customPart = {
      id: newPartName.toLowerCase().replace(/\s+/g, '_'),
      name: newPartName,
      km: newPartKm === '' ? 0 : Number(newPartKm),
      days: newPartDays === '' ? 0 : Number(newPartDays),
      icon: '🔧'
    };
    setPartsRules([...partsRules, customPart]);
    setNewPartName('');
    setNewPartKm('');
    setNewPartDays(365);
  };

  const handleSaveLifespanTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // অ্যালগরিদম অনুযায়ী টেমপ্লেট আইডি নির্ধারণ
    let templateId = 'common_parts_all_bikes';
    if (assignType === 'cc_wise') {
      templateId = `cc_wise_${lifespanCc}`.toLowerCase();
    } else if (assignType === 'model_specific') {
      templateId = `${lifespanBrand}_${lifespanCc}${lifespanSelectedModel ? '_' + lifespanSelectedModel : ''}`.toLowerCase();
    }
    
    try {
      const { error } = await supabase
        .from('admin_lifespan_rules')
        .upsert([
          {
            template_id: templateId,
            assign_type: assignType, // common, cc_wise, model_specific
            brand: assignType === 'model_specific' ? lifespanBrand : null,
            cc: assignType !== 'common' ? lifespanCc : null,
            optional_model: assignType === 'model_specific' ? (lifespanSelectedModel || null) : null,
            parts_rules: partsRules,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'template_id' });

      if (error) throw error;

      alert(`✅ সফলভাবে (${assignType.toUpperCase()}) ক্যাটাগরির পার্টস স্থায়িত্ব সুপাবেসে সেভ করা হয়েছে এবং কাস্টমার প্যানেলের ম্যানুয়াল কনফিগারেশনের সাথে সিঙ্ক হয়ে গেছে!`);
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 text-xs text-slate-100">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
          <span>🔧</span> ২. পার্টস অনুযায়ী স্থায়িত্ব ও লাইফস্প্যান মাস্টার কনফিগারেশন প্যানেল
        </h3>
        <p className="text-[11px] text-slate-400">কমন, সিসি-ওয়াইজ কিংবা ব্র্যান্ড-মডেল স্পেশাল—এই ৩ ভাগে পার্টস সেট করুন যা ইউজারের ম্যানুয়াল কনফিগারেশনে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।</p>
      </div>

      <form onSubmit={handleSaveLifespanTemplate} className="space-y-5">
        
        {/* ৩ টি ক্যাটাগরি সিলেকশন ট্যাব */}
        <div className="space-y-2">
          <label className="text-slate-300 font-bold block">কনফিগারেশন ক্যাটাগরি নির্বাচন করুন:</label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAssignType('common')}
              className={`py-2 rounded-xl font-bold transition cursor-pointer ${assignType === 'common' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🌐 সকল বাইকের জন্য কমন
            </button>
            <button
              type="button"
              onClick={() => setAssignType('cc_wise')}
              className={`py-2 rounded-xl font-bold transition cursor-pointer ${assignType === 'cc_wise' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              ⚡ সিসি ক্যাটাগরি ওয়াইজ
            </button>
            <button
              type="button"
              onClick={() => setAssignType('model_specific')}
              className={`py-2 rounded-xl font-bold transition cursor-pointer ${assignType === 'model_specific' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              🎯 ব্র্যান্ড ও মডেল স্পেশাল
            </button>
          </div>
        </div>

        {/* যদি সিসি বা মডেল স্পেশাল হয় তবে ড্রপডাউন দেখাবে */}
        {assignType !== 'common' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-fadeIn">
            {assignType === 'model_specific' && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">ব্র্যান্ড নির্বাচন:</label>
                <select
                  value={lifespanBrand}
                  onChange={(e) => { setLifespanBrand(e.target.value); setLifespanSelectedModel(''); }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                >
                  {brands.map((b, idx) => <option key={idx} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">সিসি ক্যাটাগরি:</label>
              <select
                value={lifespanCc}
                onChange={(e) => setLifespanCc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-bold cursor-pointer"
              >
                {ccList.map((cc, idx) => <option key={idx} value={cc}>{cc}</option>)}
              </select>
            </div>

            {assignType === 'model_specific' && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">স্পেশাল মডেল (ঐচ্ছিক):</label>
                <select
                  value={lifespanSelectedModel}
                  onChange={(e) => setLifespanSelectedModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-bold cursor-pointer"
                >
                  <option value="">-- সাধারণ / কোনো নির্দিষ্ট মডেল নয় --</option>
                  {masterBikeModels
                    .filter(m => String(m.brand).toLowerCase() === String(lifespanBrand).toLowerCase() && String(m.cc).toLowerCase() === String(lifespanCc).toLowerCase())
                    .map((item) => (
                      <option key={item.id} value={item.model_name}>{item.model_name}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* নতুন পার্টস যুক্ত করার প্লাস ফর্ম */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/60 space-y-3">
          <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
            <span>＋</span> এই ক্যাটাগরিতে নতুন পার্টস যুক্ত করুন:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="পার্টসের নাম (যেমন: ক্লাচ কেবল)"
              className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold"
            />
            <input
              type="number"
              value={newPartKm}
              onChange={(e) => setNewPartKm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="টার্গেট KM"
              className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
            />
            <input
              type="number"
              value={newPartDays}
              onChange={(e) => setNewPartDays(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="টার্গেট দিন"
              className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
            />
            <button
              type="button"
              onClick={handleAddCustomPart}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition cursor-pointer shadow"
            >
              ＋ পার্টস যোগ করুন
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-sky-400">পার্টস অনুযায়ী স্থায়িত্ব ও লাইফস্প্যান লিস্ট:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {partsRules.map((part, index) => {
              const isEngineOil = part.id === 'engine_oil' || part.name?.includes('অয়েল') && !part.name?.includes('ফিল্টার');
              return (
                <div key={index} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-1/3">
                    <span className="text-base">{part.icon || '🔧'}</span>
                    <span className="font-bold">{part.name}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-2/3 justify-end flex-wrap">
                    {isEngineOil && (
                      <select
                        onChange={(e) => handleOilCategorySelect(index, e.target.value)}
                        className="bg-slate-900 text-[10px] text-amber-400 border border-amber-600/60 rounded-lg px-2 py-1.5 font-bold cursor-pointer"
                      >
                        <option value="">▾ অয়েল ক্যাটাগরি...</option>
                        {ENGINE_OIL_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name} ({cat.defaultKm} KM)</option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={part.km}
                        onChange={(e) => handlePartChange(index, 'km', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-sky-400 font-mono font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">KM</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={part.days}
                        onChange={(e) => handlePartChange(index, 'days', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-400 font-mono font-bold text-center"
                      />
                      <span className="text-[10px] text-slate-400">দিন</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = partsRules.filter((_, i) => i !== index);
                        setPartsRules(updated);
                      }}
                      className="bg-rose-950 hover:bg-rose-900 text-rose-300 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer"
        >
          ✓ সুপাবেস ডাটাবেজে মাস্টার টেমপ্লেট সেভ ও ম্যানুয়াল কনফিগারেশনে সিঙ্ক করুন
        </button>
      </form>
    </div>
  );
}