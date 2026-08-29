import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import {
  Users,
  Package,
  CheckCircle2,
  Clock,
  MessageSquare,
  Mail,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Shield,
  Box
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await adminService.getDashboardStats();
      if (err) throw err;
      setStats(data);
    } catch (e) {
      console.error('Error loading admin stats:', e.message);
      setError(e.message || 'Failed to load system statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminLayout
      title="System Analytics & Monitoring"
      subtitle="Real-time collegiate statistics, trace performance, and communication activity."
    >
      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 font-bold mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadStats} className="underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Calculating campus metrics...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* PRIMARY METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total Students
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
              <p className="text-[11px] text-slate-400 font-medium">Registered SB Jain profiles</p>
            </div>

            {/* Total Reports */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Total Reports
                </span>
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.totalItems || 0}</p>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span className="text-rose-600">{stats?.lostItems || 0} Lost</span>
                <span>&bull;</span>
                <span className="text-emerald-600">{stats?.foundItems || 0} Found</span>
              </div>
            </div>

            {/* Active Traces */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Active Traces
                </span>
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-900">{stats?.activeItems || 0}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Currently open for matching</p>
            </div>

            {/* Resolved Reports */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-3xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Resolved / Claimed
                </span>
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-900">
                {(stats?.claimedItems || 0) + (stats?.returnedItems || 0)}
              </p>
              <p className="text-[11px] text-blue-700 font-medium">
                {stats?.claimedItems || 0} Claimed &bull; {stats?.returnedItems || 0} Returned
              </p>
            </div>
          </div>

          {/* SECONDARY LIFECYCLE & ENGAGEMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Report Lifecycle Breakdown
                </h3>
                <Link to="/admin/reports" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                  View All &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Active</span>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1">{stats?.activeItems || 0}</p>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Claimed</span>
                  <p className="text-2xl font-extrabold text-blue-800 mt-1">{stats?.claimedItems || 0}</p>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">Returned</span>
                  <p className="text-2xl font-extrabold text-purple-800 mt-1">{stats?.returnedItems || 0}</p>
                </div>

                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Closed</span>
                  <p className="text-2xl font-extrabold text-slate-700 mt-1">{stats?.closedItems || 0}</p>
                </div>
              </div>
            </div>

            {/* Communication & Audit Stats */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-500" />
                  Communication & System Activity
                </h3>
                <Link to="/admin/activity" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                  View Logs &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <MessageSquare className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                  <p className="text-xl font-extrabold text-slate-800">{stats?.totalConversations || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Conversations</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <MessageSquare className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xl font-extrabold text-slate-800">{stats?.totalMessages || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Messages</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <Mail className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                  <p className="text-xl font-extrabold text-slate-800">{stats?.totalEmailsDispatched || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email Alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
