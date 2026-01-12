import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { AuthContext, type User, type AuthContextType } from '../context/AuthContext';
import api from '../handlers/api.handler';
import useIdleDetector from '../hooks/useIdleDetector';
import LockScreen from '../../modules/post-login/core/components/LockScreen';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [lockedAt, setLockedAt] = useState<number>(0);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useIdleDetector({
        idleTimeout: 15 * 60 * 1000, // 15 นาที
        onIdle: async () => {
            if (user && !isLocked) {
                console.log('User is idle. Locking session...');
                await lockSession();
            }
        },
    });

    const syncLockState = useCallback(() => {
        const locked = localStorage.getItem('session_locked') === 'true';
        const lockedTime = localStorage.getItem('session_locked_at');

        if (locked) {
            setIsLocked(true);
            setLockedAt(lockedTime ? parseInt(lockedTime) : Date.now());
        } else {
            setIsLocked(false);
            setLockedAt(0);
        }
    }, []);

    // check session status on mount
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true); // เริ่ม loading

            const accessToken = localStorage.getItem('access_token');
            if (!accessToken) {
                setIsLoading(false);
                setIsInitialized(true);
                return;
            }

            try {
                syncLockState();

                // get userProfile
                const profileResponse = await api.get('/auth/profile');
                setUser(profileResponse.data.user);

                // check if session is locked
                const sessionResponse = await api.get('/auth/check-session');
                if (sessionResponse.data.locked) {
                    setIsLocked(true);
                    const lockTime = sessionResponse.data.lockedAt * 1000;
                    setLockedAt(lockTime);
                    localStorage.setItem('session_locked', 'true');
                    localStorage.setItem('session_locked_at', lockTime.toString());
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);

                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('session_locked');
                    localStorage.removeItem('session_locked_at');
                    localStorage.removeItem('user_data');
                    setUser(null);
                    setIsLocked(false);
                }
            } finally {
                setIsLoading(false); // จบ loading
                setIsInitialized(true);
            }
        };

        // รันเฉพาะครั้งแรก
        if (!isInitialized) {
            initAuth();
        }

        // listen for session locked event from API Interceptor
        const handleSessionLocked = () => {
            const lockTime = Date.now();
            setIsLocked(true);
            setLockedAt(lockTime);
            localStorage.setItem('session_locked', 'true');
            localStorage.setItem('session_locked_at', lockTime.toString());
        };
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'session_locked') {
                syncLockState();
            } else if (e.key === 'access_token') {
                if (!e.newValue) {
                    setUser(null);
                    setIsLocked(false);
                    setLockedAt(0);
                    localStorage.removeItem('session_locked');
                    localStorage.removeItem('session_locked_at');
                }
            } else if (e.key === 'user_data' && e.newValue) {
                try {
                    const userData = JSON.parse(e.newValue);
                    setUser(userData);
                    setIsLocked(false);
                    setLockedAt(0);
                } catch (err) {
                    console.error('Failed to parse user data:', err);
                }
            }
        };

        window.addEventListener('session-locked', handleSessionLocked);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('session-locked', handleSessionLocked);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [syncLockState, isInitialized]);

    const login = async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        const { accessToken, refreshToken, user: userData } = response.data;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.removeItem('session_locked');
        localStorage.removeItem('session_locked_at');

        setUser(userData);
        setIsLocked(false);
        setLockedAt(0);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('session_locked');
            localStorage.removeItem('session_locked_at');

            setUser(null);
            setIsLocked(false);
            setLockedAt(0);
        }
    };

    const lockSession = async () => {
        try {
            const response = await api.post('/auth/lock');
            const lockTime = response.data.lockedAt * 1000;

            setIsLocked(true);
            setLockedAt(lockTime);

            localStorage.setItem('session_locked', 'true');
            localStorage.setItem('session_locked_at', lockTime.toString());
        } catch (error) {
            console.error('Lock session failed:', error);

            await logout();
        }
    };

    const unlockSession = async (password: string) => {
        try {
            await api.post('/auth/unlock', { password });
            setIsLocked(false);
            setLockedAt(0);

            localStorage.removeItem('session_locked');
            localStorage.removeItem('session_locked_at');
        } catch (error: any) {
            console.error('Unlock session failed:', error);

            // ถ้าเป็น error แบบ wrong password ให้ throw ต่อ
            if (error.response?.status === 401 && error.response?.data?.message?.includes('password')) {
                throw error;
            }

            // ถ้าเป็น error อื่นๆ (เช่น token หมดอายุ) ให้ logout
            if (error.response?.status === 401 || error.response?.status === 403) {
                await logout();
            }

            throw error;
        }
    };

    const checkSession = async () => {
        const response = await api.get('/auth/check-session');
        if (response.data.locked) {
            const lockTime = response.data.lockedAt * 1000;
            setIsLocked(true);
            setLockedAt(lockTime);
            localStorage.setItem('session_locked', 'true');
            localStorage.setItem('session_locked_at', lockTime.toString());
        } else {
            setIsLocked(false);
            setLockedAt(0);
            localStorage.removeItem('session_locked');
            localStorage.removeItem('session_locked_at');
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isLocked,
        login,
        logout,
        lockSession,
        unlockSession,
        checkSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {isLocked && user ? (
                <LockScreen username={user.username} onUnlock={unlockSession} onLogout={logout} lockedAt={lockedAt} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
