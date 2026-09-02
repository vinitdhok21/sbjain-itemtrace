/**
 * Client-Side Image Optimizer and Validation Utility
 * Optimizes images to save Supabase Free Tier storage and bandwidth.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB per image
export const MAX_IMAGES_PER_ITEM = 2; // Up to 2 images per report

/**
 * Validate a single image file for size and type
 * @param {File} file 
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { isValid: true, error: null };
  }

  // Verify mime type
  const isTypeValid = ALLOWED_IMAGE_TYPES.includes(file.type?.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isTypeValid) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP images only.'
    };
  }

  // Verify file size (<= 2 MB)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `"${file.name}" is ${sizeInMb} MB. Maximum allowed size is 2 MB per image.`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate an array of image files against count and individual constraints
 * @param {File[]} newFiles 
 * @param {number} currentCount 
 * @param {number} maxAllowed 
 * @returns {{ isValid: boolean, error: string|null, validFiles: File[] }}
 */
export function validateImageFiles(newFiles, currentCount = 0, maxAllowed = MAX_IMAGES_PER_ITEM) {
  if (!newFiles || newFiles.length === 0) {
    return { isValid: true, error: null, validFiles: [] };
  }

  if (currentCount + newFiles.length > maxAllowed) {
    return {
      isValid: false,
      error: `You can upload a maximum of ${maxAllowed} images per item (${currentCount} already selected).`,
      validFiles: []
    };
  }

  for (const file of newFiles) {
    const check = validateImageFile(file);
    if (!check.isValid) {
      return { isValid: false, error: check.error, validFiles: [] };
    }
  }

  return { isValid: true, error: null, validFiles: newFiles };
}

/**
 * Optimizes an image client-side before uploading:
 * - Resizes image if dimension exceeds maxDimension (1600px) while maintaining aspect ratio
 * - Compresses image with high visual fidelity (quality ~0.82)
 * - Ensures optimized output is never larger than the original file
 * - Safely falls back to original file if canvas processing is unavailable
 * 
 * @param {File} file 
 * @param {object} options
 * @returns {Promise<File>}
 */
export async function optimizeImage(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  // If not a valid image file, return original
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Check if resizing is necessary
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            return resolve(file);
          }

          // Fill white background for transparent PNG conversion to avoid black artifacts
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Determine optimal export format
          const exportType = 'image/webp';

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);

              if (!blob) {
                return resolve(file);
              }

              // Never return an optimized image if it's larger than the original
              if (blob.size >= file.size) {
                return resolve(file);
              }

              // Create optimized File object
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const optimizedFile = new File([blob], `${baseName}.webp`, {
                type: exportType,
                lastModified: Date.now()
              });

              resolve(optimizedFile);
            },
            exportType,
            quality
          );
        } catch (canvasErr) {
          console.warn('[ImageOptimizer] Canvas compression failed, falling back to original:', canvasErr.message);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve(file);
        }
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('[ImageOptimizer] Initialization error, using original file:', err.message);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(file);
    }
  });
}

/**
 * Optimizes an array of files in parallel
 * @param {File[]} files 
 * @returns {Promise<File[]>}
 */
export async function optimizeMultipleImages(files) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => optimizeImage(file)));
}
