export type Theme = 'light' | 'dark' | 'system'

const STORAGE_THEME_KEY = 'theme_preference'
const DEFAULT_THEME: Theme = 'system'

let media: MediaQueryList | null = null
let listener: ((e: MediaQueryListEvent) => void) | null = null

export function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) as Theme | null
    const theme = savedTheme ?? DEFAULT_THEME

    applyTheme(theme)

    if (listener) return

    media = window.matchMedia('(prefers-color-scheme: dark)')

    listener = (e) => {
        const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) as Theme | null
        if (savedTheme && savedTheme !== 'system') return

        applyTheme('system')

        console.log(e.matches ? 'dark' : 'light')
    }

    media?.addEventListener('change', listener);
}


export function applyTheme(theme: Theme) {
    const root = document.documentElement
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const apply = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

    root.classList.toggle("dark", apply === 'dark')
    localStorage.setItem(STORAGE_THEME_KEY, theme)
}

export function toggleTheme() {
    const current = getCurrentTheme()

    const next: Theme =
        current.theme === 'dark' ? 'light' : 'dark'

    applyTheme(next)
}

export function getCurrentTheme(): { prefer: Theme | null, theme: 'light' | 'dark' } {
    return {
        prefer: localStorage.getItem(STORAGE_THEME_KEY) as Theme | null,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    }
}