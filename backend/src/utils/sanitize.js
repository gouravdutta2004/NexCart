/**
 * NexCart Input Sanitization & Regex Safety Utilities
 */

/**
 * Escapes characters with special meaning in Regular Expressions.
 * Prevents ReDoS attacks and regex compilation crashes on user-supplied strings.
 *
 * @param {string} str - Raw input string
 * @returns {string} - Escaped string safe for RegExp
 */
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  escapeRegex,
};
