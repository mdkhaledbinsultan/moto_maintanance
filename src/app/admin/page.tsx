'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import AdminBikeModelPanel from './AdminBikeModelPanel';
import AdminLifespanMasterPanel from './AdminLifespanMasterPanel';
import AdminFuelPricePanel from './AdminFuelPricePanel';
import UserManagementTable from './UserManagementTable';
import UserDashboardModal from './UserDashboardModal';

export default function AdminPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUserImages, setSelectedUserImages] = useState<any | null>(null);
  const [viewingUserProfile, setViewingUserProfile] = useState<any | null>(null);

  useEffect(() => {
    // অ্যাডমিন লগইন পারসিস্টেন্স কুকিজ/স্টোরেজ চেক
    const savedAdmin = localStorage.getItem('bike_admin_logged');
    if (savedAdmin === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ADMIN_USER = 'admin@bikeapp.com';
    const ADMIN_PASS = 'admin12345';

    if (adminEmail === ADMIN_USER && adminPassword === ADMIN_PASS) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('bike_admin_logged', 'true');
      alert('✅ সফলভাবে অ্যাডমিন প্যানেলে প্রবেশ করেছেন!');
    } else {
      alert('❌ ভুল ইউজার আইডি বা পাসওয়ার্ড!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('bike_admin_logged');
  };

  // একাধিক গ্রাহক এবং তাদের পারসিস্টেন্ট ডাটা ফেচ করার লজিক (সুপাবেস সোশ্যাল ইউজার সিঙ্ক সহ)
  const fetchUsersForAdmin = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const authUser = session.user;
        const userEmail = authUser.email;
        const realName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || userEmail?.split('@')[0] || 'গ্রাহক';
        
        const socialUserData = {
          id: authUser.id,
          name: realName,
          email: userEmail,
          phone: authUser.phone || 'N/A',
          isNameVerified: false,
          isGoogleLinked: true,
          odometer: 0
        };

        const existingUsers = JSON.parse(localStorage.getItem('bike_app_users_list') || '[]');
        const isExist = existingUsers.find((u: any) => u.email === userEmail);
        if (!isExist) {
          existingUsers.push(socialUserData);
          localStorage.setItem('bike_app_users_list', JSON.stringify(existingUsers));
        }
      }

      const allUsersJson = localStorage.getItem('bike_app_users_list');
      const savedSavings = localStorage.getItem('bike_savings_entries_list');
      const savedExpense = localStorage.getItem('bike_expense_entries_list');
      const savedOdo = localStorage.getItem('bike_current_odo');

      let parsedUsers = [];
      if (allUsersJson) {
        try { parsedUsers = JSON.parse(allUsersJson); } catch (e) {}
      } else {
        const singleUser = localStorage.getItem('bike_app_user');
        if (singleUser) {
          try { parsedUsers = [JSON.parse(singleUser)]; } catch (e) {}
        }
      }

      const savingsList = savedSavings ? JSON.parse(savedSavings) : [];
      const expenseList = savedExpense ? JSON.parse(savedExpense) : [];

      const totalS = savingsList.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const totalC = expenseList.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

      const formattedUsers = parsedUsers.map((parsed: any) => {
        const realName = parsed.name || parsed.user_metadata?.full_name || parsed.user_metadata?.name || parsed.email?.split('@')[0] || 'গ্রাহক';
        return {
          ...parsed,
          name: realName,
          totalCost: totalC,
          totalSavings: totalS,
          odometer: savedOdo ? Number(savedOdo) : (parsed.odometer || 0),
          savingsEntries: savingsList,
          expenseEntries: expenseList
        };
      });

      setUsersList(formattedUsers);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchUsersForAdmin();
    }
  }, [isAdminLoggedIn]);

  const filteredUsers = useMemo(() => {
    if (!searchPhone) return usersList;
    return usersList.filter(u => 
      (u.phone && u.phone.includes(searchPhone)) || 
      (u.name && u.name.toLowerCase().includes(searchPhone.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchPhone.toLowerCase()))
    );
  }, [usersList, searchPhone]);

  const handleVerifyBadge = async (userEmail: string) => {
    const updatedList = usersList.map(u => {
      if (u.email === userEmail) {
        return { ...u, isNameVerified: true, verificationStatus: 'verified' };
      }
      return u;
    });
    setUsersList(updatedList);
    localStorage.setItem('bike_app_users_list', JSON.stringify(updatedList));
    if (updatedList.length > 0) {
      localStorage.setItem('bike_app_user', JSON.stringify(updatedList[0]));
    }
    alert('✅ সফলভাবে কাস্টমারকে ভেরিফাই করা হয়েছে!');
  };

  // 🚀 ইউজার চিরতরে ডিলিট করার হ্যান্ডলার ফাংশন
  const handleDeleteUserCompletely = async (userEmail: string, userId?: string) => {
    if (!confirm(`⚠️ আপনি কি নিশ্চিতভাবে ইউজার (${userEmail}) কে সিস্টেম থেকে চিরতরে ডিলিট করতে চান?`)) {
      return;
    }

    try {
      // ১. লোকাল স্টোরেজ থেকে ইউজারের ডেটা রিমুভ করা
      const existingUsers = JSON.parse(localStorage.getItem('bike_app_users_list') || '[]');
      const filtered = existingUsers.filter((u: any) => u.email !== userEmail);
      localStorage.setItem('bike_app_users_list', JSON.stringify(filtered));

      const singleUser = localStorage.getItem('bike_app_user');
      if (singleUser) {
        try {
          const parsedSingle = JSON.parse(singleUser);
          if (parsedSingle.email === userEmail) {
            localStorage.removeItem('bike_app_user');
          }
        } catch (e) {}
      }

      // ২. সুপাবেস ডাটাবেজের প্রোফাইল টেবিল থেকে ডিলিট করা (যদি id থাকে)
      if (userId) {
        await supabase.from('profiles').delete().eq('id', userId);
      } else {
        await supabase.from('profiles').delete().eq('email', userEmail);
      }

      // স্টেট আপডেট করা
      setUsersList(usersList.filter(u => u.email !== userEmail));
      alert(`✅ ইউজার (${userEmail}) সফলভাবে সিস্টেম থেকে পুরোপুরি ডিলিট করা হয়েছে!`);
    } catch (err: any) {
      alert('❌ ডিলিট করার সময় সমস্যা হয়েছে: ' + err.message);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-lg font-extrabold text-white">অ্যাডমিন সিকিউরিটি লগইন</h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-bold">অ্যাডমিন আইডি / ইমেইল:</label>
              <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@bikeapp.com" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-bold">পাসওয়ার্ড:</label>
              <input type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="********" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition cursor-pointer">প্রবেশ করুন</button>
          </form>
          <div className="text-center"><a href="/" className="text-xs text-sky-400 hover:underline font-bold">← হোমপেজে ফিরে যান</a></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-white">🛠️ অ্যাডমিন কন্ট্রোল ও ম্যানেজমেন্ট প্যানেল</h1>
            <p className="text-xs text-slate-400">ইউজার ট্র্যাকিং এবং বিআরটিএ ভেরিফিকেশন</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleAdminLogout} className="bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">লগআউট</button>
          </div>
        </div>

        {/* ফুয়েল প্রাইস কনফিগারেশন প্যানেল */}
        <AdminFuelPricePanel />

        {/* ইউজার ম্যানেজমেন্ট টেবিল কম্পোনেন্ট */}
        <div className="space-y-4">
          <UserManagementTable 
            filteredUsers={filteredUsers}
            searchPhone={searchPhone}
            setSearchPhone={setSearchPhone}
            setViewingUserProfile={setViewingUserProfile}
            {...({} as any)}
          />

          {/* 🚀 অতিরিক্ত ইউজার ডিলিট অ্যাকশন সেকশন */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
              <span>🗑️</span> ইউজার পার্মানেন্ট ডিলিট ম্যানেজমেন্ট
            </h3>
            <p className="text-[11px] text-slate-400">নিচের তালিকা থেকে যেকোনো ইউজারকে সরাসরি সিস্টেম থেকে চিরতরে ডিলিট করতে পারবেন:</p>
            
            <div className="space-y-2">
              {usersList.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">কোনো ইউজার পাওয়া যায়নি।</p>
              ) : (
                usersList.map((usr, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="font-bold text-white block">{usr.name || 'নাম নেই'}</span>
                      <span className="text-[10px] text-slate-400">{usr.email} | ফোন: {usr.phone || 'N/A'}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteUserCompletely(usr.email, usr.id)}
                      className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold px-3 py-1.5 rounded-xl transition shadow cursor-pointer text-[11px]"
                    >
                      🗑️ চিরতরে ডিলিট করুন
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ⚙️ অংশ ১: বাইক ও মডেল কনফিগারেশন প্যানেল */}
        <AdminBikeModelPanel selectedUser={usersList[0]} />

        {/* 🔧 অংশ ২: পার্টস লাইফস্প্যান মাস্টার কনফিগারেশন প্যানেল */}
        <AdminLifespanMasterPanel />

        {/* বিআরটিএ তথ্য ও ভেরিফিকেশন প্যানেল */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
              <span>🚗</span> বিআরটিএ তথ্য ও ভেরিফিকেশন প্যানেল
            </h3>
          </div>

          <div className="space-y-3">
            {usersList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">কোনো বিআরটিএ সাবমিশন নেই।</p>
            ) : (
              usersList.map((usr, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{usr.name}</span>
                      {usr.isNameVerified && <span className="text-emerald-400 font-bold">✅ Verified</span>}
                    </div>
                    <p className="text-slate-400">🏍️ প্লেট নম্বর: <b className="text-sky-300">{usr.bikePlate || 'দেওয়া হয়নি'}</b></p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {usr.vehicleImages && (
                      <button onClick={() => setSelectedUserImages(usr.vehicleImages)} className="bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 font-bold px-3 py-2 rounded-xl cursor-pointer">🖼️ ৪ কোণের ছবি</button>
                    )}
                    {!usr.isNameVerified ? (
                      <button onClick={() => handleVerifyBadge(usr.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl cursor-pointer">✓ ভেরিফাই দিন</button>
                    ) : (
                      <button disabled className="bg-slate-800 text-emerald-400 font-bold px-4 py-2 rounded-xl">✓ ভেরিফাইয়েড</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ইউজার ড্যাশবোর্ড ওভারভিউ মোডাল কম্পোনেন্ট */}
        <UserDashboardModal 
          viewingUserProfile={viewingUserProfile}
          setViewingUserProfile={setViewingUserProfile}
        />

      </div>
    </main>
  );
}