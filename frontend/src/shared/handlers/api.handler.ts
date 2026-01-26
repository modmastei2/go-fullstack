import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.BASE_API || '/api/v1',
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

        // Skip refresh token logic for login and unlock endpoints
        if (originalRequest.url === '/auth/login' ||
            originalRequest.url === '/auth/unlock' ||
            originalRequest.url === '/auth/refresh-token') {
            return Promise.reject(error);
        }


        // ถ้าเป็น 401 และยังไม่ได้ retry
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // add to queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api.request(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                })
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post('/auth/refresh-token', {});

                isRefreshing = false;

                processQueue(null, "REFRESHED");

                return api.request(originalRequest);
            }
            catch (refreshError) { // if call refresh token fail
                processQueue(refreshError, null);
                isRefreshing = false;

                // clear all local storage
                clearLocalStorage();

                // redirect to pre-login page
                if (!window.location.pathname.startsWith('/pre'))
                    window.location.href = '/pre';

                return Promise.reject(refreshError);
            }
            finally {
                isRefreshing = false;
            }
        }

        // ถ้าเป็น SESSION_LOCKED ให้ redirect เฉพาะเมื่อไม่ได้อยู่หน้า pre-login
        if (error.response?.data?.errorCode === 'SESSION_LOCKED') {
            if (!window.location.pathname.startsWith('/pre')) {
                // Don't clear session data, just redirect
                window.location.href = '/pre';
            }
            return Promise.reject(error);
        }

        // ถ้าเป็น SESSION_EXPIRED หรือ SESSION_NOT_FOUND หรือ LOCK_TIMEOUT ให้ลบ session และ redirect
        if (
            error.response?.data?.errorCode === 'SESSION_EXPIRED' ||
            error.response?.data?.errorCode === 'SESSION_NOT_FOUND' ||
            error.response?.data?.errorCode === 'LOCK_TIMEOUT'
        ) {
            clearLocalStorage();

            window.location.href = '/pre';
        }

        return Promise.reject(error);
    }
)

function clearLocalStorage() {
    localStorage.removeItem('session_locked');
    localStorage.removeItem('session_locked_at');
    localStorage.removeItem('user_data');
}

export interface ApiErrorResponse {
    errorCode: string;
    message: string;
}

export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
    return (error as AxiosError).isAxiosError === true;
}

export default api;