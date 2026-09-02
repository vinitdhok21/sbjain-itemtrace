import { supabase } from '../lib/supabase';
import { getItemImageUrls } from '../utils/imageUtils';

export const storageService = {
  /**
   * Uploads a single image file to the 'item-images' bucket.
   * Path format: [user_id]/[random_id]_[timestamp].[ext]
   * 
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<{ publicUrl: string|null, filePath: string|null, error: Error|null }>}
   */
  async uploadImage(file, userId) {
    try {
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 year cache for static assets to reduce egress
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      return { publicUrl: urlData.publicUrl, filePath, error: null };
    } catch (error) {
      console.error('Error in uploadImage:', error.message);
      return { publicUrl: null, filePath: null, error };
    }
  },

  /**
   * Uploads multiple image files. If any upload fails, automatically cleans up
   * all previously uploaded files in that batch to prevent orphan files in Storage.
   * 
   * @param {File[]} files 
   * @param {string} userId 
   * @returns {Promise<{ publicUrls: string[], error: Error|null }>}
   */
  async uploadMultipleImages(files, userId) {
    if (!files || files.length === 0) {
      return { publicUrls: [], error: null };
    }

    const uploadedUrls = [];

    for (const file of files) {
      const { publicUrl, error } = await this.uploadImage(file, userId);
      if (error) {
        // Rollback already uploaded images from this batch to prevent orphans
        if (uploadedUrls.length > 0) {
          console.warn('[StorageService] Batch upload failed, rolling back uploaded images:', uploadedUrls);
          this.deleteMultipleImages(uploadedUrls).catch((cleanupErr) => {
            console.error('[StorageService] Rollback cleanup error:', cleanupErr.message);
          });
        }
        return { publicUrls: [], error };
      }
      uploadedUrls.push(publicUrl);
    }

    return { publicUrls: uploadedUrls, error: null };
  },

  /**
   * Deletes an image or multiple images from the 'item-images' bucket.
   * Handles single URL, array of URLs, or JSON array string.
   * 
   * @param {string|string[]} itemOrImageUrl 
   * @returns {Promise<{ success: boolean, error: Error|null }>}
   */
  async deleteImage(itemOrImageUrl) {
    if (!itemOrImageUrl) return { success: true, error: null };

    try {
      const urlsToDelete = Array.isArray(itemOrImageUrl)
        ? itemOrImageUrl
        : getItemImageUrls(itemOrImageUrl);

      if (urlsToDelete.length === 0) return { success: true, error: null };

      return this.deleteMultipleImages(urlsToDelete);
    } catch (error) {
      console.error('Error in deleteImage:', error.message);
      return { success: false, error };
    }
  },

  /**
   * Deletes an array of image URLs from the 'item-images' bucket in parallel.
   * 
   * @param {string[]} imageUrls 
   * @returns {Promise<{ success: boolean, error: Error|null }>}
   */
  async deleteMultipleImages(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return { success: true, error: null };

    try {
      const bucketSegment = 'object/public/item-images/';
      const relativePaths = [];

      for (const url of imageUrls) {
        if (!url || typeof url !== 'string') continue;
        const idx = url.indexOf(bucketSegment);
        if (idx !== -1) {
          relativePaths.push(url.substring(idx + bucketSegment.length));
        }
      }

      if (relativePaths.length === 0) {
        return { success: true, error: null };
      }

      const { error } = await supabase.storage
        .from('item-images')
        .remove(relativePaths);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteMultipleImages:', error.message);
      return { success: false, error };
    }
  }
};
