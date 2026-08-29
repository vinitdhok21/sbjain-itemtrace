import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Uploads an image file to the 'item-images' bucket.
   * Path format: [user_id]/[random_id]_[timestamp].[ext]
   * 
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<{ publicUrl: string|null, filePath: string|null, error: Error|null }>}
   */
  async uploadImage(file, userId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, {
          cacheControl: '3600',
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
   * Deletes an image file from the 'item-images' bucket.
   * Parses the relative path from the full public URL.
   * 
   * @param {string} imageUrl 
   * @returns {Promise<{ success: boolean, error: Error|null }>}
   */
  async deleteImage(imageUrl) {
    if (!imageUrl) return { success: true, error: null };
    try {
      const bucketSegment = 'object/public/item-images/';
      const idx = imageUrl.indexOf(bucketSegment);
      if (idx === -1) {
        // Not inside the item-images bucket or not a valid public URL format
        return { success: false, error: new Error('Invalid bucket path') };
      }
      
      const relativePath = imageUrl.substring(idx + bucketSegment.length);
      const { error } = await supabase.storage
        .from('item-images')
        .remove([relativePath]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteImage:', error.message);
      return { success: false, error };
    }
  }
};
