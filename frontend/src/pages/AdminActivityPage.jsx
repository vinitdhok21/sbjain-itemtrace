import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import {
  Activity,
  Package,
  Mail,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  CheckCircle2,
  Box
} from 'lucide-react';

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await adminService.getRecentActivity(30);
      if (err) throw err;
      setActivities(data || []);
    } catch (e) {
      console.error('Error loading admin activities:', e.message);
      setError(e.message || 'Failed to load system activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  return (
    <AdminLayout
      title="System Activity & Audit Logs"
      subtitle="Chronological feed of campus report submissions, email dispatches, and system actions."
    >
      {/* REFRESH BAR */}
      <div className="flex justify-end mb-4">
        <button
          onClick={loadActivities}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-3xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 font-bold mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadActivities} className="underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Loading activity log...
          </p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-white p-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
            <Box className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">No recent activity found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Activity entries will appear as students interact with ItemTrace.
          </p>
        </div>
      ) : (
        /* ACTIVITY FEED */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="divide-y divide-slate-100">
            {activities.map((act) => {
              const isItem = act.type === 'item_report';
              const timeString = new Date(act.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      isItem ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isItem ? <Package className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>

                  {/* Body */}
                  <div className="flex-grow space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeString}
                      </span>
                    </div>

                    {act.details && (
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{act.details}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {act.status && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                          Status: {act.status}
                        </span>
                      )}

                      {act.link && (
                        <Link
                          to={act.link}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 underline"
                        >
                          View Details
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
