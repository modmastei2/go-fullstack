import { createContext } from 'react';

export interface User {
    userId: string;
    username: string;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLocked: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    lockSession: () => Promise<void>;
    unlockSession: (password: string) => Promise<void>;
    checkSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

