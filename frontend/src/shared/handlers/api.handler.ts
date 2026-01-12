import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = []

const processQueue = (error: unknown = null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        }
        else {
            prom.resolve(token);
        }
    })

    failedQueue = [];
}

api.interceptors.request.use(
    (config) => {
        // adding custom header before request is sent
        // config.headers["X-Request-ID"] = Math.random().toString(36).substring(7);
        // config.headers["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`;

        config.headers = addTokenToHeader(config.headers as AxiosRequestHeaders);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // ถ้าเป็น unlock endpoint และเป็น 401 ให้ throw error ทันที (ไม่ refresh token)
        if (originalRequest.url === '/auth/unlock' && error.response?.status === 401) {
            // ไม่ลบ token เพราะอาจเป็นแค่ password ผิด
            return Promise.reject(error);
        }


        // ถ้าเป็น 401 และยังไม่ได้ retry
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    originalRequest.headers = addTokenToHeader(originalRequest.headers as AxiosRequestHeaders);
                    return api.request(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                })
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh_token");

            if (!refreshToken) {
                isRefreshing = false;
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('session_locked');
                localStorage.removeItem('session_locked_at');
                localStorage.removeItem('user_data');
                window.location.href = '/pre';
                return Promise.reject(error);
            }

            try {
                const response = await api.post('/auth/refresh-token', {
                    refresh_token: refreshToken
                });

                const { accessToken } = response.data;
                localStorage.setItem("access_token", accessToken);

                isRefreshing = false;

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers = addTokenToHeader(originalRequest.headers as AxiosRequestHeaders);

                processQueue(null, accessToken);

                return api.request(originalRequest);
            }
            catch (refreshError) {
                processQueue(refreshError, null);

                // ลบ tokens และ redirect
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('session_locked');
                localStorage.removeItem('session_locked_at');
                localStorage.removeItem('user_data');

                window.location.href = '/pre';

                return Promise.reject(refreshError);
            }
            finally {
                isRefreshing = false;
            }
        }

        // ถ้าเป็น LOCK_TIMEOUT ให้ลบ session และ redirect
        if (error.response?.data?.errorCode === 'LOCK_TIMEOUT') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('session_locked');
            localStorage.removeItem('session_locked_at');
            localStorage.removeItem('user_data');

            window.location.href = '/pre';
        }

        // ถ้าเป็น SESSION_EXPIRED หรือ SESSION_NOT_FOUND
        if (
            error.response?.data?.errorCode === 'SESSION_EXPIRED' ||
            error.response?.data?.errorCode === 'SESSION_NOT_FOUND'
        ) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('session_locked');
            localStorage.removeItem('session_locked_at');
            localStorage.removeItem('user_data');

            window.location.href = '/pre';
        }


        return Promise.reject(error);
    }
)

const addTokenToHeader = (headers: AxiosRequestHeaders) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}


export default api;