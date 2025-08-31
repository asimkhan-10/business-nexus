import axios from 'axios';

// Prefer VITE_API_BASE, but also support old VITE_API_URL
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Debug log so you can confirm what’s baked into the Netlify build
console.log('API baseURL at runtime:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
