import { supabase } from '../lib/supabase';
import { ITEM_STATUS, ITEM_TYPE } from '../constants/itemConstants';

export const adminService = {
  /**
   * 1. Get comprehensive aggregate metrics for the Admin Dashboard
   */
  async getDashboardStats() {
    try {
      const [
        usersRes,
        itemsRes,
        lostRes,
        foundRes,
        activeRes,
        claimedRes,
        returnedRes,
        closedRes,
        convRes,
        msgRes,
        emailLogsRes
      ] = await Promise.all([
        // Total Users
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        // Total Items
        supabase.from('items').select('*', { count: 'exact', head: true }),
        // Total Lost
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', ITEM_TYPE.LOST),
        // Total Found
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('type', ITEM_TYPE.FOUND),
        // Active Status
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', ITEM_STATUS.ACTIVE),
        // Claimed Status
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', ITEM_STATUS.CLAIMED),
        // Returned Status
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', ITEM_STATUS.RETURNED),
        // Closed Status
        supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', ITEM_STATUS.CLOSED),
        // Conversations
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        // Messages
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        // Email Logs
        supabase.from('email_logs').select('*', { count: 'exact', head: true })
      ]);

      const stats = {
        totalUsers: usersRes.count || 0,
        totalItems: itemsRes.count || 0,
        lostItems: lostRes.count || 0,
        foundItems: foundRes.count || 0,
        activeItems: activeRes.count || 0,
        claimedItems: claimedRes.count || 0,
        returnedItems: returnedRes.count || 0,
        closedItems: closedRes.count || 0,
        totalConversations: convRes.count || 0,
        totalMessages: msgRes.count || 0,
        totalEmailsDispatched: emailLogsRes.count || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error.message);
      return { data: null, error };
    }
  },

  /**
   * 2. Get all reports with full administrative filter and search capabilities
   */
  async getAdminReports({ type = 'all', status = 'all', search = '', limit = 50 }) {
    try {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search && search.trim() !== '') {
        const s = search.trim();
        query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,location.ilike.%${s}%,category.ilike.%${s}%`);
      }

      const { data: items, error } = await query;
      if (error) throw error;

      if (!items || items.length === 0) {
        return { data: [], error: null };
      }

      // Fetch reporter profiles
      const reportedByIds = [...new Set(items.map((i) => i.reported_by))];
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, profile_image, role')
        .in('id', reportedByIds);

      if (profError) throw profError;

      const profileMap = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      const combined = items.map((item) => ({
        ...item,
        reporter: profileMap[item.reported_by] || null
      }));

      return { data: combined, error: null };
    } catch (error) {
      console.error('Error fetching admin reports:', error.message);
      return { data: [], error };
    }
  },

  /**
   * 3. Get user directory with aggregated report statistics
   */
  async getAdminUsers() {
    try {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;

      if (!profiles || profiles.length === 0) {
        return { data: [], error: null };
      }

      // Fetch all items to calculate per-user item counts
      const { data: items } = await supabase
        .from('items')
        .select('id, reported_by, type, status');

      const countMap = {};
      (items || []).forEach((item) => {
        if (!countMap[item.reported_by]) {
          countMap[item.reported_by] = { total: 0, lost: 0, found: 0, active: 0 };
        }
        countMap[item.reported_by].total += 1;
        if (item.type === ITEM_TYPE.LOST) countMap[item.reported_by].lost += 1;
        if (item.type === ITEM_TYPE.FOUND) countMap[item.reported_by].found += 1;
        if (item.status === ITEM_STATUS.ACTIVE) countMap[item.reported_by].active += 1;
      });

      const enrichedUsers = profiles.map((p) => ({
        ...p,
        stats: countMap[p.id] || { total: 0, lost: 0, found: 0, active: 0 }
      }));

      return { data: enrichedUsers, error: null };
    } catch (error) {
      console.error('Error fetching admin users:', error.message);
      return { data: [], error };
    }
  },

  /**
   * 4. Get recent system activity combining items, messages, and email audit logs
   */
  async getRecentActivity(limit = 15) {
    try {
      const [itemsRes, logsRes] = await Promise.all([
        supabase
          .from('items')
          .select('id, title, type, status, created_at, reported_by')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('email_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
      ]);

      const activities = [];

      (itemsRes.data || []).forEach((item) => {
        activities.push({
          id: `item_${item.id}`,
          type: 'item_report',
          title: `New ${item.type.toUpperCase()} Item: "${item.title}"`,
          status: item.status,
          timestamp: item.created_at,
          link: `/items/${item.id}`
        });
      });

      (logsRes.data || []).forEach((log) => {
        activities.push({
          id: `log_${log.id}`,
          type: 'email_alert',
          title: `Email Alert (${log.alert_type}): ${log.recipient_email}`,
          status: log.status,
          timestamp: log.created_at,
          details: log.subject
        });
      });

      // Sort combined activities by newest first
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return { data: activities.slice(0, limit), error: null };
    } catch (error) {
      console.error('Error fetching recent activity:', error.message);
      return { data: [], error };
    }
  },

  /**
   * 5. Administrative report moderation: Close an inappropriate report
   */
  async adminCloseReport(itemId, reason = 'Closed by administrator') {
    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          status: ITEM_STATUS.CLOSED,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error admin closing report:', error.message);
      return { data: null, error };
    }
  }
};
