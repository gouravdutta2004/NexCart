const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const { parsePagination } = require('../utils/paginationHelper');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);

    const query = {};
    if (req.query.module) query.module = req.query.module;
    if (req.query.action) query.action = req.query.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return ApiResponse.success(res, {
      message: 'System audit logs retrieved',
      data: { logs },
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
