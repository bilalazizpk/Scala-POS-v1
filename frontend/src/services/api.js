import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Global Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a network error or 5xx from the server, log it robustly
    if (!error.response) {
      console.error("Network Error: Backend might be down.", error);
    } else if (error.response.status >= 500) {
      console.error("Server Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export const productService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get(`/products/search?query=${query}`)
};

export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/v1/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getTotalSales: () => api.get('/orders/total-sales'),
  addItem: (id, item) => api.post(`/orders/${id}/items`, item),
  addPayment: (id, data) => api.post(`/v1/orders/${id}/payments`, data),
};

export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

export const kitchenService = {
  getOrders: (station) => api.get(`/v1/kitchen/orders/${station}`),
  updateItemStatus: (itemId, status) => api.put(`/v1/kitchen/items/${itemId}/status`, { status })
};

export const accountingService = {
  getAccounts: () => api.get('/v1/accounting/accounts'),
  getLedger: () => api.get('/v1/accounting/ledger'),
  getPnl: () => api.get('/v1/accounting/pnl')
};

export const purchaseOrderService = {
  getAll: () => api.get('/v1/purchase-orders'),
  create: (data) => api.post('/v1/purchase-orders', data),
  receive: (id, data) => api.post(`/v1/purchase-orders/${id}/receive`, data)
};

export const appointmentService = {
  getAll: (date) => api.get('/v1/appointments', { params: date ? { date } : {} }),
  getById: (id) => api.get(`/v1/appointments/${id}`),
  create: (data) => api.post('/v1/appointments', data),
  update: (id, data) => api.put(`/v1/appointments/${id}`, data),
  updateStatus: (id, data) => api.put(`/v1/appointments/${id}/status`, data),
  delete: (id) => api.delete(`/v1/appointments/${id}`),
};

export const auditService = {
  getLogs: (params) => api.get('/v1/audit', { params }),
  getSummary: () => api.get('/v1/audit/summary'),
};

export const helpdeskService = {
  getAll: (params) => api.get('/v1/tickets', { params }),
  getById: (id) => api.get(`/v1/tickets/${id}`),
  create: (data) => api.post('/v1/tickets', data),
  updateStatus: (id, data) => api.put(`/v1/tickets/${id}/status`, data),
  addComment: (id, data) => api.post(`/v1/tickets/${id}/comments`, data),
  delete: (id) => api.delete(`/v1/tickets/${id}`),
};

export const supplyChainService = {
  // Suppliers
  getSuppliers: () => api.get('/v1/suppliers'),
  createSupplier: (data) => api.post('/v1/suppliers', data),
  updateSupplier: (id, data) => api.put(`/v1/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/v1/suppliers/${id}`),
  // Purchase Orders
  getPOs: (params) => api.get('/v1/purchase-orders', { params }),
  getPOById: (id) => api.get(`/v1/purchase-orders/${id}`),
  createPO: (data) => api.post('/v1/purchase-orders', data),
  updatePOStatus: (id, status) => api.put(`/v1/purchase-orders/${id}/status`, { status }),
};

export const projectService = {
  getAll: () => api.get('/v1/projects'),
  create: (data) => api.post('/v1/projects', data),
  updateStatus: (id, status) => api.put(`/v1/projects/${id}/status`, { status }),
  delete: (id) => api.delete(`/v1/projects/${id}`),
  createTask: (projectId, data) => api.post(`/v1/projects/${projectId}/tasks`, data),
  updateTaskStatus: (projectId, taskId, status) => api.put(`/v1/projects/${projectId}/tasks/${taskId}/status`, { status }),
  deleteTask: (projectId, taskId) => api.delete(`/v1/projects/${projectId}/tasks/${taskId}`),
};

export const documentService = {
  getAll: (params) => api.get('/v1/documents', { params }),
  upload: (formData) => api.post('/v1/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id) => api.get(`/v1/documents/${id}/download`, { responseType: 'blob' }),
  archive: (id) => api.patch(`/v1/documents/${id}/archive`),
  delete: (id) => api.delete(`/v1/documents/${id}`),
};

export const analyticsService = {
  getKPIs: (days = 30) => api.get('/v1/analytics/kpis', { params: { days } }),
  getSalesByDay: (days = 30) => api.get('/v1/analytics/sales-by-day', { params: { days } }),
  getTopProducts: (days = 30, limit = 10) => api.get('/v1/analytics/top-products', { params: { days, limit } }),
  getRevenueByCategory: (days = 30) => api.get('/v1/analytics/revenue-by-category', { params: { days } }),
  getRevenueByPayment: (days = 30) => api.get('/v1/analytics/revenue-by-payment', { params: { days } }),
  getOrdersTable: (days = 30, limit = 200) => api.get('/v1/analytics/orders-table', { params: { days, limit } }),
};

export const offlineSyncService = {
  pull: (from, deviceId) => api.get('/v1/sync/pull', { params: { from, deviceId } }),
  push: (logs) => api.post('/v1/sync/push', logs),
  getAdminLogs: (limit = 100) => api.get('/v1/sync/admin/logs', { params: { limit } }),
};

export const whatsappService = {
  getConversations: () => api.get('/v1/whatsapp/conversations'),
  getChatHistory: (phone) => api.get(`/v1/whatsapp/chat/${encodeURIComponent(phone)}`),
  sendMessage: (payload) => api.post('/v1/whatsapp/send', payload),
};

export const aiService = {
  draftHelpdeskResponse: (payload) => api.post('/v1/ai/helpdesk/draft', payload),
  askAnalytics: (payload) => api.post('/v1/ai/analytics/ask', payload),
};

export default api;
