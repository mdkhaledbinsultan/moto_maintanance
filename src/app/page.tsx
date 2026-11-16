'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import UserProfileModal from '@/components/profile/UserProfileModal';
import ManualConfigModal from '@/components/profile/ManualConfigModal';
import BrtaSectionModal from '@/components/profile/BrtaSectionModal';
import OdometerWidget from '@/components/tracker/OdometerWidget';
import SavingsTrackerModal from '@/components/tracker/SavingsTrackerModal';
import ExpenseTrackerModal from '@/components/tracker/ExpenseTrackerModal';
import PartsHealthCard from '@/components/tracker/PartsHealthCard';
import NewBikeFreeandPaidService from '@/components/tracker/NewBikeFreeandPaidService';
import MileageAndAnalyticsPanel from '@/components/tracker/MileageAndAnalyticsPanel';
import CustomerMileageCalculatorModal from '@/components/tracker/CustomerMileageCalculatorModal';
import DonationModal from '@/components/tracker/DonationModal';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  bn: {
    routineCheckTitle: 'নিয়মিত রুটিন চেক (ব্র্যান্ড ও সিসি ম্যানুয়াল ওয়াইজ)',
    changeBtn: 'চেঞ্জ',
    hideDetails: '▲ হাইড করুন',
    viewDetails: '▼ বিস্তারিত দেখুন',
    allPartsTitle: 'সকল পার্টসের স্থায়িত্ব ও লাইফস্প্যান'
  }
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [activeAuthModal, setActiveAuthModal] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'user' | 'manual' | 'brta' | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [allUserVehicles, setAllUserVehicles] = useState<any[]>([]);

  const [savingsEntriesList, setSavingsEntriesList] = useState<any[]>([]);
  const [expenseEntriesList, setExpenseEntriesList] = useState<any[]>([]);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [showSavingsDetailsModal, setShowSavingsDetailsModal] = useState(false);
  const [showCostDetailsModal, setShowCostDetailsModal] = useState(false);
  const [showMileageCalcModal, setShowMileageCalcModal] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const [userOdometer, setUserOdometer] = useState<number>(0);
  const [userPurchaseDate, setUserPurchaseDate] = useState<string>('');
  
  const [userVehicleType, setUserVehicleType] = useState<string>('fuel_bike');
  const [userBikeBrand, setUserBikeBrand] = useState<string>('');
  const [userBikeCc, setUserBikeCc] = useState<string>('');
  const [userBikeModel, setUserBikeModel] = useState<string>('');

  const [topEssentialParts, setTopEssentialParts] = useState<any[]>([]);
  const t = TRANSLATIONS['bn'];

  const fetchUserDataFromSupabase = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setUserOdometer(profileData.odometer || 0);
        if (!profileData.profile_completed || !profileData.phone) {
          setActiveProfileTab('user');
        }
      } else {
        setActiveProfileTab('user');
      }

      const { data: userVehs } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (userVehs && userVehs.length > 0) {
        setAllUserVehicles(userVehs);
        const activeVeh = userVehs.find((v: any) => v.is_active) || userVehs[0];
        
        setUserVehicleType(activeVeh.vehicle_type || 'fuel_bike');
        setUserPurchaseDate(activeVeh.purchase_date || '');
        setUserBikeBrand(activeVeh.bike_brand || '');
        setUserBikeCc(activeVeh.bike_cc || '');
        setUserBikeModel(activeVeh.bike_model || '');
        setTopEssentialParts(activeVeh.parts_list && activeVeh.parts_list.length > 0 ? activeVeh.parts_list : []);
      } else {
        const { data: configData } = await supabase
          .from('user_bike_manual_configurations')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (configData) {
          setUserVehicleType(configData.vehicle_type || 'fuel_bike');
          setUserPurchaseDate(configData.purchase_date || '');
          setUserBikeBrand(configData.bike_brand || '');
          setUserBikeCc(configData.bike_cc || '');
          setUserBikeModel(configData.bike_model || '');
          setTopEssentialParts(configData.parts_list || []);
        }
      }

      const { data: savingsData } = await supabase
        .from('user_savings_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savingsData) setSavingsEntriesList(savingsData);

      const { data: expenseData } = await supabase
        .from('user_expense_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (expenseData) setExpenseEntriesList(expenseData);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserDataFromSupabase(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        fetchUserDataFromSupabase(authUser.id);
      } else {
        setSavingsEntriesList([]);
        setExpenseEntriesList([]);
        setUserOdometer(0);
        setUserPurchaseDate('');
        setUserVehicleType('fuel_bike');
        setUserBikeBrand('');
        setUserBikeCc('');
        setUserBikeModel('');
        setTopEssentialParts([]);
        setAllUserVehicles([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveProfileTab(null);
    setIsProfileMenuOpen(false);
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'গ্রাহক';

  const totalAccumulatedSavings = useMemo(() => {
    return savingsEntriesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [savingsEntriesList]);

  const totalCost = useMemo(() => {
    return expenseEntriesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenseEntriesList]);

  const formatMoney = (amount: number) => {
    return `৳${Math.round(amount).toLocaleString()}`;
  };

  const displayBikeName = userBikeBrand && userBikeModel 
    ? `${userBikeBrand} ${userBikeModel} (${userBikeCc || ''})` 
    : userBikeBrand || userBikeModel || 'আপনার গাড়ি কনফিগার করুন';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 md:p-8 selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* হেডার যেখানে সুইচ করুন বাটন সম্পূর্ণ মুছে ফেলা হয়েছে */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto py-3 px-5 bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative z-40 mb-6">
        <div className="text-sm md:text-base font-extrabold tracking-wide text-white flex items-center gap-2.5">
          <span className="text-lg p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner">
            {userVehicleType === 'ebike' ? '⚡' : '🏍️'}
          </span> 
          
          <div className="flex items-center gap-2 relative">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {user ? displayBikeName : 'স্মার্ট বাইক ট্র্যাকার ও সিকিউরিটি'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => setIsDonationModalOpen(true)}
              className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-90 text-white font-extrabold px-3.5 py-2 rounded-xl transition shadow-lg cursor-pointer text-xs flex items-center gap-1.5 animate-pulse"
            >
              <span>💖</span> অনুদান / সাপোর্ট
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 bg-slate-950/70 border border-slate-700/60 hover:border-cyan-500 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-lg group"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-slate-200 font-bold group-hover:text-cyan-400 transition">{userName}</span>
                <span className={`text-slate-400 text-[10px] transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs space-y-1 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-slate-800 text-[11px] text-cyan-400 font-mono truncate">
                    {user.email}
                  </div>
                  <button
                    onClick={() => { setActiveProfileTab('user'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 text-slate-200 hover:text-cyan-400 font-bold transition cursor-pointer flex items-center gap-2.5"
                  >
                    <span className="text-sm">👤</span> ইউজার প্রোফাইল ও পাসওয়ার্ড
                  </button>
                  <button
                    onClick={() => { setActiveProfileTab('manual'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 text-slate-200 hover:text-amber-400 font-bold transition cursor-pointer flex items-center gap-2.5"
                  >
                    <span className="text-sm">⚙️</span> ম্যানুয়াল কনফিগারেশন ও বাইক সুইচ
                  </button>
                  <button
                    onClick={() => { setActiveProfileTab('brta'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 text-slate-200 hover:text-emerald-400 font-bold transition cursor-pointer flex items-center gap-2.5"
                  >
                    <span className="text-sm">🚗</span> বিআরটিএ সেকশন
                  </button>
                  <div className="border-t border-slate-800/80 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-950/40 text-rose-400 font-bold transition cursor-pointer flex items-center gap-2.5"
                    >
                      <span className="text-sm">🚪</span> লগআউট
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveAuthModal('login')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition text-xs cursor-pointer"
              >
                লগইন
              </button>
              <button
                onClick={() => setActiveAuthModal('register')}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold px-4 py-2 rounded-xl shadow transition text-xs cursor-pointer"
              >
                রেজিস্ট্রেশন
              </button>
            </div>
          )}
        </div>
      </header>
        
      <main className="w-full max-w-7xl mx-auto space-y-6 relative z-10">
        {user && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-end">
              <button
                onClick={() => setShowMileageCalcModal(true)}
                className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold px-5 py-2.5 rounded-2xl transition-all shadow-xl shadow-cyan-600/20 cursor-pointer text-xs flex items-center gap-2 border border-cyan-400/30 transform hover:-translate-y-0.5"
              >
                <span>⛽</span> Mileage Calculator (মাইলেজ ক্যালকুলেটর)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              <div className="glass-card p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition"></div>
                <OdometerWidget 
                  currentOdometer={userOdometer} 
                  purchaseDate={userPurchaseDate}
                  onUpdateOdometer={async (newVal: number) => {
                    setUserOdometer(newVal);
                    if (user) {
                      await supabase.from('profiles').update({ odometer: newVal }).eq('id', user.id);
                    }
                  }}
                  onAdminVerificationRequest={() => {}}
                />
              </div>

              <div className="glass-card p-5 rounded-3xl text-xs text-slate-100 flex flex-col justify-between relative overflow-hidden group min-h-[180px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition"></div>
                
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">💰</span> সর্বমোট সাশ্রয়
                  </span>
                  <button 
                    onClick={() => setShowSavingsModal(true)}
                    className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer shadow-md"
                  >
                    <span>＋</span> সাশ্রয় এন্ট্রি
                  </button>
                </div>
                
                <div className="relative z-10 py-3">
                  <div 
                    className="text-3xl md:text-4xl font-black text-emerald-400 tracking-wider drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    style={{ fontFamily: 'Arial Black, sans-serif' }}
                  >
                    {formatMoney(totalAccumulatedSavings)}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-xs relative z-10">
                  <span className="text-slate-400 font-medium">হিস্ট্রি ও ফিল্টার</span>
                  <button 
                    onClick={() => setShowSavingsDetailsModal(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer flex items-center gap-1 transition"
                  >
                    সকল এন্ট্রিগুলো 🔍
                  </button>
                </div>
              </div>

              <div className="glass-card p-5 rounded-3xl text-xs text-slate-100 flex flex-col justify-between relative overflow-hidden group min-h-[180px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition"></div>
                
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-400">💸</span> এ পর্যন্ত মোট খরচ
                  </span>
                  <button 
                    onClick={() => setShowQuickExpenseModal(true)}
                    className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer shadow-md"
                  >
                    <span>＋</span> খরচ এন্ট্রি
                  </button>
                </div>
                
                <div className="relative z-10 py-3">
                  <div 
                    className="text-3xl md:text-4xl font-black text-rose-400 tracking-wider drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    style={{ fontFamily: 'Arial Black, sans-serif' }}
                  >
                    {formatMoney(totalCost)}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-xs relative z-10">
                  <span className="text-slate-400 font-medium">হিস্ট্রি ও ফিল্টার</span>
                  <button 
                    onClick={() => setShowCostDetailsModal(true)}
                    className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer flex items-center gap-1 transition"
                  >
                    সকল এন্ট্রিগুলো 🔍
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {user && (
          <>
            <PartsHealthCard 
              t={t}
              topEssentialParts={topEssentialParts}
              currentOdometer={userOdometer}
              user={user}
              bikeBrand={userBikeBrand}
              bikeCc={userBikeCc}
              bikeModel={userBikeModel}
              purchaseDate={userPurchaseDate}
              vehicleType={userVehicleType}
            />

            <NewBikeFreeandPaidService 
              user={user} 
              vehicleType={userVehicleType}
              fetchLogs={() => fetchUserDataFromSupabase(user.id)} 
            />

            <MileageAndAnalyticsPanel 
              expenseList={expenseEntriesList} 
              savingsList={savingsEntriesList} 
              currentOdometer={userOdometer} 
            />
          </>
        )}

        {!user && (
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-5 py-24 px-6 glass-card rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
            <span className="text-5xl p-4 bg-cyan-950/60 border border-cyan-800/50 rounded-2xl shadow-inner text-cyan-400">🏍️</span>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug">
              আপনার বাইকের সর্বোচ্চ নিরাপত্তা ও লাইফস্প্যান ট্র্যাকিং
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-lg">
              স্মার্ট ওডোমিটার সিঙ্ক, ফুয়েল-টু-ফুয়েল মাইলেজ হিসাব এবং পার্টস লাইফস্প্যান ম্যানেজমেন্টের মাধ্যমে আপনার বাইক রাখুন সর্বদা সুরক্ষিত। ওপরের লগইন বা রেজিস্ট্রেশন বাটন ব্যবহার করে প্রবেশ করুন।
            </p>
          </div>
        )}
      </main>

      <SavingsTrackerModal
        user={user}
        savingsEntriesList={savingsEntriesList}
        setSavingsEntriesList={setSavingsEntriesList}
        showSavingsModal={showSavingsModal}
        setShowSavingsModal={setShowSavingsModal}
        showSavingsDetailsModal={showSavingsDetailsModal}
        setShowSavingsDetailsModal={setShowSavingsDetailsModal}
        formatMoney={formatMoney}
      />

      <ExpenseTrackerModal
        user={user}
        expenseEntriesList={expenseEntriesList}
        setExpenseEntriesList={setExpenseEntriesList}
        showQuickExpenseModal={showQuickExpenseModal}
        setShowQuickExpenseModal={setShowQuickExpenseModal}
        showCostDetailsModal={showCostDetailsModal}
        setShowCostDetailsModal={setShowCostDetailsModal}
        formatMoney={formatMoney}
        vehicleType={userVehicleType}
      />

      <CustomerMileageCalculatorModal
        isOpen={showMileageCalcModal}
        onClose={() => setShowMileageCalcModal(false)}
        user={user}
        expenseEntriesList={expenseEntriesList}
        formatMoney={formatMoney}
      />

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-900 mt-12 relative z-10">
        &copy; {new Date().getFullYear()} Bike Security & Management System. All rights reserved.
      </footer>

      {activeAuthModal === 'login' && (
        <LoginModal
          isOpen={true}
          onClose={() => setActiveAuthModal(null)}
          onSwitchToRegister={() => setActiveAuthModal('register')}
          onSwitchToForgotPassword={() => setActiveAuthModal('forgot')}
        />
      )}

      {activeAuthModal === 'register' && (
        <RegisterModal
          isOpen={true}
          onClose={() => setActiveAuthModal(null)}
          onSwitchToLogin={() => setActiveAuthModal('login')}
        />
      )}

      {activeAuthModal === 'forgot' && (
        <ForgotPasswordModal
          isOpen={true}
          onClose={() => setActiveAuthModal(null)}
        />
      )}

      {activeProfileTab === 'user' && user && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg min-h-[60vh] max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative my-auto">
            <UserProfileModal
              isOpen={true}
              onClose={() => {
                setActiveProfileTab('manual');
              }}
              user={user}
            />
          </div>
        </div>
      )}

      {activeProfileTab === 'manual' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg min-h-[60vh] max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative my-auto">
            <button 
              onClick={() => setActiveProfileTab(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm font-bold bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
            <ManualConfigModal
              isOpen={true}
              onClose={() => {
                setActiveProfileTab(null);
                if (user) fetchUserDataFromSupabase(user.id);
              }}
              user={user}
              initialData={{
                vehicleType: userVehicleType,
                bikeBrand: userBikeBrand,
                bikeCc: userBikeCc,
                bikeModel: userBikeModel,
                purchaseDate: userPurchaseDate,
                partsList: topEssentialParts
              }}
              onManualSubmit={async (payload: any) => {
                setUserVehicleType(payload.vehicleType);
                setUserBikeBrand(payload.bikeBrand);
                setUserBikeCc(payload.bikeCc);
                setUserBikeModel(payload.bikeModel);
                setUserPurchaseDate(payload.purchaseDate);
                if (payload.partsList && payload.partsList.length > 0) {
                  setTopEssentialParts(payload.partsList);
                }
                if (user) await fetchUserDataFromSupabase(user.id);
              }}
            />
          </div>
        </div>
      )}

      {activeProfileTab === 'brta' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl min-h-[75vh] max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative my-auto">
            <button 
              onClick={() => setActiveProfileTab(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm font-bold bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition"
            >
              ✕
            </button>
            
            <div className="mb-4 pr-6">
              <h3 className="text-sm font-bold text-white">বিআরটিএ ভেরিফিকেশন ফর্ম</h3>
              <p className="text-[11px] text-slate-400">নিচের ফর্মটি যথাযথভাবে পূরণ করুন।</p>
            </div>

            <BrtaSectionModal
              onBrtaSubmit={() => {
                setActiveProfileTab(null);
              }}
              initialData={null}
              adminRequestedVideo={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}