import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { matchingService } from '../services/matchingService';
import { ITEM_STATUS, ITEM_TYPE } from '../constants/itemConstants';
import { getItemImageUrls } from '../utils/imageUtils';
import MatchCard from '../components/MatchCard';
import ConfirmationModal from '../components/ConfirmationModal';
import PageLoader from '../components/PageLoader';
import ErrorState from '../components/ErrorState';
import ImageWithFallback from '../components/ImageWithFallback';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Image,
  AlertCircle,
  Sparkles,
  Box,
  RefreshCw,
  User,
  CheckCircle2,
  Tag,
  FileText
} from 'lucide-react';

export default function ItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // States for matching items
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // States for confirmation modal status transition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalTheme, setModalTheme] = useState('primary');
  const [modalConfirmText, setModalConfirmText] = useState('Confirm');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const loadItemAndMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await itemService.getItemById(id);
        if (fetchError) throw fetchError;
        setItem(data);

        if (data && data.status === ITEM_STATUS.ACTIVE) {
          setLoadingMatches(true);
          const { data: matchData, error: matchError } = await matchingService.findMatchesForItem(data);
          if (matchError) throw matchError;
          setMatches(matchData || []);
        } else {
          setMatches([]);
        }
      } catch (err) {
        console.error('Error fetching item and matches details:', err.message);
        setError(err.message || 'Could not load item details.');
      } finally {
        setLoading(false);
        setLoadingMatches(false);
      }
    };

    if (id) {
      loadItemAndMatches();
    }
  }, [id]);

  const handleStatusClick = (status) => {
    let title = '';
    let message = '';
    let theme = 'primary';
    let confirmText = 'Update Status';

    switch (status) {
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

    setPendingStatus(status);
    setModalTitle(title);
    setModalMessage(message);
    setModalTheme(theme);
    setModalConfirmText(confirmText);
    setIsModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    setUpdatingStatus(true);
    try {
      const { data, error: updateError } = await itemService.updateItemStatus(item.id, pendingStatus);
      if (updateError) throw updateError;

      // Update item in state
      setItem((prev) => ({
        ...prev,
        status: data.status,
        updated_at: data.updated_at
      }));

      showToast(`Report marked as ${data.status}.`);
      setIsModalOpen(false);

      // Reload matches if reactivated to active status, otherwise clear
      if (data.status === ITEM_STATUS.ACTIVE) {
        setLoadingMatches(true);
        const { data: matchData } = await matchingService.findMatchesForItem(data);
        setMatches(matchData || []);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error('Error changing item status:', err.message);
      showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
      setLoadingMatches(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading report details..." />;
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Report Not Found"
          message={error || 'The report you are trying to view does not exist or you do not have permission to view it.'}
          onRetry={() => navigate('/dashboard')}
          retryLabel="Back to Dashboard"
        />
      </div>
    );
  }

  const isOwner = Boolean(currentUser && item && currentUser.id === item.reported_by);
  const isItemActive = item.status === ITEM_STATUS.ACTIVE;

  const dateFormatted = item.date_occurred
    ? new Date(item.date_occurred).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date not specified';

  const timeFormatted = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';

  const typeConfig = {
    lost: { color: 'bg-rose-50 border-rose-100 text-rose-600', label: 'Lost Item', oppLabel: 'found' },
    found: { color: 'bg-emerald-50 border-emerald-100 text-emerald-600', label: 'Found Item', oppLabel: 'lost' }
  };

  const statusConfig = {
    active: { color: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Active' },
    claimed: { color: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Claimed' },
    returned: { color: 'bg-purple-50 border-purple-200 text-purple-700', label: 'Returned' },
    closed: { color: 'bg-slate-100 border-slate-200 text-slate-600', label: 'Closed' }
  };

  const typeDetails = typeConfig[item.type] || typeConfig.lost;
  const statusDetails = statusConfig[item.status] || statusConfig.active;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-12 animate-[fadeIn_0.3s_ease-out]">
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

      {/* Back Link */}
      <div className="flex justify-start">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Inactive Report Notice Banner */}
      {!isItemActive && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 text-xs font-semibold shadow-3xs animate-[slideIn_0.3s_ease-out]">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900">
              Status: {formatStatus(item.status)} — Report No Longer Active
            </p>
            <p className="text-slate-600 leading-relaxed font-medium">
              This report is no longer active. Matching and new contact actions are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Image / Multi-Image Gallery */}
        {(() => {
          const imageUrls = getItemImageUrls(item);
          const currentDisplayUrl = imageUrls[selectedImageIndex] || imageUrls[0] || null;

          return (
            <div className="bg-slate-50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100 min-h-[300px]">
              <div className="relative w-full flex items-center justify-center min-h-[260px] max-h-[380px]">
                <ImageWithFallback
                  src={currentDisplayUrl}
                  alt={item.title}
                  className="w-full h-full max-h-[380px] object-contain rounded-2xl shadow-xs"
                  fallbackText="No image attached to this report"
                />

                {imageUrls.length > 1 && (
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg shadow-xs select-none">
                    {selectedImageIndex + 1} / {imageUrls.length}
                  </span>
                )}
              </div>

              {/* Multi-Image Thumbnail Switcher */}
              {imageUrls.length > 1 && (
                <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-200/60 w-full justify-center">
                  {imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-primary-500 shadow-sm scale-105 ring-2 ring-primary-200'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Right Side: Details Feed */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Status Pills */}
            <div className="flex gap-2">
              <span
                className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider select-none ${typeDetails.color}`}
              >
                {typeDetails.label}
              </span>
              <span
                className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider select-none ${statusDetails.color}`}
              >
                {statusDetails.label}
              </span>
            </div>

            {/* Title & Category */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{item.category}</span>
              <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight leading-tight">{item.title}</h2>
            </div>

            {/* Description */}
            <div className="space-y-1 pt-2">
              <h4 className="text-xs font-semibold text-slate-600">Description</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Location
                </span>
                <p className="text-xs font-semibold text-slate-700">{item.location || 'Campus'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Date
                </span>
                <p className="text-xs font-semibold text-slate-700">{dateFormatted}</p>
              </div>
            </div>

            {/* Identifying Details */}
            {item.identifying_details && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  Identifying Features
                </span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{item.identifying_details}</p>
              </div>
            )}

            {/* OWNER MANAGEMENT SECTION */}
            {isOwner && (
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Report Status Controls</span>
                  {isItemActive && (
                    <Link
                      to={`/edit-report/${item.id}`}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 underline"
                    >
                      Edit Report
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.status === ITEM_STATUS.ACTIVE && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.CLAIMED)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mark Claimed
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.RETURNED)}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mark Returned
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.CLOSED)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close Report
                      </button>
                    </>
                  )}

                  {item.status === ITEM_STATUS.CLAIMED && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.ACTIVE)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reactivate
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.RETURNED)}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Mark Returned
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusClick(ITEM_STATUS.CLOSED)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close Report
                      </button>
                    </>
                  )}

                  {item.status === ITEM_STATUS.RETURNED && (
                    <button
                      type="button"
                      onClick={() => handleStatusClick(ITEM_STATUS.CLOSED)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Close Report
                    </button>
                  )}

                  {item.status === ITEM_STATUS.CLOSED && (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      This report is closed. No further status changes available.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reporter details metadata banner */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs border border-slate-200">
                {item.reporter?.profile_image ? (
                  <img
                    src={item.reporter.profile_image}
                    alt={item.reporter.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-bold text-slate-700">{item.reporter?.full_name || 'Student'}</span>
                <span className="text-[9px] font-semibold text-slate-400">@{item.reporter?.username || 'user'}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold">Reported: {timeFormatted}</div>
          </div>
        </div>
      </div>

      {/* Possible Matches Container Section */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            Possible Matches
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Smart Similarity matching against active {typeDetails.oppLabel} campus reports.
          </p>
        </div>

        {loadingMatches ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 bg-slate-50/50 border border-slate-150 border-dashed rounded-3xl">
            <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Running similarity algorithms...
            </span>
          </div>
        ) : !isItemActive ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 border border-slate-100 rounded-3xl bg-slate-50/20">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <Box className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Matching Disabled</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              This report is currently {item.status}. Smart matches are only displayed for active reports.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 border border-slate-100 rounded-3xl bg-slate-50/20">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <Box className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">No possible matches found yet.</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              We'll update this panel if someone reports a matching {typeDetails.oppLabel} item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {matches.map((match, idx) => (
              <MatchCard key={idx} match={match} originalItem={item} />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        cancelText="Cancel"
        onConfirm={handleConfirmStatus}
        onCancel={() => {
          if (!updatingStatus) setIsModalOpen(false);
        }}
        theme={modalTheme}
        loading={updatingStatus}
      />
    </div>
  );
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
