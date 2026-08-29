import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import {
  Users,
  Search,
  User,
  Shield,
  ShieldCheck,
  Calendar,
  Package,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await adminService.getAdminUsers();
      if (err) throw err;
      setUsers(data || []);
    } catch (e) {
      console.error('Error fetching admin users:', e.message);
      setError(e.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(s)) ||
      (u.username && u.username.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
  });

  return (
    <AdminLayout
      title="User Directory & Accounts"
      subtitle="Monitor registered SB Jain collegiate accounts, roles, and engagement activity."
    >
      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-xs mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students by full name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
          />
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 font-bold mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadUsers} className="underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Loading student directory...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-white p-8">
          <h3 className="font-bold text-slate-700 text-base">No students found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        /* USERS TABLE */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Student / Profile</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5 text-center">Reports Activity</th>
                  <th className="py-3.5 px-5">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {filteredUsers.map((user) => {
                  const isAdminUser = user.role === 'admin' || user.email === 'dhokvinit@gmail.com';
                  const registeredDate = user.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {user.profile_image ? (
                              <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="font-bold text-slate-900 truncate">
                              {user.full_name || 'Anonymous Student'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold truncate">
                              @{user.username || 'user'} &bull; {user.email || 'No email attached'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isAdminUser
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isAdminUser ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {isAdminUser ? 'Admin' : 'Student'}
                        </span>
                      </td>

                      {/* Activity stats */}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold">
                          <span className="text-slate-900">{user.stats?.total || 0} Total</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-rose-600">{user.stats?.lost || 0} Lost</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-emerald-600">{user.stats?.found || 0} Found</span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-5 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{registeredDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
