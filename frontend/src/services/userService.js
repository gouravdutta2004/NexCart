import api from './api';

const userService = {
  // Get all users with filters and pagination
  getAllUsers: async (params = {}) => {
    return api.get('/users', { params });
  },

  // Get user details
  getUserById: async (id) => {
    return api.get(`/users/${id}`);
  },

  // Create user with specific role
  createUser: async (userData) => {
    return api.post('/users', userData);
  },

  // Update user profile / role
  updateUser: async (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  // Toggle active / inactive status
  toggleUserStatus: async (id) => {
    return api.patch(`/users/${id}/status`);
  },
};

export default userService;
