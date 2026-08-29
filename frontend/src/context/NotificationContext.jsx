import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Compute unread count directly from state
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Refresh notifications list from database
  const refreshNotifications = useCallback(async () => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }

    setLoadingNotifications(true);
    try {
      const { data, error } = await notificationService.getNotifications();
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error refreshing notifications:', err.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, [currentUser?.id]);

  // Mark single notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );

    try {
      const { error } = await notificationService.markAsRead(notificationId);
      if (error) {
        console.error('Error marking notification read in DB:', error.message);
      }
    } catch (err) {
      console.error('Exception marking notification as read:', err.message);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true }))
    );

    try {
      const { error } = await notificationService.markAllAsRead();
      if (error) {
        console.error('Error marking all notifications read in DB:', error.message);
      }
    } catch (err) {
      console.error('Exception marking all notifications as read:', err.message);
    }
  }, []);

  // Centralized realtime subscription management
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }

    // Initial load
    refreshNotifications();

    // Setup single realtime channel
    const unsubscribe = notificationService.subscribeToNotifications(
      currentUser.id,
      {
        onInsert: (newNotification) => {
          setNotifications((prev) => {
            // Guard against duplicate notification entries in state
            if (prev.some((item) => item.id === newNotification.id)) {
              return prev;
            }
            return [newNotification, ...prev];
          });
        },
        onUpdate: (updatedNotification) => {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === updatedNotification.id ? updatedNotification : item
            )
          );
        },
        onDelete: (deletedNotification) => {
          setNotifications((prev) =>
            prev.filter((item) => item.id !== deletedNotification.id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, refreshNotifications]);

  const value = {
    notifications,
    unreadCount,
    loadingNotifications,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
