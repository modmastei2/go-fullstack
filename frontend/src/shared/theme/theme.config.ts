import type { ThemeOptions } from '@mui/material/styles';
import type { ResolvedTheme, ThemeMode } from './theme.types';
import { STORAGE_THEME_KEY, DEFAULT_THEME } from './theme.types';

const baseTypography = {
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
    ].join(','),
};

const baseShape = {
    borderRadius: 6,
};

const baseComponents = {
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none' as const,
                fontWeight: 500,
            },
        },
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined' as const,
        },
    },
};

// Light theme configuration
const lightPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: {
        main: '#2563eb',
        light: '#3b82f6',
        dark: '#1d4ed8',
    },
    secondary: {
        main: '#6b7280',
        light: '#9ca3af',
        dark: '#4b5563',
    },
    error: {
        main: '#dc2626',
    },
    warning: {
        main: '#f59e0b',
    },
    info: {
        main: '#3b82f6',
    },
    success: {
        main: '#10b981',
    },
    background: {
        default: '#ffffff',
        paper: '#f9fafb',
    },
    text: {
        primary: '#111827',
        secondary: '#6b7280',
    },
};

// Dark theme configuration
const darkPalette: ThemeOptions['palette'] = {
    mode: 'dark',
    primary: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
    },
    secondary: {
        main: '#9ca3af',
        light: '#d1d5db',
        dark: '#6b7280',
    },
    error: {
        main: '#ef4444',
    },
    warning: {
        main: '#f59e0b',
    },
    info: {
        main: '#3b82f6',
    },
    success: {
        main: '#10b981',
    },
    background: {
        default: '#111827',
        paper: '#1f2937',
    },
    text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
    },
};

// Seasonal theme configurations (for future expansion)
const springPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: {
        main: '#ec4899', // pink
        light: '#f472b6',
        dark: '#db2777',
    },
    secondary: {
        main: '#8b5cf6', // purple
        light: '#a78bfa',
        dark: '#7c3aed',
    },
    background: {
        default: '#fef3f2',
        paper: '#fff5f7',
    },
};

const summerPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: {
        main: '#06b6d4', // cyan
        light: '#22d3ee',
        dark: '#0891b2',
    },
    secondary: {
        main: '#f59e0b', // amber
        light: '#fbbf24',
        dark: '#d97706',
    },
    background: {
        default: '#f0f9ff',
        paper: '#e0f2fe',
    },
};

const autumnPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: {
        main: '#ea580c', // orange
        light: '#fb923c',
        dark: '#c2410c',
    },
    secondary: {
        main: '#92400e', // amber-dark
        light: '#b45309',
        dark: '#78350f',
    },
    background: {
        default: '#fefce8',
        paper: '#fef3c7',
    },
};

const winterPalette: ThemeOptions['palette'] = {
    mode: 'dark',
    primary: {
        main: '#38bdf8', // sky
        light: '#7dd3fc',
        dark: '#0284c7',
    },
    secondary: {
        main: '#cbd5e1', // slate
        light: '#e2e8f0',
        dark: '#94a3b8',
    },
    background: {
        default: '#0f172a',
        paper: '#1e293b',
    },
};

// Theme configuration factory
export function getThemeConfig(theme: ResolvedTheme): ThemeOptions {
    let palette: ThemeOptions['palette'];

    switch (theme) {
        case 'light':
            palette = lightPalette;
            break;
        case 'dark':
            palette = darkPalette;
            break;
        case 'spring':
            palette = springPalette;
            break;
        case 'summer':
            palette = summerPalette;
            break;
        case 'autumn':
            palette = autumnPalette;
            break;
        case 'winter':
            palette = winterPalette;
            break;
        default:
            palette = lightPalette;
    }

    return {
        palette,
        typography: baseTypography,
        shape: baseShape,
        components: baseComponents,
    };
}

// Check if theme is dark-based
export function isDarkTheme(theme: ResolvedTheme): boolean {
    return theme === 'dark' || theme === 'winter';
}

// =============================================================================
// Theme Utilities
// =============================================================================

/**
 * Get system color scheme preference
 */
export function getSystemPreference(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme mode to actual theme (excluding 'system')
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === 'system') {
        return getSystemPreference();
    }
    return mode as ResolvedTheme;
}

/**
 * Get saved theme preference from localStorage
 */
export function getSavedTheme(): ThemeMode | null {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved as ThemeMode | null;
}

/**
 * Save theme preference to localStorage
 */
export function saveTheme(mode: ThemeMode): void {
    localStorage.setItem(STORAGE_THEME_KEY, mode);
}

/**
 * Apply theme to document root element
 */
export function applyThemeToDocument(theme: ResolvedTheme): void {
    const root = document.documentElement;
    const isDark = isDarkTheme(theme);
    
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', theme);
}

/**
 * Get current theme state
 */
export function getCurrentTheme(): {
    mode: ThemeMode;
    resolved: ResolvedTheme;
} {
    const mode = getSavedTheme() || DEFAULT_THEME;
    const resolved = resolveTheme(mode);
    
    return { mode, resolved };
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): ThemeMode {
    const current = getCurrentTheme();
    const nextMode: ThemeMode = current.resolved === 'dark' ? 'light' : 'dark';
    
    saveTheme(nextMode);
    applyThemeToDocument(resolveTheme(nextMode));
    
    return nextMode;
}

/**
 * Create a media query listener for system theme changes
 */
export function createSystemThemeListener(
    callback: (isDark: boolean) => void
): () => void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
        const currentMode = getSavedTheme();
        // Only react if user is using system theme
        if (currentMode === 'system' || !currentMode) {
            callback(e.matches);
        }
    };
    
    mediaQuery.addEventListener('change', handler);
    
    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler);
}
