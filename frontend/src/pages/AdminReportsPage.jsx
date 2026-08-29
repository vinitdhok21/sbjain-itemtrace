import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import { ITEM_STATUS, ITEM_TYPE } from '../constants/itemConstants';
import ConfirmationModal from '../components/ConfirmationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import {
  Package,
  Search,
  Filter,
  Eye,
  Slash,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  Box,
  CheckCircle2
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Filters with Debounced Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Modal State for Moderation (Closing Report)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    itemId: '',
    itemTitle: '',
    loading: false
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await adminService.getAdminReports({
        status: statusFilter,
        type: typeFilter,
        search: debouncedSearch
      });
      if (err) throw err;
      setReports(data || []);
    } catch (e) {
      console.error('Error fetching admin reports:', e.message);
      setError(getFriendlyErrorMessage(e, 'Failed to load reports.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, typeFilter, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  const handleCloseReportClick = (itemId, itemTitle) => {
    setModalConfig({
      isOpen: true,
      itemId,
      itemTitle,
      loading: false
    });
  };

  const handleConfirmClose = async () => {
    setModalConfig((prev) => ({ ...prev, loading: true }));
    try {
      const { data, error: closeErr } = await adminService.adminCloseReport(
        modalConfig.itemId,
        'Closed by administrative moderation'
      );
      if (closeErr) throw closeErr;

      setReports((prev) =>
        prev.map((r) => (r.id === modalConfig.itemId ? { ...r, status: ITEM_STATUS.CLOSED } : r))
      );

      showToast('Report successfully closed by administrator.');
      setModalConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
    } catch (err) {
      console.error('Error moderating report:', err.message);
      showToast(err.message || 'Failed to close report.', 'error');
      setModalConfig((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case ITEM_STATUS.ACTIVE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ITEM_STATUS.CLAIMED:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ITEM_STATUS.RETURNED:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case ITEM_STATUS.CLOSED:
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <AdminLayout
      title="Campus Reports Monitor"
      subtitle="Supervise all reported lost and found items across the SB Jain campus."
    >
      {/* TOAST ALERT */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-xs font-bold animate-[slideIn_0.2s_ease-out] ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title, category, location, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {['all', 'active', 'claimed', 'returned', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter(ITEM_TYPE.LOST)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                typeFilter === ITEM_TYPE.LOST ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-rose-600'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setTypeFilter(ITEM_TYPE.FOUND)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                typeFilter === ITEM_TYPE.FOUND ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-emerald-600'
              }`}
            >
              Found
            </button>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 font-bold mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadReports} className="underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="py-24">
          <LoadingSpinner size="medium" text="Loading administrative reports..." />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-white p-8 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-16 h-16 mx-auto mb-3 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
            <Box className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">No campus reports match your filters</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Try adjusting your search keywords or switching status filters.
          </p>
        </div>
      ) : (
        /* REPORTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="h-32 bg-slate-50 border border-slate-100/60 rounded-xl overflow-hidden flex items-center justify-center mb-3">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full"
                  />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      item.type === ITEM_TYPE.LOST
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Title & Desc */}
                <h4 className="font-bold text-slate-900 text-sm truncate">{item.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>

                {/* Meta details */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(item.date_occurred).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {item.reporter?.full_name || 'Student'} ({item.reporter?.email || 'N/A'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <Link
                  to={`/items/${item.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Link>

                {item.status !== ITEM_STATUS.CLOSED && (
                  <button
                    onClick={() => handleCloseReportClick(item.id, item.title)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                    title="Administrative Close"
                  >
                    <Slash className="w-3.5 h-3.5" />
                    Moderate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MODERATION */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title="Administratively Close Report?"
        message={`Are you sure you want to close "${modalConfig.itemTitle}"? This will disable matching and messaging.`}
        confirmText="Close Report"
        cancelText="Cancel"
        onConfirm={handleConfirmClose}
        onCancel={() => {
          if (!modalConfig.loading) setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        theme="rose"
        loading={modalConfig.loading}
      />
    </AdminLayout>
  );
}
