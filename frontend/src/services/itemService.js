import { supabase } from '../lib/supabase';
import { ITEM_STATUS } from '../constants/itemConstants';
import { storageService } from './storageService';
import { emailAlertService } from './emailAlertService';

const VALID_STATUSES = [
  ITEM_STATUS.ACTIVE,
  ITEM_STATUS.CLAIMED,
  ITEM_STATUS.RETURNED,
  ITEM_STATUS.CLOSED
];

export const itemService = {
  // Create a new lost/found item report
  async createItem(itemData) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User must be authenticated to report items.');
      }

      const { data, error } = await supabase
        .from('items')
        .insert({
          ...itemData,
          reported_by: session.user.id,
          status: ITEM_STATUS.ACTIVE,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error in createItem:', error.message);
      return { data: null, error };
    }
  },

  // Get active lost/found items sorted by newest first
  async getItems(type, limit = 10) {
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('status', ITEM_STATUS.ACTIVE)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      if (!items || items.length === 0) {
        return { data: [], error: null };
      }

      const reportedByIds = [
        ...new Set(items.map(item => item.reported_by))
      ];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_image')
        .in('id', reportedByIds);

      if (profilesError) throw profilesError;

      const profileMap = {};

      (profiles || []).forEach(p => {
        profileMap[p.id] = p;
      });

      const combined = items.map(item => ({
        ...item,
        reporter: profileMap[item.reported_by] || null
      }));

      return { data: combined, error: null };
    } catch (error) {
      console.error('Error in getItems:', error.message);
      return { data: null, error };
    }
  },

  // Get a single item by ID
  async getItemById(id) {
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!item) {
        return { data: null, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, profile_image')
        .eq('id', item.reported_by)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const combined = {
        ...item,
        reporter: profile || null
      };

      return { data: combined, error: null };
    } catch (error) {
      console.error('Error in getItemById:', error.message);
      return { data: null, error };
    }
  },

  // Update an existing item (owner only, active only)
  async updateItem(id, itemData) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User must be authenticated to update reports.');
      }

      const { data, error } = await supabase
        .from('items')
        .update({
          ...itemData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('reported_by', session.user.id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateItem:', error.message);
      return { data: null, error };
    }
  },

  // Update only an item's status (owner only with strict status validation)
  async updateItemStatus(id, status) {
    try {
      if (!VALID_STATUSES.includes(status)) {
        throw new Error(`Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}`);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User must be authenticated to update report status.');
      }

      const { data, error } = await supabase
        .from('items')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('reported_by', session.user.id)
        .select()
        .single();

      if (error) throw error;

      // Asynchronously send status confirmation email alert (Stage 16)
      if (status === ITEM_STATUS.CLAIMED || status === ITEM_STATUS.RETURNED) {
        (async () => {
          try {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('email, full_name, username')
              .eq('id', session.user.id)
              .maybeSingle();

            const recipientEmail = userProfile?.email || session.user.email;
            if (recipientEmail) {
              emailAlertService.sendStatusEmailAlert({
                recipientEmail,
                recipientName: userProfile?.full_name || userProfile?.username || 'Student',
                item: data,
                status
              });
            }
          } catch (statusEmailErr) {
            console.warn('[ItemService] Non-blocking status email alert dispatch error:', statusEmailErr.message);
          }
        })();
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateItemStatus:', error.message);
      return { data: null, error };
    }
  },

  // Delete an existing item (owner only)
  async deleteItem(id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User must be authenticated to delete reports.');
      }

      // 1. Fetch item to verify ownership and find image URL
      const { data: item, error: fetchErr } = await supabase
        .from('items')
        .select('id, image_url, reported_by')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      if (item.reported_by !== session.user.id) {
        throw new Error('You do not have permission to delete this report.');
      }

      const imageUrl = item?.image_url;

      // 2. Delete database item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
        .eq('reported_by', session.user.id);

      if (error) throw error;

      // 3. Delete from storage if image exists (non-blocking)
      if (imageUrl) {
        storageService.deleteImage(imageUrl).catch((storageErr) => {
          console.error('Non-blocking Storage cleanup failure during deletion:', storageErr.message);
        });
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteItem:', error.message);
      return { success: false, error };
    }
  },

  // Get all items reported by the current user
  async getMyItems() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('User must be authenticated to check own items.');
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('reported_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getMyItems:', error.message);
      return { data: [], error };
    }
  },

  // Search and filter active items with pagination
  async searchItems(filters, page = 0, limit = 20) {
    try {
      let query = supabase
        .from('items')
        .select('*', { count: 'exact' })
        .eq('status', ITEM_STATUS.ACTIVE);

      // Filter by type
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      // Filter by category
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Filter by location
      if (filters.location && filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }

      // Text search
      if (filters.search && filters.search.trim() !== '') {
        const searchVal = filters.search.trim();
        query = query.or(
          `title.ilike.%${searchVal}%,description.ilike.%${searchVal}%,identifying_details.ilike.%${searchVal}%`
        );
      }

      // Date ranges
      if (filters.dateRange && filters.dateRange !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today') {
          const todayStr = today.toISOString().split('T')[0];
          query = query.gte('date_occurred', todayStr);
        } else if (filters.dateRange === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
          query = query.gte('date_occurred', sevenDaysStr);
        } else if (filters.dateRange === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];
          query = query.gte('date_occurred', thirtyDaysStr);
        } else if (filters.dateRange === 'custom') {
          if (filters.customStartDate) {
            query = query.gte('date_occurred', filters.customStartDate);
          }
          if (filters.customEndDate) {
            query = query.lte('date_occurred', filters.customEndDate);
          }
        }
      }

      // Sorting
      const isAscending = filters.sort === 'oldest';
      query = query.order('created_at', { ascending: isAscending });

      // Pagination
      const from = page * limit;
      const to = (page + 1) * limit - 1;
      query = query.range(from, to);

      const { data: items, count, error } = await query;

      if (error) throw error;

      if (!items || items.length === 0) {
        return { data: [], count: 0, error: null };
      }

      // Fetch reporter profiles
      const reportedByIds = [...new Set(items.map(item => item.reported_by))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_image')
        .in('id', reportedByIds);

      if (profilesError) throw profilesError;

      const profileMap = {};
      (profiles || []).forEach(p => {
        profileMap[p.id] = p;
      });

      const combined = items.map(item => ({
        ...item,
        reporter: profileMap[item.reported_by] || null
      }));

      return { data: combined, count, error: null };
    } catch (error) {
      console.error('Error in searchItems:', error.message);
      return { data: null, count: 0, error };
    }
  }
};