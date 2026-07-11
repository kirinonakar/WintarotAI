import type { ThemeMode } from '../types/app.js';
import { invoke } from './tauri_api.js';

const THEME_STORAGE_KEY = 'ui-theme';
const DEFAULT_FONT_SIZE = '16';
const DEFAULT_WRAP_WIDTH = '42';

function getSavedTheme(): ThemeMode | null {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : null;
    } catch (e) {
        console.warn("[Frontend] Failed to read saved theme:", e);
        return null;
    }
}

function getSystemTheme(): ThemeMode {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncNativeWindowTheme(theme: ThemeMode) {
    if (typeof invoke !== 'function') return;

    invoke('set_window_theme', { theme }).catch((e) => {
        console.warn("[Frontend] Failed to sync native window theme:", e);
    });
}

function applyTheme(theme: ThemeMode, { persist = true } = {}): ThemeMode {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolvedTheme;
    syncNativeWindowTheme(resolvedTheme);

    if (!persist) return resolvedTheme;

    try {
        localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    } catch (e) {
        console.warn("[Frontend] Failed to persist theme:", e);
    }

    return resolvedTheme;
}

export function toggleTheme(): ThemeMode {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    return applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

export function initTheme(): ThemeMode {
    const currentTheme = document.documentElement.dataset.theme;
    const resolvedTheme =
        getSavedTheme() ||
        (currentTheme === 'dark' || currentTheme === 'light' ? currentTheme : null) ||
        getSystemTheme();

    return applyTheme(resolvedTheme, { persist: false });
}

export function restoreUiSettings() {
    const fontSize = localStorage.getItem('fs-plot') || DEFAULT_FONT_SIZE;
    const wrapWidth = localStorage.getItem('wrap-plot') || DEFAULT_WRAP_WIDTH;
    document.documentElement.style.setProperty('--plot-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--plot-wrap-width', `${wrapWidth}em`);
}
