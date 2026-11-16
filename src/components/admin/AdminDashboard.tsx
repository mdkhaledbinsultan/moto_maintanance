'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard({ adminUser }: { adminUser: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, verified, rejected, blocked
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [loading, setLoading] = useState(false);

  // ইউজারদের ডেটা ফেচ করা
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // অডিট লগ সেভ করার ফাংশন
  const logAuditAction = async (action: string, targetEmail: string, details: string) => {
    await supabase.from('audit_logs').insert([
      {
        admin_email: adminUser?.email || 'admin@system.com',
        action,
        target_user_email: targetEmail,
        details
      }
    ]);
  };

  // এসএমএস বা ইমেল নোটিফিকেশন পাঠানোর মক ফাংশন (BulkSMSBD বা Email API)
  const sendNotification = async (type: 'email' | 'sms', recipient: string, message: string) => {
    try {
      // এখানে আপনার ব্যাকএন্ড API Route বা BulkSMSBD API কল হবে
      console.log(`Sending ${type} to ${recipient}: ${message}`);
      // উদাহরণস্বরূপ: await fetch('/api/send-notification', { method: 'POST', body: JSON.stringify({ recipient, message }) });
    } catch (err) {
      console.error('Notification failed', err);
    }
  };

  // স্ট্যাটাস আপডেট হ্যান্ডলার (Approve, Reject, Block, Restore)
  const handleStatusUpdate = async (userId: string, email: string, newStatus: string, reason = '') => {
    const confirmMsg = `আপনি কি নিশ্চিতভাবে এই প্রোফাইলটি '${newStatus}' করতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updateData: any = { verification_status: newStatus };
      if (newStatus === 'rejected') updateData.rejection_reason = reason;
      if (newStatus === 'blocked') updateData.is_deleted = true; // রিসাইকেল বিনের জন্য সেফটি

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // অডিট লগ ও নোটিফিকেশন কল
      await logAuditAction(newStatus.toUpperCase(), email, reason ? `Reason: ${reason}` : 'Status changed');
      await sendNotification('email', email, `আপনার বাইক ট্র্যাকার অ্যাকাউন্টের স্ট্যাটাস পরিবর্তন করে '${newStatus}' করা হয়েছে। ${reason ? 'কারণ: ' + reason : ''}`);

      alert(`✅ সফলভাবে স্ট্যাটাস আপডেট করা হয়েছে!`);
      setSelectedUser(null);
      setFeedbackNote('');
      fetchUsers();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // ফিল্টার ও সার্চ লজিক
  const filteredUsers = users.filter((u) => {
    const matchesStatus = filterStatus === 'all' || u.verification_status === filterStatus;
    const matchesSearch = u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch && !u.is_deleted;
  });

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white">🛡️ অ্যাডমিন সিকিউরিটি ও ভেরিফিকেশন ড্যাশবোর্ড</h1>
          <p className="text-xs text-slate-400">ইউজার ম্যানেজমেন্ট, অডিট ট্রেইল এবং ড্রাইভ সিঙ্ক কন্ট্রোল</p>
        </div>

        {/* সার্চ বক্স */}
        <input
          type="text"
          placeholder="🔍 নাম, ইমেল বা মোবাইল দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white w-full md:w-72"
        />
      </div>

      {/* ব্যাচ বা লেভেল ভিত্তিক ফিল্টারিং ট্যাব */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
        {['all', 'pending', 'verified', 'rejected', 'blocked'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl font-bold capitalize transition ${filterStatus === status ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'}`}
          >
            {status === 'all' ? 'সকল প্রোফাইল' : status}
          </button>
        ))}
      </div>

      {/* ইউজার লিস্ট টেবিল */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">ইউজার ও কন্টাক্ট</th>
                <th className="p-3.5">সোশ্যাল অ্যাকাউন্টস</th>
                <th className="p-3.5">স্ট্যাটাস (ব্যাচ)</th>
                <th className="p-3.5 text-right">অ্যাকশন ও কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-slate-500">কোনো ইউজার পাওয়া যায়নি।</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 space-y-0.5">
                      <div className="font-bold text-white text-sm">{u.name || 'নামবিহীন'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{u.email} | {u.phone}</div>
                    </td>
                    <td className="p-3.5 space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${u.is_google_linked ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-800 text-slate-500'}`}>
                        Google {u.is_google_linked ? '✓' : '✗'}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ml-1 ${u.is_facebook_linked ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-500'}`}>
                        Facebook {u.is_facebook_linked ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        u.verification_status === 'verified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        u.verification_status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        u.verification_status === 'blocked' ? 'bg-red-950 text-red-500 border border-red-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {u.verification_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 px-3 py-1.5 rounded-lg font-bold"
                      >
                        🔍 রিভিউ & ফিডব্যাক
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(u.id, u.email, 'blocked')}
                        className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-lg font-bold"
                      >
                        🚫 ব্লক
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* রিভিউ এবং ফিডব্যাক বক্স মোডাল */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">প্রোফাইল রিভিউ: {selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p><b>ইমেল:</b> {selectedUser.email}</p>
              <p><b>মোবাইল:</b> {selectedUser.phone}</p>
              <p><b>গাড়ির প্লেট:</b> {selectedUser.bike_plate || 'নেই'}</p>
            </div>

            {/* ইন-অ্যাপ চ্যাট বা ফিডব্যাক বক্স */}
            <div className="space-y-1.5">
              <label className="text-amber-400 font-bold block">রিজেক্ট বা রি-ভেরিফিকেশনের কারণ (ফিডব্যাক নোট):</label>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="যেমন: ছবি ঝাপসা বা অস্পষ্ট, গাড়ি পরিষ্কার দেখা যাচ্ছে না..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white h-24"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.email, 'verified')}
                className="w-1/3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow"
              >
                ✓ এপ্রুভ (Verified)
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.email, 'rejected', feedbackNote)}
                className="w-1/3 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl shadow"
              >
                🔄 রিজেক্ট ও রি-ভিডিও চান
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedUser.id, selectedUser.email, 'blocked')}
                className="w-1/3 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl shadow"
              >
                🚫 ব্লক করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}