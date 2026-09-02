/**
 * Reusable Frontend Validation Utilities for SBJain ItemTrace
 */

export {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_ITEM,
  validateImageFile,
  validateImageFiles
} from './imageOptimizer';

/**
 * Validate item report forms (Lost, Found, Edit)
 */
export function validateItemForm({
  title,
  category,
  location,
  dateOccurred,
  description,
  identifyingDetails
}) {
  const errors = {};

  // 1. Title
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) {
    errors.title = 'Title is required.';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters long.';
  } else if (trimmedTitle.length > 100) {
    errors.title = 'Title must not exceed 100 characters.';
  }

  // 2. Category
  if (!category || category === 'all' || category.trim() === '') {
    errors.category = 'Please select a valid category.';
  }

  // 3. Location
  const trimmedLocation = (location || '').trim();
  if (!trimmedLocation) {
    errors.location = 'Campus location is required.';
  } else if (trimmedLocation.length < 2) {
    errors.location = 'Location must be at least 2 characters long.';
  } else if (trimmedLocation.length > 100) {
    errors.location = 'Location must not exceed 100 characters.';
  }

  // 4. Date Occurred
  if (!dateOccurred) {
    errors.dateOccurred = 'Date is required.';
  } else {
    const dateObj = new Date(dateOccurred);
    if (isNaN(dateObj.getTime())) {
      errors.dateOccurred = 'Please provide a valid date.';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dateObj > today) {
        errors.dateOccurred = 'Date cannot be in the future.';
      }
    }
  }

  // 5. Description
  const trimmedDesc = (description || '').trim();
  if (!trimmedDesc) {
    errors.description = 'Description is required.';
  } else if (trimmedDesc.length < 5) {
    errors.description = 'Description must be at least 5 characters long.';
  } else if (trimmedDesc.length > 1000) {
    errors.description = 'Description must not exceed 1000 characters.';
  }

  // 6. Identifying Details (Optional)
  if (identifyingDetails && identifyingDetails.length > 500) {
    errors.identifyingDetails = 'Identifying details must not exceed 500 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate email address format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}
