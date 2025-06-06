import axios from 'axios';
import api from './api';
import swalCustomize from './swalCustomize';
import { loadingProxy } from './loadingProxy';

let instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Thời gian chờ tối đa của 1 request
instance.defaults.timeout = 1000 * 60 * 10;

// Add a request interceptor
instance.interceptors.request.use(
    (config) => {
        loadingProxy.start();

        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        loadingProxy.stop();
        return Promise.reject(error);
    },
);

let refreshTokenPromise = null;

// Add a response interceptor
instance.interceptors.response.use(
    (response) => {
        loadingProxy.stop();
        return response?.data ?? response;
    },
    async (error) => {
        loadingProxy.stop();

        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }

        const originalRequest = error.config;
        if (error.response?.status === 410 && originalRequest) {
            if (!refreshTokenPromise) {
                const refreshToken = localStorage.getItem('refreshToken');
                refreshTokenPromise = api
                    .refreshToken(refreshToken)
                    .then((res) => {
                        const accessToken = res?.accessToken;
                        localStorage.setItem('accessToken', accessToken);
                        instance.defaults.headers.Authorization = `Bearer ${accessToken}`;
                    })
                    .catch((_error) => {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('userInfo');
                        window.location.href = '/';

                        return Promise.reject(_error);
                    })
                    .finally(() => {
                        refreshTokenPromise = null;
                    });
            }

            return refreshTokenPromise.then(() => {
                return instance(originalRequest);
            });
        }
        // Xử lý tập trung phần hiển thị thông báo lỗi trả về từ mọi API khác 401, 410
        if (error.response?.status !== 410) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: error.response?.data?.message || error?.message,
            });
        }

        return Promise.reject(error);
    },
);

export default instance;
