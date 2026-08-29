import { supabase } from '../lib/supabase';

/**
 * Notification Service
 * Handles notification database operations and realtime listener configurations.
 */
export const notificationService = {
  /**
   * Get notifications for the currently logged-in user.
   */
  async getNotifications(limit = 50) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        return { data: null, error: userError };
      }

      const user = userData?.user;

      if (!user) {
        return {
          data: null,
          error: new Error('User is not authenticated.')
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          type,
          title,
          message,
          related_item_id,
          conversation_id,
          matched_item_id,
          is_read,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
      return { data: null, error: err };
    }
  },

  /**
   * Get unread notification count for the current user.
   */
  async getUnreadCount() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        return { count: 0, error: userError };
      }

      const user = userData?.user;

      if (!user) {
        return {
          count: 0,
          error: new Error('User is not authenticated.')
        };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      return {
        count: count || 0,
        error
      };
    } catch (err) {
      console.error('Error getting unread count:', err.message);
      return { count: 0, error: err };
    }
  },

  /**
   * Create a direct notification for the current user.
   */
  async createNotification({
    userId,
    type = 'general',
    title,
    message = null,
    relatedItemId = null,
    conversationId = null,
    matchedItemId = null
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_item_id: relatedItemId,
          conversation_id: conversationId,
          matched_item_id: matchedItemId,
          is_read: false
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Error creating notification:', err.message);
      return { data: null, error: err };
    }
  },

  /**
   * Securely create a deduplicated match notification via RPC.
   */
  async createMatchNotification({
    recipientUserId,
    newItemId,
    matchedItemId = null,
    title,
    message
  }) {
    try {
      const { data, error } = await supabase.rpc('create_match_notification', {
        p_recipient_user_id: recipientUserId,
        p_new_item_id: newItemId,
        p_matched_item_id: matchedItemId,
        p_title: title,
        p_message: message
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error invoking create_match_notification:', err.message);
      return { data: null, error: err };
    }
  },

  /**
   * Mark one notification as read.
   */
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('id', notificationId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
      return { data: null, error: err };
    }
  },

  /**
   * Mark all current user's notifications as read.
   */
  async markAllAsRead() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        return { data: null, error: userError };
      }

      const user = userData?.user;

      if (!user) {
        return {
          data: null,
          error: new Error('User is not authenticated.')
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select();

      return { data, error };
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
      return { data: null, error: err };
    }
  },

  /**
   * Realtime helper for subscribing to user notifications.
   * Centralized in NotificationContext.
   */
  subscribeToNotifications(userId, { onInsert, onUpdate, onDelete }) {
    if (!userId) {
      return () => {};
    }

    const channel = supabase
      .channel(`notifications-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (onInsert && payload.new) {
            onInsert(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (onUpdate && payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (onDelete && payload.old) {
            onDelete(payload.old);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};