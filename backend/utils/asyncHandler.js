// backend/utils/asyncHandler.js

/**
 * Wraps async Express route handlers and forwards errors
 * to Express error middleware.
 *
 * Usage:
 * asyncHandler(async (req, res) => {
 *   // your async code
 * });
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Named export
export { asyncHandler };

// Default export
export default asyncHandler;