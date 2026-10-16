/**
 * Safely parses and bounds pagination query parameters (page, limit).
 * Prevents negative skip and memory-exhausting excessive limits.
 */
const parsePagination = (query = {}, defaultLimit = 20, maxLimit = 100) => {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = {
  parsePagination,
};
