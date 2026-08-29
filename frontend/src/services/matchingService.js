import { supabase } from '../lib/supabase';
import { ITEM_TYPE, ITEM_STATUS } from '../constants/itemConstants';
import { notificationService } from './notificationService';
import { emailAlertService } from './emailAlertService';

// Weight configuration (must equal 100% total)
export const MATCH_WEIGHTS = {
  CATEGORY: 20,
  TITLE: 20,
  DESCRIPTION: 30,
  DETAILS: 15,
  LOCATION: 10,
  DATE: 5
};

export const MATCH_THRESHOLDS = {
  VISIBLE: 10, // Minimum score to display matches (adjusted to 10% for broader Collegiate visibility)
  POSSIBLE: 10,
  MODERATE: 40,
  GOOD: 60,
  STRONG: 75,
  VERY_STRONG: 90
};

export const matchingService = {
  // Normalize string: lowercase, remove punctuation, reduce spaces
  normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Calculate string similarity using Jaccard index
  calculateStringSimilarity(str1, str2) {
    const s1 = this.normalizeString(str1);
    const s2 = this.normalizeString(str2);

    if (!s1 || !s2) return 0;
    if (s1 === s2) return 100;

    const words1 = new Set(s1.split(' ').filter(w => w.length > 1));
    const words2 = new Set(s2.split(' ').filter(w => w.length > 1));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return Math.round((intersection.size / union.size) * 100);
  },

  // Calculate category match (binary: 100% or 0%)
  calculateCategoryMatch(category1, category2) {
    if (!category1 || !category2) return 0;
    return category1.toLowerCase().trim() === category2.toLowerCase().trim() ? 100 : 0;
  },

  // Calculate title similarity
  calculateTitleMatch(title1, title2) {
    return this.calculateStringSimilarity(title1, title2);
  },

  // Calculate description similarity
  calculateDescriptionMatch(desc1, desc2) {
    return this.calculateStringSimilarity(desc1, desc2);
  },

  // Calculate identifying details similarity
  calculateDetailsMatch(details1, details2) {
    if (!details1 || !details2) return 0;
    return this.calculateStringSimilarity(details1, details2);
  },

  // Calculate location match
  calculateLocationMatch(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    return loc1.toLowerCase().trim() === loc2.toLowerCase().trim() ? 100 : 0;
  },

  // Calculate date proximity score
  calculateDateMatch(date1, date2) {
    if (!date1 || !date2) return 0;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;

    const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 100;
    if (diffDays <= 1) return 90;
    if (diffDays <= 3) return 70;
    if (diffDays <= 7) return 50;
    if (diffDays <= 14) return 30;
    if (diffDays <= 30) return 15;
    return 0;
  },

  // Calculate overall composite match score
  calculateMatchScore(lostItem, foundItem) {
    const categoryScore = this.calculateCategoryMatch(lostItem.category, foundItem.category);
    if (categoryScore === 0) {
      return {
        score: 0,
        categoryScore: 0,
        titleScore: 0,
        descriptionScore: 0,
        detailsScore: 0,
        locationScore: 0,
        dateScore: 0,
        matchLevel: 'No Match'
      };
    }

    const titleScore = this.calculateTitleMatch(lostItem.title, foundItem.title);
    const descriptionScore = this.calculateDescriptionMatch(lostItem.description, foundItem.description);
    const detailsScore = this.calculateDetailsMatch(lostItem.identifying_details, foundItem.identifying_details);
    const locationScore = this.calculateLocationMatch(lostItem.location, foundItem.location);
    const dateScore = this.calculateDateMatch(lostItem.date_occurred, foundItem.date_occurred);

    const weightedScore = (
      (categoryScore * MATCH_WEIGHTS.CATEGORY) +
      (titleScore * MATCH_WEIGHTS.TITLE) +
      (descriptionScore * MATCH_WEIGHTS.DESCRIPTION) +
      (detailsScore * MATCH_WEIGHTS.DETAILS) +
      (locationScore * MATCH_WEIGHTS.LOCATION) +
      (dateScore * MATCH_WEIGHTS.DATE)
    ) / 100;

    const finalScore = Math.round(weightedScore);

    let matchLevel = 'Possible';
    if (finalScore >= MATCH_THRESHOLDS.VERY_STRONG) matchLevel = 'Very Strong';
    else if (finalScore >= MATCH_THRESHOLDS.STRONG) matchLevel = 'Strong';
    else if (finalScore >= MATCH_THRESHOLDS.GOOD) matchLevel = 'Good';
    else if (finalScore >= MATCH_THRESHOLDS.MODERATE) matchLevel = 'Moderate';

    return {
      score: finalScore,
      categoryScore,
      titleScore,
      descriptionScore,
      detailsScore,
      locationScore,
      dateScore,
      matchLevel
    };
  },

  // Find matches for a specific item
  async findMatchesForItem(item, threshold = MATCH_THRESHOLDS.VISIBLE) {
    try {
      if (!item || !item.id || !item.type) {
        return { data: [], error: null };
      }

      if (item.status !== ITEM_STATUS.ACTIVE) {
        return { data: [], error: null };
      }

      const targetType = item.type === ITEM_TYPE.LOST ? ITEM_TYPE.FOUND : ITEM_TYPE.LOST;

      const query = supabase
        .from('items')
        .select('*')
        .eq('type', targetType)
        .eq('status', ITEM_STATUS.ACTIVE);

      const { data: candidates, error } = await query;

      if (error) throw error;
      if (!candidates || candidates.length === 0) {
        return { data: [], error: null };
      }

      const reportedByIds = [...new Set(candidates.map(c => c.reported_by))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, profile_image')
        .in('id', reportedByIds);

      if (profilesError) throw profilesError;

      const profileMap = {};
      (profiles || []).forEach(p => {
        profileMap[p.id] = p;
      });

      const combinedCandidates = candidates.map(cand => ({
        ...cand,
        reporter: profileMap[cand.reported_by] || null
      }));

      const matches = combinedCandidates
        .map(cand => {
          const scoreResults = this.calculateMatchScore(item, cand);
          return {
            matchedItem: cand,
            ...scoreResults
          };
        })
        .filter(m => m.score >= threshold)
        .sort((a, b) => b.score - a.score);

      return { data: matches, error: null };
    } catch (error) {
      console.error('Error finding matches:', error.message);
      return { data: [], error };
    }
  },

  /**
   * Notify owners of opposing active items that strongly match a newly reported item.
   * Only matches with score >= MATCH_THRESHOLDS.STRONG (75%) trigger notifications.
   * Dispatches both in-app real-time notification and email alert (Stage 16).
   */
  async notifyMatchedItemOwners(newItem, matches = []) {
    if (!newItem || !matches || matches.length === 0) {
      return { totalChecked: 0, notifiedCount: 0, duplicateCount: 0, failedCount: 0 };
    }

    if (newItem.status !== ITEM_STATUS.ACTIVE) {
      return { totalChecked: 0, notifiedCount: 0, duplicateCount: 0, failedCount: 0 };
    }

    const strongMatches = matches.filter(
      (m) =>
        m.score >= MATCH_THRESHOLDS.STRONG &&
        m.matchedItem &&
        m.matchedItem.status === ITEM_STATUS.ACTIVE &&
        m.matchedItem.reported_by &&
        m.matchedItem.reported_by !== newItem.reported_by
    );

    if (strongMatches.length === 0) {
      return { totalChecked: 0, notifiedCount: 0, duplicateCount: 0, failedCount: 0 };
    }

    let notifiedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    const notificationPromises = strongMatches.map(async (match) => {
      try {
        const title = 'Potential Match Found!';
        const message = `A newly reported ${newItem.type} item "${newItem.title}" strongly matches your ${match.matchedItem.type} report "${match.matchedItem.title}" (${match.score}% match).`;

        // 1. In-app notification
        const { data, error } = await notificationService.createMatchNotification({
          recipientUserId: match.matchedItem.reported_by,
          newItemId: newItem.id,
          matchedItemId: match.matchedItem.id,
          title,
          message
        });

        if (error) {
          console.error('Failed to send match in-app notification:', error.message);
          failedCount++;
        } else if (data?.created) {
          notifiedCount++;
        } else if (data?.reason === 'duplicate_prevented') {
          duplicateCount++;
        }

        // 2. Stage 16 Email Alert (Non-blocking)
        if (match.matchedItem.reporter?.email) {
          emailAlertService.sendMatchEmailAlert({
            recipientEmail: match.matchedItem.reporter.email,
            recipientName: match.matchedItem.reporter.full_name || match.matchedItem.reporter.username,
            originalItem: match.matchedItem,
            matchedItem: newItem,
            matchScore: match.score
          });
        }
      } catch (err) {
        console.error('Exception dispatching match notification:', err.message);
        failedCount++;
      }
    });

    await Promise.allSettled(notificationPromises);

    return {
      totalChecked: strongMatches.length,
      notifiedCount,
      duplicateCount,
      failedCount
    };
  }
};
