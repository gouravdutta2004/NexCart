import api from './api';

const auditService = {
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/audit-logs?${query}`);
  },
};

export default auditService;
