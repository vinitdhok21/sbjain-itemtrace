import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCheck,
    ArrowLeft,
    MessageCircle,
    Sparkles,
    Package,
    Info,
    RefreshCw
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loadingNotifications,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    } = useNotifications();

    const [markingAll, setMarkingAll] = useState(false);
    const [actionError, setActionError] = useState('');

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.is_read) {
                await markNotificationAsRead(notification.id);
            }

            if (notification.conversation_id) {
                navigate(`/chat/${notification.conversation_id}`);
                return;
            }

            if (notification.related_item_id) {
                navigate(`/items/${notification.related_item_id}`);
            }
        } catch (err) {
            console.error('Error handling notification click:', err.message);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAll(true);
        setActionError('');
        try {
            await markAllNotificationsAsRead();
        } catch (err) {
            console.error('Error marking all notifications as read:', err.message);
            setActionError('Failed to mark all notifications as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_message':
                return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'new_match':
                return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'item_update':
                return <Package className="w-5 h-5 text-amber-500" />;
            default:
                return <Info className="w-5 h-5 text-slate-500" />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (loadingNotifications && notifications.length === 0) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
                <RefreshCw className="w-7 h-7 text-primary-500 animate-spin" />
                <p className="mt-3 text-sm text-slate-500">
                    Loading notifications...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">

                <div className="flex items-center gap-3">
                    <Link
                        to="/dashboard"
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Notifications
                        </h1>

                        <p className="text-sm text-slate-500">
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                : 'You are all caught up!'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshNotifications}
                        disabled={loadingNotifications}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                        title="Refresh notifications"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingNotifications ? 'animate-spin' : ''}`} />
                    </button>

                    {notifications.length > 0 && unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={markingAll}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary-600 border border-primary-100 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {markingAll ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCheck className="w-4 h-4" />
                            )}
                            Mark all read
                        </button>
                    )}
                </div>

            </div>

            {/* Error Message */}
            {actionError && (
                <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex justify-between items-center">
                    <span>{actionError}</span>
                    <button
                        onClick={() => setActionError('')}
                        className="text-xs font-semibold underline ml-3"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Empty State */}
            {notifications.length === 0 && (
                <EmptyState
                    icon={Bell}
                    title="No notifications yet"
                    description="When something important happens with your reports or matches, you will see it here in real-time."
                    actionLabel="Browse Campus Reports"
                    actionLink="/items"
                />
            )}

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.map((notification) => (
                    <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-sm ${notification.is_read
                            ? 'bg-white border-slate-100'
                            : 'bg-primary-50/40 border-primary-100'
                            }`}
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-semibold text-sm text-slate-800">
                                        {notification.title}
                                    </h3>

                                    {!notification.is_read && (
                                        <span className="w-2 h-2 mt-1.5 shrink-0 bg-primary-500 rounded-full" />
                                    )}
                                </div>

                                {notification.message && (
                                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                                        {notification.message}
                                    </p>
                                )}

                                <p className="mt-2 text-xs text-slate-400">
                                    {formatDate(notification.created_at)}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

        </div>
    );
}