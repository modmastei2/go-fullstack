import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContext } from '../hooks/theme/useTheme';
import type { ThemeMode, ResolvedTheme } from '../theme/theme.types';
import { DEFAULT_THEME, STORAGE_THEME_KEY } from '../theme/theme.types';
import { 
    getThemeConfig, 
    getSystemPreference, 
    saveTheme, 
    applyThemeToDocument 
} from '../theme/theme.config';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    // Load saved theme preference
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode | null;
        return saved || DEFAULT_THEME;
    });

    // Track system preference
    const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
        return getSystemPreference();
    });

    // Listen to system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            setSystemPreference(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Resolve actual theme to apply
    const resolvedTheme: ResolvedTheme = useMemo(() => {
        if (mode === 'system') {
            return systemPreference;
        }
        return mode as ResolvedTheme;
    }, [mode, systemPreference]);

    // Create MUI theme based on resolved theme
    const muiTheme = useMemo(() => {
        const config = getThemeConfig(resolvedTheme);
        return createTheme(config);
    }, [resolvedTheme]);

    // Apply theme to document
    useEffect(() => {
        applyThemeToDocument(resolvedTheme);
    }, [resolvedTheme]);

    // Set mode with persistence
    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        saveTheme(newMode);
    };

    const contextValue = useMemo(
        () => ({
            mode,
            setMode,
            resolvedTheme,
        }),
        [mode, resolvedTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}
