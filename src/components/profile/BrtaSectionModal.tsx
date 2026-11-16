'use client';
import { useState } from 'react';

const BD_DISTRICTS_AND_METROS = [
  'ঢাকা মেট্রো', 'চট্ট মেট্রো', 'সিলেট মেট্রো', 'খুলনা মেট্রো', 'রাজশাহী মেট্রো', 'বরিশাল মেট্রো', 'রংপুর মেট্রো', 'গাজীপুর মেট্রো',
  'ঢাকা', 'চট্টগ্রাম', 'কুমিল্লা', 'বগুড়া', 'সিলেট', 'খুলনা', 'রাজশাহী', 'রংপুর', 'ময়মনসিংহ', 'গাজীপুর', 'নারায়ণগঞ্জ'
];

const INITIAL_BD_BRTA_SERIES = [
  { code: 'A', label: 'A (এ - ১০০ cc পর্যন্ত)' },
  { code: 'HA', label: 'HA (হ - ১০১–১২৫ cc)' },
  { code: 'LA', label: 'LA (ল - ১২৬–১৬৫ cc)' },
  { code: 'KA', label: 'KA (ক - ১০০০ cc পর্যন্ত প্রাইভেট কার)' },
  { code: 'KHA', label: 'KHA (খ - ১০০১–১৩০০ cc)' },
  { code: 'GA', label: 'GA (গ - ১৩০১–২০০০ cc)' },
  { code: 'BHA', label: 'BHA (ভ - ২০০১ cc-এর বেশি)' },
  { code: 'GHA', label: 'GHA (ঘ - SUV / Crossover)' },
  { code: 'CHA', label: 'CHA (চ - মাইক্রোবাস)' },
  { code: 'JA', label: 'JA (জ - বাস/মিনিবাস)' },
  { code: 'JHA', label: 'JHA (ঝ - বাস/কোচ)' },
  { code: 'TA', label: 'TA (ট - ট্রাক)' },
  { code: 'THA', label: 'THA (ঠ - ট্রাক/বিশেষ ভারী যান)' },
  { code: 'DA', label: 'DA (ড - ট্রাক/পিকআপ)' },
  { code: 'DHA', label: 'DHA (ঢ - বিভিন্ন বাণিজ্যিক যান)' },
  { code: 'NNA', label: 'NNA (ণ - বিশেষ/বাণিজ্যিক শ্রেণি)' },
  { code: 'ON-TEST', label: 'ON-TEST / NEW (নতুন বাইক)' }
];

