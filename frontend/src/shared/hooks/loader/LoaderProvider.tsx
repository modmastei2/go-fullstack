import type React from 'react';
import { useState, type ReactNode } from 'react';
import { LoaderContext, type LoaderContextType } from './LoaderContext';
import Loader from '../../components/Loader/Loader';

interface LoaderProviderProps {
    children: ReactNode;
}

export const LoaderProvider: React.FC<LoaderProviderProps> = ({ children }) => {
    const [count, setCount] = useState(0);

    const isLoading = count > 0

    const showLoading = () => {
        setCount((prev) => prev + 1);
    };

    const hideLoading = () => {
        setCount((prev) => Math.max(0, prev - 1));
    };

    const value: LoaderContextType = {
        isLoading,
        showLoading,
        hideLoading,
    };

    return (
        <>
            <div className="relative min-h-screen">
                <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
                { isLoading && <Loader />}
            </div>
        </>
    );
};
