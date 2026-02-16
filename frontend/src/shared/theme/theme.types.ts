// Standard theme types
export type StandardTheme = 'light' | 'dark' | 'system';

// Seasonal theme types (for future expansion)
export type SeasonalTheme = 'spring' | 'summer' | 'autumn' | 'winter';

// Combined theme type
export type ThemeMode = StandardTheme | SeasonalTheme;

// Resolved theme (actual applied theme, excluding 'system')
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

// Theme category
export type ThemeCategory = 'standard' | 'seasonal';

// Theme metadata
export interface ThemeMetadata {
    id: ThemeMode;
    name: string;
    category: ThemeCategory;
    description?: string;
}

// Available themes registry
export const AVAILABLE_THEMES: ThemeMetadata[] = [
    { id: 'system', name: 'System', category: 'standard', description: 'Follow system preference' },
    { id: 'light', name: 'Light', category: 'standard' },
    { id: 'dark', name: 'Dark', category: 'standard' },
    // Seasonal themes (disabled for now, can be enabled in future)
    // { id: 'spring', name: 'Spring', category: 'seasonal', description: 'Cherry blossom theme' },
    // { id: 'summer', name: 'Summer', category: 'seasonal', description: 'Ocean breeze theme' },
    // { id: 'autumn', name: 'Autumn', category: 'seasonal', description: 'Maple leaves theme' },
    // { id: 'winter', name: 'Winter', category: 'seasonal', description: 'Snow theme' },
];

// Theme storage key
export const STORAGE_THEME_KEY = 'theme_preference';

// Default theme
export const DEFAULT_THEME: ThemeMode = 'system';
