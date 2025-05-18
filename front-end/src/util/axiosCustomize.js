import axios from 'axios';
import api from './api';
import swalCustomize from './swalCustomize';

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add a request interceptor
instance.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    },
);

// Add a response interceptor
instance.interceptors.response.use(
    function (response) {
        return response?.data ?? response;
    },
    async function (error) {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If token refresh is in progress, add this request to the queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return instance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call your refresh token endpoint
                const response = await api.refreshToken(refreshToken);
                const { accessToken, refreshToken: newRefreshToken } =
                    response.data;

                // Update tokens in localStorage
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', newRefreshToken);

                // Update the failed request's authorization header
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Process any queued requests
                processQueue(null, accessToken);

                // Retry the original request
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle other errors
        if (error?.response?.data) {
            // Handle unauthorized access message
            if (
                error.response.status === 401 &&
                error.response.data.message ===
                    'Bạn không có quyền truy cập vào trang này'
            ) {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: 'Bạn không có quyền truy cập vào trang này',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });

                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);

                return Promise.reject(error.response.data);
            }
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    },
);

export default instance;
