import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    MapPin,
    Calendar,
    Eye,
    Pencil,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Filter,
    ArrowUpDown,
    Check,
    Box
} from 'lucide-react';

import { itemService } from '../services/itemService';
import { ITEM_TYPE, ITEM_STATUS } from '../constants/itemConstants';
import ConfirmationModal from '../components/ConfirmationModal';
import ImageWithFallback from '../components/ImageWithFallback';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyReportsPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toastMessage, setToastMessage] = useState(null);

    // Filters and Sorting
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'claimed', 'returned', 'closed'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'lost', 'found'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

    // Confirmation Modal States (Status updates & Deletion)
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        actionType: '', // 'status' or 'delete'
        itemId: '',
        targetStatus: '',
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        theme: 'primary',
        loading: false
    });

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    };

    // Load user's reports
    const loadMyReports = async () => {
        setLoading(true);
        setError('');

        try {
            const { data, error: fetchError } = await itemService.getMyItems();
            if (fetchError) throw fetchError;
            setItems(data || []);
        } catch (err) {
            console.error('Error loading my reports:', err.message);
            setError(err.message || 'Failed to load your reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyReports();
    }, []);

    // Filter & Sort Logic
    const filteredItems = useMemo(() => {
        let list = [...items];

        // Status Filter
        if (statusFilter !== 'all') {
            list = list.filter((item) => item.status === statusFilter);
        }

        // Type Filter
        if (typeFilter !== 'all') {
            list = list.filter((item) => item.type === typeFilter);
        }

        // Sorting
        list.sort((a, b) => {
            const dateA = new Date(a.created_at || a.date_occurred).getTime();
            const dateB = new Date(b.created_at || b.date_occurred).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return list;
    }, [items, statusFilter, typeFilter, sortBy]);

    // Dynamic Counts
    const counts = useMemo(() => {
        return {
            total: items.length,
            lost: items.filter((i) => i.type === ITEM_TYPE.LOST).length,
            found: items.filter((i) => i.type === ITEM_TYPE.FOUND).length,
            active: items.filter((i) => i.status === ITEM_STATUS.ACTIVE).length,
            claimed: items.filter((i) => i.status === ITEM_STATUS.CLAIMED).length,
            returned: items.filter((i) => i.status === ITEM_STATUS.RETURNED).length,
            closed: items.filter((i) => i.status === ITEM_STATUS.CLOSED).length
        };
    }, [items]);

    // Open Status Transition Confirmation Dialog
    const handleStatusClick = (itemId, targetStatus) => {
        let title = '';
        let message = '';
        let theme = 'primary';
        let confirmText = 'Update Status';

        switch (targetStatus) {
            case ITEM_STATUS.CLAIMED:
                title = 'Mark report as Claimed?';
                message = 'This report will be marked as claimed and matching and messaging will be disabled.';
                theme = 'primary';
                confirmText = 'Mark Claimed';
                break;

            case ITEM_STATUS.RETURNED:
                title = 'Mark report as Returned?';
                message = 'This report will be marked as returned and matching and messaging will be disabled.';
                theme = 'emerald';
                confirmText = 'Mark Returned';
                break;

            case ITEM_STATUS.CLOSED:
                title = 'Close this Report?';
                message = 'This report will be closed and matching and messaging will be disabled.';
                theme = 'rose';
                confirmText = 'Close Report';
                break;

            case ITEM_STATUS.ACTIVE:
                title = 'Reactivate Report?';
                message = 'This will reopen the report and enable smart matching scans again.';
                theme = 'emerald';
                confirmText = 'Reactivate';
                break;

            default:
                title = 'Change Report Status?';
                message = 'Are you sure you want to update the status of this report?';
        }

        setModalConfig({
            isOpen: true,
            actionType: 'status',
            itemId,
            targetStatus,
            title,
            message,
            confirmText,
            cancelText: 'Cancel',
            theme,
            loading: false
        });
    };

    // Open Deletion Confirmation Dialog
    const handleDeleteClick = (itemId, itemTitle) => {
        setModalConfig({
            isOpen: true,
            actionType: 'delete',
            itemId,
            targetStatus: '',
            title: 'Delete Report Permanently?',
            message: `Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            cancelText: 'Keep Report',
            theme: 'rose',
            loading: false
        });
    };

    // Execute Modal Confirmation Action
    const handleModalConfirm = async () => {
        setModalConfig((prev) => ({ ...prev, loading: true }));

        if (modalConfig.actionType === 'status') {
            try {
                const { data, error: updateError } = await itemService.updateItemStatus(
                    modalConfig.itemId,
                    modalConfig.targetStatus
                );

                if (updateError) throw updateError;

                setItems((prev) =>
                    prev.map((item) =>
                        item.id === modalConfig.itemId
                            ? { ...item, status: data.status, updated_at: data.updated_at }
                            : item
                    )
                );

                showToast(`Report status updated to ${data.status}.`);
                setModalConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
            } catch (err) {
                console.error('Error updating status:', err.message);
                showToast(err.message || 'Failed to update report status.', 'error');
                setModalConfig((prev) => ({ ...prev, loading: false }));
            }
        } else if (modalConfig.actionType === 'delete') {
            try {
                const { error: deleteError } = await itemService.deleteItem(modalConfig.itemId);
                if (deleteError) throw deleteError;

                setItems((prev) => prev.filter((item) => item.id !== modalConfig.itemId));
                showToast('Report deleted successfully.');
                setModalConfig((prev) => ({ ...prev, isOpen: false, loading: false }));
            } catch (err) {
                console.error('Error deleting report:', err.message);
                showToast(err.message || 'Failed to delete report.', 'error');
                setModalConfig((prev) => ({ ...prev, loading: false }));
            }
        }
    };

    const getStatusStyle = (status) => {
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

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

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

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link
                        to="/dashboard"
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            My Reports
                        </h1>
                        <p className="text-sm text-slate-500">
                            Manage all your lost and found item reports and track their status.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadMyReports}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <Link
                        to="/report/lost"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
                    >
                        + New Report
                    </Link>
                </div>
            </div>

            {/* OVERVIEW STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
                        Total Reports
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800">
                        {counts.total}
                    </p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
                    <p className="text-xs uppercase font-bold tracking-wider text-emerald-700">
                        Active Reports
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-800">
                        {counts.active}
                    </p>
                </div>

                <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-5">
                    <p className="text-xs uppercase font-bold tracking-wider text-rose-600">
                        Lost Items
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-rose-700">
                        {counts.lost}
                    </p>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-600">
                        Claimed / Returned
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-blue-700">
                        {counts.claimed + counts.returned}
                    </p>
                </div>
            </div>

            {/* STATUS FILTER TABS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === 'all'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All ({counts.total})
                    </button>

                    <button
                        onClick={() => setStatusFilter(ITEM_STATUS.ACTIVE)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === ITEM_STATUS.ACTIVE
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                        Active ({counts.active})
                    </button>

                    <button
                        onClick={() => setStatusFilter(ITEM_STATUS.CLAIMED)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === ITEM_STATUS.CLAIMED
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                    >
                        Claimed ({counts.claimed})
                    </button>

                    <button
                        onClick={() => setStatusFilter(ITEM_STATUS.RETURNED)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === ITEM_STATUS.RETURNED
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                    >
                        Returned ({counts.returned})
                    </button>

                    <button
                        onClick={() => setStatusFilter(ITEM_STATUS.CLOSED)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === ITEM_STATUS.CLOSED
                                ? 'bg-slate-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Closed ({counts.closed})
                    </button>
                </div>

                {/* Sub-Filters: Type & Sort */}
                <div className="flex items-center gap-3">
                    {/* Type Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${
                                typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-800'
                            }`}
                        >
                            All Types
                        </button>
                        <button
                            onClick={() => setTypeFilter(ITEM_TYPE.LOST)}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${
                                typeFilter === ITEM_TYPE.LOST ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-rose-600'
                            }`}
                        >
                            Lost
                        </button>
                        <button
                            onClick={() => setTypeFilter(ITEM_TYPE.FOUND)}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${
                                typeFilter === ITEM_TYPE.FOUND ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-emerald-600'
                            }`}
                        >
                            Found
                        </button>
                    </div>

                    {/* Sort Selector */}
                    <button
                        onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                        title="Toggle sort order"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>{sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
                    </button>
                </div>

            </div>

            {/* ERROR NOTICE */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p>{error}</p>
                        <button onClick={loadMyReports} className="mt-2 font-semibold underline">
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className="py-20">
                    <LoadingSpinner size="medium" text="Loading your reports..." />
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && filteredItems.length === 0 && (
                <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl bg-white p-8 animate-[fadeIn_0.2s_ease-out]">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Box className="w-8 h-8 text-slate-300" aria-hidden="true" />
                    </div>

                    <h3 className="font-bold text-slate-700 text-lg">
                        {statusFilter === 'all' && typeFilter === 'all'
                            ? "You haven't reported any items yet."
                            : `No ${statusFilter !== 'all' ? statusFilter : ''} ${
                                  typeFilter !== 'all' ? typeFilter : ''
                              } reports found.`}
                    </h3>

                    <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        {statusFilter === 'all' && typeFilter === 'all'
                            ? 'Report lost or found items around campus to get started with automated trace matching.'
                            : 'Try adjusting your status or item type filters above.'}
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                        {statusFilter !== 'all' || typeFilter !== 'all' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                }}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        ) : (
                            <Link
                                to="/report/lost"
                                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                                Report an Item
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* REPORTS LIST */}
            {!loading && filteredItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredItems.map((item) => {
                        const isItemActive = item.status === ITEM_STATUS.ACTIVE;

                        return (
                            <div
                                key={item.id}
                                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* THUMBNAIL */}
                                    <div className="h-36 bg-slate-50 border border-slate-100/60 rounded-xl overflow-hidden flex items-center justify-center shrink-0 mb-4 relative">
                                        <ImageWithFallback
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* TOP BADGES & TITLE */}
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
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
                                                className={`px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider ${getStatusStyle(
                                                    item.status
                                                )}`}
                                            >
                                                {formatStatus(item.status)}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-800 text-lg truncate">
                                            {item.title}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* DETAILS */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">{item.location || 'Location not specified'}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{formatDate(item.date_occurred)}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{item.category}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTTOM ACTIONS & CONTROLS */}
                                <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                                    {/* STATUS UPDATE BUTTONS (Strict Lifecycle Transitions) */}
                                    {item.status !== ITEM_STATUS.CLOSED && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mr-1">
                                                Change:
                                            </span>

                                            {item.status === ITEM_STATUS.ACTIVE && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.CLAIMED)}
                                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Claimed
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.RETURNED)}
                                                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Returned
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.CLOSED)}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Close
                                                    </button>
                                                </>
                                            )}

                                            {item.status === ITEM_STATUS.CLAIMED && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.ACTIVE)}
                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Reactivate
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.RETURNED)}
                                                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Returned
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusClick(item.id, ITEM_STATUS.CLOSED)}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        Close
                                                    </button>
                                                </>
                                            )}

                                            {item.status === ITEM_STATUS.RETURNED && (
                                                <button
                                                    onClick={() => handleStatusClick(item.id, ITEM_STATUS.CLOSED)}
                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Close Report
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* ACTION BUTTONS (View, Edit, Delete) */}
                                    <div className="flex flex-wrap gap-2">
                                        {/* VIEW */}
                                        <button
                                            onClick={() => navigate(`/items/${item.id}`)}
                                            className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                                            View
                                        </button>

                                        {/* EDIT (Disabled for Inactive Items) */}
                                        <button
                                            onClick={() => {
                                                if (!isItemActive) return;
                                                navigate(`/edit-report/${item.id}`);
                                            }}
                                            disabled={!isItemActive}
                                            className="flex-1 min-w-[80px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 hover:bg-primary-100 disabled:opacity-40 disabled:hover:bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed"
                                            title={!isItemActive ? 'This report is inactive and cannot be edited.' : 'Edit Report'}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </button>

                                        {/* DELETE */}
                                        <button
                                            onClick={() => handleDeleteClick(item.id, item.title)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
                                            title="Delete Report"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* UNIFIED CONFIRMATION MODAL */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={handleModalConfirm}
                onCancel={() => {
                    if (!modalConfig.loading) {
                        setModalConfig((prev) => ({ ...prev, isOpen: false }));
                    }
                }}
                theme={modalConfig.theme}
                loading={modalConfig.loading}
            />
        </div>
    );
}