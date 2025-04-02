import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// Define response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

// Create a configured instance of axios
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      // Handle session expiration
      if (error.response?.status === 401) {
        // Clear auth token if unauthorized
        Cookies.remove('token');

        // Redirect to login page if not already there
        if (typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export the API client instance
export const apiClient = createApiClient();

// Helper methods for API calls
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
    return response.data.data;
  },

  post: async <T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
    return response.data.data;
  },

  put: async <T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
    return response.data.data;
  },

  patch: async <T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config);
    return response.data.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
    return response.data.data;
  },
};
