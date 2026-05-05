import API from './api';

const BASE = '/campus';

export const getNotificationPreferences = () => API.get(`${BASE}/notification-preferences`);
export const updateNotificationPreferences = (data) => API.put(`${BASE}/notification-preferences`, data);
export const sendTestNotification = (data = {}) => API.post(`${BASE}/notification-preferences/test`, data);
export const getNotificationDeliveryLogs = () => API.get(`${BASE}/notification-preferences/logs`);

export const getCampusZones = () => API.get(`${BASE}/locations/zones`);
export const createCampusZone = (data) => API.post(`${BASE}/locations/zones`, data);
export const getItemsByLocation = (params) => API.get(`${BASE}/locations/items`, { params });
export const getItemLocation = (itemId) => API.get(`${BASE}/locations/items/${itemId}`);
export const updateItemLocation = (itemId, data) => API.put(`${BASE}/locations/items/${itemId}`, data);

export const getAuditLogs = (params = {}) => API.get(`${BASE}/audit`, { params });
export const getItemAuditTrail = (itemId) => API.get(`${BASE}/audit/items/${itemId}`);
export const getClaimAuditTrail = (claimId) => API.get(`${BASE}/audit/claims/${claimId}`);
export const createAuditEntry = (data) => API.post(`${BASE}/audit`, data);

export const listSavedSearches = () => API.get(`${BASE}/saved-searches`);
export const createSavedSearch = (data) => API.post(`${BASE}/saved-searches`, data);
export const updateSavedSearch = (id, data) => API.put(`${BASE}/saved-searches/${id}`, data);
export const deleteSavedSearch = (id) => API.delete(`${BASE}/saved-searches/${id}`);
export const previewSavedSearchMatches = (id) => API.get(`${BASE}/saved-searches/${id}/matches`);
export const runSavedSearchAlertScan = () => API.post(`${BASE}/saved-searches/scan-alerts`);

export const listArchives = () => API.get(`${BASE}/archive`);
export const getArchiveState = (itemId) => API.get(`${BASE}/archive/items/${itemId}`);
export const archiveItem = (itemId, data = {}) => API.post(`${BASE}/archive/items/${itemId}/archive`, data);
export const extendItemRetention = (itemId, data) => API.put(`${BASE}/archive/items/${itemId}/extend`, data);
export const runArchiveJob = (data = {}) => API.post(`${BASE}/archive/run`, data);
