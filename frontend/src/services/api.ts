import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
