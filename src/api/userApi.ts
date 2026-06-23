import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'https://product-selling-app-server.onrender.com';

const userApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/user`,
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default userApi;
