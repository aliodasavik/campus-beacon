// Client/src/services/api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// We keep your old header logic, but add the Bearer token for the new secure middleware
export const setAuthHeaders = (email, token) => {
  if (email) API.defaults.headers.common['x-user-email'] = email;
  if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const signupUser = (data) => API.post('/auth/signup', data);
export const verifyOtp = (data) => API.post('/auth/verify-otp', data);
export const loginUser = (data) => API.post('/auth/login', data);

export default API;

// Add these two exports at the bottom of api.js
export const updateProfile = (data) => API.put('/auth/update', data);
export const deleteAccount = () => API.delete('/auth/delete');