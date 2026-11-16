'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_BRANDS = ['Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Hero', 'Kawasaki', 'KTM', 'Royal Enfield'];

const EBIKE_BRANDS_LIST = [
  'Walton Takyon', 
  'Akij E-Bike', 
  'Green Tiger', 
  'TAILG', 
  'REVOO', 
  'Sunra', 
  'Yadea', 
  'EVEHCO', 
  'ZEEHO', 
  'Ofero', 
  'Spark Ride', 
  'E-Max', 
  'Arin', 
  'Other E-Bike'
];

const DEFAULT_CC_LIST = ['80cc', '100cc', '110cc', '125cc', '135cc', '150cc', '155cc', '160cc', '200cc', '250cc', '300cc', '350cc'];

const DEFAULT_MOTOR_POWER_LIST = ['500W', '800W', '1000W', '1200W', '1500W', '2000W', '3000W'];
const DEFAULT_VOLTAGE_LIST = ['48V', '60V', '72V', '84V', '96V'];
const DEFAULT_AH_LIST = ['20Ah', '24Ah', '28Ah', '32Ah', '35Ah', '40Ah', '50Ah'];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  { value: '01', label: 'জানুয়ারি (01)' },
  { value: '02', label: 'ফেব্রুয়ারি (02)' },
  { value: '03', label: 'মার্চ (03)' },
  { value: '04', label: 'এপ্রিল (04)' },
  { value: '05', label: 'মে (05)' },
  { value: '06', label: 'জুন (06)' },
  { value: '07', label: 'জুলাই (07)' },
  { value: '08', label: 'আগস্ট (08)' },
  { value: '09', label: 'সেপ্টেম্বর (09)' },
  { value: '10', label: 'অক্টোবর (10)' },
  { value: '11', label: 'নভেম্বর (11)' },
  { value: '12', label: 'ডিসেম্বর (12)' }
];
const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

// ইঞ্জিন অয়েলের সেই চার ক্যাটাগরি
const UNIVERSAL_OIL_TYPES_DATA = [
  { id: 'mineral', lifespan: 1000, days: 180, title: 'মিনারেল (Mineral - ১০০০ কিমি)' },
  { id: 'semi', lifespan: 1500, days: 210, title: 'সেমি-সিন্থেটিক (Semi-Synthetic - ১৫০০ কিমি)' },
  { id: 'full', lifespan: 2500, days: 365, title: 'সিন্থেটিক (Synthetic - ২৫০০ কিমি)' },
  { id: 'rs4gp', lifespan: 3000, days: 365, title: 'RS4GP / Premium (৩০০০ কিমি)' },
];

// ফুয়েল বাইকের জন্য পূর্বের সেই বাধ্যতামূলক পার্টসগুলোর লিস্ট
const MANDATORY_PARTS_150_350 = [
  { id: 'engine_oil', lifespan: 1000, days: 180, icon: '🛢️', names: { bn: 'ইঞ্জিন অয়েল' } },
  { id: 'oil_filter', lifespan: 2500, days: 180, icon: '⚙️', names: { bn: 'অয়েল ফিল্টার' } },
  { id: 'air_filter', lifespan: 9000, days: 365, icon: '💨', names: { bn: 'এয়ার ফিল্টার' } },
  { id: 'spark_plug', lifespan: 12000, days: 730, icon: '⚡', names: { bn: 'স্পার্ক প্লাগ' } },
  { id: 'oil_seal', lifespan: 12000, days: 730, icon: '⭕', names: { bn: 'ওয়েল সিল' } },
  { id: 'brake_fluid', lifespan: 24000, days: 730, icon: '💧', names: { bn: 'ব্রেক ওয়েল' } },
  { id: 'chain_lube', lifespan: 500, days: 30, icon: '⛓️', names: { bn: 'চেইন লুব' } },
  { id: 'coolant', lifespan: 12000, days: 730, icon: '❄️', names: { bn: 'কুলেন্ট' } }
];

