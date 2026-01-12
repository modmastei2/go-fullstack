import axios, { type AxiosRequestHeaders } from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
        if (error.response && error.response.status === 401) {
            try {
                // const originalRequest = error.config;

                // // Attempt to refresh the token
                // const refreshToken = localStorage.getItem("refresh_token");
                // const response = await api.post('/auth/refresh-token', { refresh_token: refreshToken }).catch((err) => {
                //     console.error('Token refresh failed:', err)
                //     throw err;
                // });
                // const { access_token } = response.data;
                // localStorage.setItem("access_token", access_token);

                // return api.request(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
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