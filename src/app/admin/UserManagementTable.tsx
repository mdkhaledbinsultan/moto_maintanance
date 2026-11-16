'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import UserDashboardModal from './UserDashboardModal';

export default function UserManagementTable() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUserProfile, setViewingUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchAllRegisteredUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setUsersList(data);
        }
      } catch (err) {
        console.error('Error fetching users for admin:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRegisteredUsers();
  }, []);

  const handleUserClick = async (user: any) => {
    try {
      const { data: configData } = await supabase
        .from('user_bike_configurations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const enrichedUser = {
        ...user,
        bikeBrand: configData?.bike_brand || 'Yamaha',
        bikeCc: configData?.bike_cc || '155cc',
        bikeModel: configData?.bike_model || 'মডেল সেট করা হয়নি',
        partsList: configData?.parts_list || [],
        expenseEntries: [],
        savingsEntries: [],
        totalCost: 0,
        totalSavings: 0
      };

      setViewingUserProfile(enrichedUser);
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setViewingUserProfile({
        ...user,
        bikeBrand: 'Yamaha',
        bikeCc: '155cc',
        bikeModel: '',
        partsList: [],
        expenseEntries: [],
        savingsEntries: [],
        totalCost: 0,
        totalSavings: 0
      });
    }
  };

  // 🚀 ব্যাকএন্ড API-এর মাধ্যমে সুপাবেস অথ ও ডাটাবেজ থেকে পাকাপাকিভাবে ইউজার ডিলিট করার হ্যান্ডলার
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`⚠️ আপনি কি নিশ্চিতভাবে ইউজার (${userEmail || 'আইডি: ' + userId}) কে সিস্টেম থেকে চিরতরে ডিলিট করতে চান?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'ইউজার ডিলিট করতে সমস্যা হয়েছে।');
      }

      alert(`✅ ইউজার সফলভাবে সিস্টেম থেকে চিরতরে ডিলিট করা হয়েছে!`);
      
      // টেবিল লিস্ট থেকে ইউজার ফিল্টার করে রিমুভ করা
      setUsersList(usersList.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert('❌ ডিলিট ত্রুটি: ' + err.message);
    }
  };

  if (loading) return <div className="text-xs text-slate-400 p-4">ইউজার লিস্ট লোড হচ্ছে...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 text-xs text-slate-100">
      <h3 className="font-extrabold text-sky-400 text-sm">👥 নিবন্ধিত মোট ইউজারগণ ({usersList.length} জন)</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-3">নাম</th>
              <th className="p-3">ইমেল</th>
              <th className="p-3">ফোন নম্বর</th>
              <th className="p-3">যোগদানের তারিখ</th>
              <th className="p-3 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-500">কোনো ইউজার পাওয়া যায়নি।</td>
              </tr>
            ) : (
              usersList.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-950/50 transition">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleUserClick(u)}
                      className="font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <span>👤</span> {u.name || 'নাম নেই'}
                    </button>
                  </td>
                  <td className="p-3 text-slate-300">{u.email || 'N/A'}</td>
                  <td className="p-3 font-mono text-amber-400">{u.phone || 'সংযুক্ত নয়'}</td>
                  <td className="p-3 font-mono text-slate-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : 'N/A'}
                  </td>
                  
                  {/* ডিলিট বাটন কলাম */}
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold px-3 py-1.5 rounded-xl transition shadow cursor-pointer text-[11px]"
                    >
                      🗑️ ডিলিট
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserDashboardModal
        viewingUserProfile={viewingUserProfile}
        setViewingUserProfile={setViewingUserProfile}
      />
    </div>
  );
}