const STANDARD_PARTS = [
  { id: 'engine_oil', lifespan: 1000, days: 180, icon: '🛢️', names: { bn: 'ইঞ্জিন অয়েল' } },
  { id: 'chain_lube', lifespan: 500, days: 30, icon: '⛓️', names: { bn: 'চেইন লুব' } },
  { id: 'air_filter', lifespan: 10000, days: 365, icon: '💨', names: { bn: 'এয়ার ফিল্টার' } }
];

const EBIKE_MANDATORY_PARTS = [
  { id: 'battery_health', lifespan: 1000, days: 30, icon: '🔋', names: { bn: 'ব্যাটারি হেলথ ও চার্জিং সিস্টেম' } },
  { id: 'brake_shoe', lifespan: 2000, days: 90, icon: '🛑', names: { bn: 'ব্রেক প্যাড ও শু' } },
  { id: 'tire_check', lifespan: 500, days: 7, icon: '🛞', names: { bn: 'টায়ার ও হাওয়া চেক' } },
  { id: 'hub_motor', lifespan: 5000, days: 180, icon: '⚙️', names: { bn: 'হাব মোটর ও ইলেকট্রিক কন্ট্রোলার' } },
  { id: 'suspension_check', lifespan: 2000, days: 90, icon: '🔧', names: { bn: 'সাসপেনশন ও নাট-বোল্ট টাইটনেস' } }
];

const getCCParts = (cc: string, vType: string) => {
  if (vType === 'ebike') {
    return EBIKE_MANDATORY_PARTS;
  } else if (vType === 'others') {
    return [
      { id: 'general_checkup', lifespan: 5000, days: 180, icon: '🔧', names: { bn: 'জেনারেল চেকআপ' } },
      { id: 'fluid_check', lifespan: 10000, days: 365, icon: '💧', names: { bn: 'ফ্লুইড ও লুব্রিকেন্ট' } }
    ];
  }

  const numericCc = parseInt(cc);
  if (!isNaN(numericCc) && numericCc >= 150 && numericCc <= 350) {
    return MANDATORY_PARTS_150_350;
  }
  return STANDARD_PARTS;
};

interface ManualConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualSubmit?: (payload: any) => void;
  initialData?: any;
  user?: any;
}

