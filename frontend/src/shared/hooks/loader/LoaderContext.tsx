import { createContext } from "react";

export interface LoaderContextType {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
}

export const LoaderContext = createContext<LoaderContextType | undefined>(undefined);