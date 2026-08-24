import axios from 'axios';
import { startRequest, endRequest } from './loadingStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Attach JWT to every request automatically (FR1 session handling), and mark
// the request as "in flight" so the global SkillSwap loader (GlobalApiLoader)
// knows to show itself.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    startRequest();
    return config;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    endRequest();
    return response;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);

export default api;