export default function BrtaSectionModal({ onBrtaSubmit, initialData, adminRequestedVideo }: any) {
  const [metro, setMetro] = useState(initialData?.cityMetro || 'ঢাকা মেট্রো');
  const [brtaSeriesList, setBrtaSeriesList] = useState(INITIAL_BD_BRTA_SERIES);
  const [series, setSeries] = useState(initialData?.series || 'LA');
  const [plate, setPlate] = useState(initialData?.plateNumber || '');
  const [engine, setEngine] = useState(initialData?.engine || '');
  const [chassis, setChassis] = useState(initialData?.chassis || '');
  
  const [videoAttempts, setVideoAttempts] = useState(initialData?.videoAttempts || 0);
  const [imageAttempts, setImageAttempts] = useState(initialData?.imageAttempts || 0);

  const [vehicleImages, setVehicleImages] = useState(initialData?.vehicleImages || { front: '', back: '', left: '', right: '' });
  const [vehicleVideo, setVehicleVideo] = useState(initialData?.vehicleVideo || '');

  // সিরিজ পরিবর্তন অথবা নতুন সিরিজ যোগ করার হ্যান্ডলার (+ প্লাস অপশন)
  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_SERIES') {
      const newCode = prompt('নতুন সিরিজ কোড লিখুন (যেমন: PA):');
      if (newCode && newCode.trim()) {
        const upperCode = newCode.trim().toUpperCase();
        const customLabel = prompt('এই সিরিজের বিবরণ লিখুন (যেমন: প - কাস্টম যান):') || upperCode;
        const newEntry = { code: upperCode, label: `${upperCode} (${customLabel})` };
        
        setBrtaSeriesList(prev => [...prev, newEntry]);
        setSeries(upperCode);
      }
    } else {
      setSeries(val);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height > img.width ? img.height * scaleSize : (img.height * scaleSize);

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 'front' | 'back' | 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageAttempts >= 7) {
        alert('⚠️ ছবি আপলোডের সর্বোচ্চ ৭ বার লিমিট অতিক্রম করেছে!');
        return;
      }
      const compressedDataUrl = await compressImage(file);
      setVehicleImages((prev: any) => ({ ...prev, [position]: compressedDataUrl }));
      setImageAttempts(prev => prev + 1);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoAttempts >= 10) {
        alert('⚠️ ভিডিও আপলোডের সর্বোচ্চ ১০ বার লিমিট অতিক্রম করেছে!');
        return;
      }
      setVehicleVideo(URL.createObjectURL(file));
      setVideoAttempts(prev => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !engine || !chassis) {
      alert('⚠️ দয়া করে প্লেট নম্বর, ইঞ্জিন নম্বর এবং চেসিস নম্বর পূরণ করুন!');
      return;
    }

    if (videoAttempts >= 10 || imageAttempts >= 7) {
      alert('⚠️ সর্বোচ্চ লিমিট অতিক্রম করার কারণে আপনার প্রোফাইলটি আনভেরিফাইড ব্যাচে রূপান্তরিত হয়েছে।');
    }

    const fullPlate = `${metro}-${series} ${plate}`;
    const brtaPayload = {
      cityMetro: metro,
      series: series,
      plateNumber: plate,
      bikePlate: fullPlate,
      engine,
      chassis,
      vehicleImages,
      vehicleVideo,
      videoAttempts,
      imageAttempts,
      isBrtaVerified: false,
      verificationStatus: 'pending'
    };

    if (onBrtaSubmit) {
      onBrtaSubmit(brtaPayload);
    }

    alert(`✅ বিআরটিএ তথ্য ও ফাইল সফলভাবে অ্যাডমিন প্যানেলে এডমিনের একাউন্টে জমা হয়েছে!`);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white space-y-4 text-xs shadow-inner">
      <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl text-amber-300 text-[11px] space-y-1">
        <p>⚠️ <b>সতর্কতা ও নিয়মাবলী:</b></p>
        <p>• গাড়ির চার দিকের ছবি ভেরিফিকেশনের জন্য পাঠান</p>
        {adminRequestedVideo && <p>• অ্যাডমিন প্যানেল থেকে ভিডিওর জন্য রিকোয়েস্ট করা হয়েছে। (বাকি চেষ্টা: {10 - videoAttempts} বার)</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">মেট্রো/জেলা</label>
            <select value={metro} onChange={(e) => setMetro(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer">
              {BD_DISTRICTS_AND_METROS.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">সিরিজ</label>
            <select value={series} onChange={handleSeriesChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer">
              {brtaSeriesList.map((s, idx) => <option key={idx} value={s.code}>{s.label}</option>)}
              <option value="ADD_NEW_CUSTOM_SERIES" className="text-sky-400 font-extrabold">+ প্লাস আইকন দিয়ে নতুন সিরিজ যুক্ত করুন</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">প্লেট নম্বর</label>
            <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="55-1234" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono uppercase" required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">ইঞ্জিন নম্বর (Engine No)</label>
            <input type="text" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="ইঞ্জিন নং লিখুন" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">চেসিস নম্বর (Chassis No)</label>
            <input type="text" value={chassis} onChange={(e) => setChassis(e.target.value)} placeholder="চেসিস নং লিখুন" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold font-mono" />
          </div>
        </div>

        {/* গাড়ির চার দিকের ছবি আপলোড: ফাইল চুজ ও সরাসরি ডিভাইস ক্যামেরা ওপেন করার কোড */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <label className="block text-sky-400 font-bold">📸 গাড়ির চার দিকের ছবি (সামনে, পেছন, বাম, ডান)</label>
          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-300 block font-bold">সামনে (Front)</span>
              <div className="flex gap-1.5 justify-center">
                <label className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📁 ফাইল চুজ
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} className="hidden" />
                </label>
                <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📸 ক্যামেরা
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'front')} className="hidden" />
                </label>
              </div>
              {vehicleImages.front && <span className="text-emerald-400 text-[10px] block font-bold">✓ ছবি সংযুক্ত</span>}
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-300 block font-bold">পেছনে (Back)</span>
              <div className="flex gap-1.5 justify-center">
                <label className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📁 ফাইল চুজ
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} className="hidden" />
                </label>
                <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📸 ক্যামেরা
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'back')} className="hidden" />
                </label>
              </div>
              {vehicleImages.back && <span className="text-emerald-400 text-[10px] block font-bold">✓ ছবি সংযুক্ত</span>}
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-300 block font-bold">বাম পাশ (Left)</span>
              <div className="flex gap-1.5 justify-center">
                <label className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📁 ফাইল চুজ
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'left')} className="hidden" />
                </label>
                <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📸 ক্যামেরা
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'left')} className="hidden" />
                </label>
              </div>
              {vehicleImages.left && <span className="text-emerald-400 text-[10px] block font-bold">✓ ছবি সংযুক্ত</span>}
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-300 block font-bold">ডান পাশ (Right)</span>
              <div className="flex gap-1.5 justify-center">
                <label className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📁 ফাইল চুজ
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'right')} className="hidden" />
                </label>
                <label className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer text-[10px] shadow">
                  📸 ক্যামেরা
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'right')} className="hidden" />
                </label>
              </div>
              {vehicleImages.right && <span className="text-emerald-400 text-[10px] block font-bold">✓ ছবি সংযুক্ত</span>}
            </div>

          </div>
        </div>

        {/* ভিডিও ফুটেজ শুধুমাত্র অ্যাডমিন রিকোয়েস্ট করলে শো করবে */}
        {adminRequestedVideo && (
          <div className="space-y-1.5 pt-1 border-t border-slate-800 animate-fadeIn bg-amber-950/20 p-3 rounded-xl border border-amber-800/40">
            <label className="block text-amber-400 font-bold">🎥 ২০ সেকেন্ডের ভিডিও ফুটেজ (অ্যাডমিন রিকোয়েস্টকৃত)</label>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:font-bold text-[11px]" />
            {vehicleVideo && <span className="text-emerald-400 text-[10px] block font-bold pt-1">✓ ভিডিও সংযুক্ত করা হয়েছে</span>}
          </div>
        )}

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold shadow-lg transition text-white">
          ✓ অ্যাডমিন প্যানেলে ভেরিফিকেশনের জন্য জমা দিন
        </button>
      </form>
    </div>
  );
}