export default function ManualConfigModal({ isOpen, onClose, onManualSubmit, initialData, user }: ManualConfigModalProps) {
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || 'fuel_bike');
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [ccList, setCcList] = useState<string[]>(DEFAULT_CC_LIST);

  const [motorPowerList, setMotorPowerList] = useState<string[]>(DEFAULT_MOTOR_POWER_LIST);
  const [voltageList, setVoltageList] = useState<string[]>(DEFAULT_VOLTAGE_LIST);
  const [ahList, setAhList] = useState<string[]>(DEFAULT_AH_LIST);

  const [selectedBrand, setSelectedBrand] = useState(initialData?.bikeBrand || 'Yamaha');
  const [selectedCc, setSelectedCc] = useState(initialData?.bikeCc || '155cc');
  
  const [selectedMotorPower, setSelectedMotorPower] = useState('1000W');
  const [selectedVoltage, setSelectedVoltage] = useState('72V');
  const [selectedAh, setSelectedAh] = useState('32Ah');

  const [selectedBikeModel, setSelectedBikeModel] = useState(initialData?.bikeModel || '');
  
  const [selectedDay, setSelectedDay] = useState('15');
  const [selectedMonth, setSelectedMonth] = useState('05');
  const [selectedYear, setSelectedYear] = useState('2026');

  const [partsList, setPartsList] = useState<any[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartLifespan, setNewPartLifespan] = useState('');
  const [newPartDays, setNewPartDays] = useState('');
  const [selectedOilType, setSelectedOilType] = useState('mineral');

  const [isAllowedToConfigure, setIsAllowedToConfigure] = useState(false);

  const fetchVehiclesList = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userVehs, error } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      if (!error && userVehs && userVehs.length > 0) {
        setVehiclesList(userVehs);
        const active = userVehs.find((v: any) => v.is_active) || userVehs[0];
        setSelectedVehicleId(active.id);
        loadVehicleToState(active);
      } else {
        setVehiclesList([]);
      }
    } catch (err) {
      console.error('Error fetching vehicles list:', err);
    }
  };

  useEffect(() => {
    const initModal = async () => {
      if (!isOpen) return;
      await fetchVehiclesList();

      try {
        const { data: modelData } = await supabase.from('admin_bike_models_master').select('*');
        if (modelData && modelData.length > 0) {
          const uniqueBrands = Array.from(new Set([...DEFAULT_BRANDS, ...modelData.map((i: any) => i.brand)]));
          const uniqueCc = Array.from(new Set([...DEFAULT_CC_LIST, ...modelData.map((i: any) => i.cc)]));
          setBrands(uniqueBrands as string[]);
          setCcList(uniqueCc as string[]);
        }
        setIsAllowedToConfigure(true);
      } catch (err) {
        console.error('Error master data:', err);
        setIsAllowedToConfigure(true);
      }
    };

    initModal();
  }, [isOpen]);

  const loadVehicleToState = (veh: any) => {
    const vType = veh.vehicle_type || 'fuel_bike';
    setVehicleType(vType);
    setSelectedBrand(veh.bike_brand || (vType === 'ebike' ? 'Walton Takyon' : 'Yamaha'));
    setSelectedBikeModel(veh.bike_model || '');

    if (vType === 'ebike' && veh.bike_cc && veh.bike_cc.includes('|')) {
      const partsArr = veh.bike_cc.split('|').map((s: string) => s.trim());
      if (partsArr[0]) setSelectedMotorPower(partsArr[0]);
      if (partsArr[1]) {
        const vAh = partsArr[1].split(' ');
        if (vAh[0]) setSelectedVoltage(vAh[0]);
        if (vAh[1]) setSelectedAh(vAh[1]);
      }
    } else {
      setSelectedCc(veh.bike_cc || '155cc');
    }

    if (veh.purchase_date) {
      const parts = veh.purchase_date.split('-');
      if (parts.length === 3) {
        setSelectedDay(parts[0]);
        setSelectedMonth(parts[1]);
        setSelectedYear(parts[2]);
      }
    }
    setPartsList(veh.parts_list && veh.parts_list.length > 0 ? veh.parts_list : getCCParts(veh.bike_cc, vType));
  };

  const handleSelectVehicle = async (vehId: string) => {
    setSelectedVehicleId(vehId);
    const veh = vehiclesList.find(v => v.id === vehId);
    if (veh) {
      loadVehicleToState(veh);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from('user_vehicles').update({ is_active: false }).eq('user_id', authUser.id);
        await supabase.from('user_vehicles').update({ is_active: true }).eq('id', vehId);
      }
      
      if (onManualSubmit) {
        onManualSubmit({
          vehicleType: veh.vehicle_type,
          bikeBrand: veh.bike_brand,
          bikeCc: veh.bike_cc,
          bikeModel: veh.bike_model,
          purchaseDate: veh.purchase_date,
          partsList: veh.parts_list
        });
      }
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_BRAND') {
      const newBrand = prompt('নতুন ব্র্যান্ডের নাম লিখুন:');
      if (newBrand && newBrand.trim()) {
        const formatted = newBrand.trim();
        if (!brands.includes(formatted)) setBrands(prev => [...prev, formatted]);
        setSelectedBrand(formatted);
      }
    } else {
      setSelectedBrand(val);
    }
  };

  const handleCcChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_CUSTOM_CC') {
      const newCc = prompt('নতুন সিসি লিখুন (যেমন: 400cc):');
      if (newCc && newCc.trim()) {
        const formatted = newCc.trim().toLowerCase().includes('cc') ? newCc.trim() : newCc.trim() + 'cc';
        if (!ccList.includes(formatted)) setCcList(prev => [...prev, formatted]);
        setSelectedCc(formatted);
        setPartsList(getCCParts(formatted, vehicleType));
      }
    } else {
      setSelectedCc(val);
      setPartsList(getCCParts(val, vehicleType));
    }
  };

  const handleMotorPowerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_MOTOR_POWER') {
      const newPow = prompt('নতুন মোটর পাওয়ার লিখুন (যেমন: 2500W):');
      if (newPow && newPow.trim()) {
        const formatted = newPow.trim().toUpperCase().includes('W') ? newPow.trim().toUpperCase() : newPow.trim().toUpperCase() + 'W';
        if (!motorPowerList.includes(formatted)) setMotorPowerList(prev => [...prev, formatted]);
        setSelectedMotorPower(formatted);
      }
    } else {
      setSelectedMotorPower(val);
    }
  };

  const handleVoltageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_VOLTAGE') {
      const newVol = prompt('নতুন ভোল্টেজ লিখুন (যেমন: 110V):');
      if (newVol && newVol.trim()) {
        const formatted = newVol.trim().toUpperCase().includes('V') ? newVol.trim().toUpperCase() : newVol.trim().toUpperCase() + 'V';
        if (!voltageList.includes(formatted)) setVoltageList(prev => [...prev, formatted]);
        setSelectedVoltage(formatted);
      }
    } else {
      setSelectedVoltage(val);
    }
  };

  const handleAhChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ADD_NEW_AH') {
      const newAh = prompt('নতুন অ্যাম্পিয়ার আওয়ার লিখুন (যেমন: 60Ah):');
      if (newAh && newAh.trim()) {
        const formatted = newAh.trim().toUpperCase().includes('AH') ? newAh.trim().toUpperCase() : newAh.trim().toUpperCase() + 'AH';
        if (!ahList.includes(formatted)) setAhList(prev => [...prev, formatted]);
        setSelectedAh(formatted);
      }
    } else {
      setSelectedAh(val);
    }
  };

  const handleVehicleTypeChange = (newType: string) => {
    setVehicleType(newType);
    if (newType === 'ebike') {
      setSelectedBrand(EBIKE_BRANDS_LIST[0]);
    } else if (newType === 'fuel_bike') {
      setSelectedBrand(DEFAULT_BRANDS[0]);
    }
    setPartsList(getCCParts(selectedCc, newType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleType || !selectedBikeModel.trim()) {
      alert('⚠️ দয়া করে ক্যাটাগরি ও মডেলের নাম লিখুন!');
      return;
    }
    
    const formattedDateString = `${selectedDay}-${selectedMonth}-${selectedYear}`;
    const effectiveCc = vehicleType === 'ebike' ? `${selectedMotorPower} | ${selectedVoltage} ${selectedAh}` : selectedCc;

    const payload = {
      vehicleType,
      bikeBrand: selectedBrand,
      bikeCc: effectiveCc,
      bikeModel: selectedBikeModel,
      purchaseDate: formattedDateString,
      partsList
    };

    if (onManualSubmit) onManualSubmit(payload);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && selectedVehicleId) {
        const dbPayload = {
          vehicle_type: vehicleType,
          bike_brand: selectedBrand,
          bike_cc: effectiveCc,
          bike_model: selectedBikeModel,
          purchase_date: formattedDateString,
          parts_list: partsList,
          updated_at: new Date().toISOString()
        };

        await supabase.from('user_vehicles').update(dbPayload).eq('id', selectedVehicleId);

        await supabase.from('user_bike_manual_configurations').upsert([
          {
            user_id: authUser.id,
            vehicle_type: vehicleType,
            bike_brand: selectedBrand,
            bike_cc: effectiveCc,
            bike_model: selectedBikeModel,
            purchase_date: formattedDateString,
            parts_list: partsList,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'user_id' });

        await fetchVehiclesList();
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
    }

    alert('✅ গাড়ির কনফিগারেশন সফলভাবে আপডেট করা হয়েছে!');
    if (onClose) onClose();
  };

  if (!isOpen || !isAllowedToConfigure) return null;

  const currentBrandsList = vehicleType === 'ebike' ? EBIKE_BRANDS_LIST : brands;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative text-xs text-slate-100">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
            <span>⚙️</span> ম্যানুয়াল কনফিগারেশন
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base cursor-pointer">✕</button>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {vehiclesList.length > 0 && (
              vehiclesList.map((v: any) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVehicle(v.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    selectedVehicleId === v.id 
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30' 
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{v.vehicle_type === 'ebike' ? '⚡' : '🏍️'}</span>
                  <span>{v.bike_brand} {v.bike_model}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 block mb-1 font-bold">যানবাহনের ক্যাটাগরি (Vehicle Type): <span className="text-rose-500">*</span></label>
            <select
              value={vehicleType}
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
              className="w-full bg-slate-950 border border-sky-500 rounded-xl p-3 text-white font-bold cursor-pointer"
            >
              <option value="fuel_bike">🏍️ ফুয়েল বাইক (Fuel Motorcycle)</option>
              <option value="ebike">⚡ ই-বাইক (Electric Bike)</option>
              <option value="others">🚗 অন্যান্য যানবাহন (Other Vehicles)</option>
            </select>
          </div>

          {vehicleType && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">ব্র্যান্ড (Brand):</label>
                  <select
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                  >
                    {currentBrandsList.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                    <option value="ADD_NEW_CUSTOM_BRAND" className="text-sky-400 font-extrabold">
                      ＋ নতুন ব্র্যান্ড যুক্ত করুন...
                    </option>
                  </select>
                </div>

                {vehicleType === 'ebike' ? (
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">মোটর পাওয়ার (Motor Power):</label>
                    <select
                      value={selectedMotorPower}
                      onChange={handleMotorPowerChange}
                      className="w-full bg-slate-950 border border-emerald-600 rounded-xl p-2.5 text-emerald-400 font-bold cursor-pointer"
                    >
                      {motorPowerList.map((pow, idx) => (
                        <option key={idx} value={pow}>{pow}</option>
                      ))}
                      <option value="ADD_NEW_MOTOR_POWER" className="text-emerald-400 font-extrabold">
                        ＋ নতুন মোটর পাওয়ার যুক্ত করুন...
                      </option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">সিসি/ক্যাপাসিটি (CC):</label>
                    <select
                      value={selectedCc}
                      onChange={handleCcChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold cursor-pointer"
                    >
                      {ccList.map((cc, idx) => (
                        <option key={idx} value={cc}>{cc}</option>
                      ))}
                      <option value="ADD_NEW_CUSTOM_CC" className="text-emerald-400 font-extrabold">
                        ＋ নতুন সিসি যুক্ত করুন...
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {vehicleType === 'ebike' && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-800/60 space-y-3">
                  <span className="font-bold text-emerald-400 block text-xs">🔋 ব্যাটারি ক্যাপাসিটি সাব-সেকশন:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px]">ভোল্টেজ (Voltage):</label>
                      <select
                        value={selectedVoltage}
                        onChange={handleVoltageChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold cursor-pointer text-xs"
                      >
                        {voltageList.map((v, idx) => (
                          <option key={idx} value={v}>{v}</option>
                        ))}
                        <option value="ADD_NEW_VOLTAGE" className="text-cyan-400 font-extrabold">
                          ＋ ভোল্টেজ যুক্ত করুন
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px]">অ্যাম্পিয়ার আওয়ার (Ah):</label>
                      <select
                        value={selectedAh}
                        onChange={handleAhChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-bold cursor-pointer text-xs"
                      >
                        {ahList.map((ah, idx) => (
                          <option key={idx} value={ah}>{ah}</option>
                        ))}
                        <option value="ADD_NEW_AH" className="text-cyan-400 font-extrabold">
                          ＋ অ্যাম্পিয়ার আওয়ার যুক্ত করুন
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">যানবাহনের পূর্ণ মডেল ও নাম:</label>
                <input
                  type="text"
                  value={selectedBikeModel}
                  onChange={(e) => setSelectedBikeModel(e.target.value)}
                  placeholder="যেমন: X-Blade, Takyon ইত্যাদি"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-purple-800/60 space-y-3">
                <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>🔧</span> পার্টস লাইফস্প্যান ও কাস্টমাইজেশন:
                </h4>
                
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {partsList.map((part: any, index: number) => {
                    const isEngineOil = vehicleType === 'fuel_bike' && (part.id === 'engine_oil' || part.names?.bn?.includes('ইঞ্জিন অয়েল'));

                    return (
                      <div key={part.id || index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{part.icon || '⚙️'}</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{part.names?.bn || part.name}</span>
                            {isEngineOil && (
                              <select
                                value={selectedOilType}
                                onChange={(e) => {
                                  const sel = e.target.value;
                                  setSelectedOilType(sel);
                                  const found = UNIVERSAL_OIL_TYPES_DATA.find(o => o.id === sel);
                                  if (found) {
                                    const updated = [...partsList];
                                    updated[index].lifespan = found.lifespan;
                                    updated[index].days = found.days;
                                    setPartsList(updated);
                                  }
                                }}
                                className="bg-slate-950 text-[10px] text-amber-400 border border-amber-600/60 rounded px-1.5 py-0.5 font-bold cursor-pointer"
                              >
                                {UNIVERSAL_OIL_TYPES_DATA.map(opt => (
                                  <option key={opt.id} value={opt.id}>▾ {opt.title}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <input
                            type="number"
                            value={part.lifespan ?? part.km ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              const updated = [...partsList];
                              updated[index].lifespan = val;
                              updated[index].km = val;
                              setPartsList(updated);
                            }}
                            placeholder="KM"
                            className="w-16 bg-slate-950 border border-purple-500 rounded-lg p-1 text-right font-mono font-bold text-white text-[11px]"
                          />
                          <span className="text-slate-400 text-[10px]">KM</span>

                          <input
                            type="number"
                            value={part.days ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              const updated = [...partsList];
                              updated[index].days = val;
                              setPartsList(updated);
                            }}
                            placeholder="Days"
                            className="w-16 bg-slate-950 border border-sky-500 rounded-lg p-1 text-right font-mono font-bold text-white text-[11px]"
                          />
                          <span className="text-slate-400 text-[10px]">দিন</span>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = partsList.filter((_, i) => i !== index);
                              setPartsList(updated);
                            }}
                            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                            title="পার্টস ডিলিট করুন"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-900 space-y-2">
                  <span className="font-bold text-emerald-400 block text-[11px]">＋ আপনার প্রয়োজনমতো নতুন পার্টস অ্যাড করুন:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      placeholder="নাম (যেমন: এক্সট্রা পার্টস)"
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                    <input
                      type="number"
                      value={newPartLifespan}
                      onChange={(e) => setNewPartLifespan(e.target.value)}
                      placeholder="টার্গেট KM"
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={newPartDays}
                        onChange={(e) => setNewPartDays(e.target.value)}
                        placeholder="দিন"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPartName.trim()) {
                            alert('সঠিক পার্টসের নাম দিন!');
                            return;
                          }
                          setPartsList([...partsList, {
                            id: 'custom_' + Date.now(),
                            lifespan: Number(newPartLifespan) || 0,
                            days: Number(newPartDays) || 365,
                            icon: vehicleType === 'ebike' ? '⚡' : '🔧',
                            names: { bn: newPartName.trim() }
                          }]);
                          setNewPartName('');
                          setNewPartLifespan('');
                          setNewPartDays('');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 rounded-lg text-xs cursor-pointer"
                      >
                        যোগ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-400 block font-bold">যানবাহন ক্রয়ের তারিখ (Purchase Date):</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold font-mono cursor-pointer"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold cursor-pointer"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold font-mono cursor-pointer"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer"
            >
              ✓ কনফিগার আপডেট করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}