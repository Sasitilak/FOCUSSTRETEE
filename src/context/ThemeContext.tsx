import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleMode: () => void;
    theme: Theme;
}

const createAppTheme = (mode: ThemeMode): Theme => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: '#f59e0b',
                light: '#fbbf24',
                dark: '#d97706',
            },
            secondary: {
                main: '#fb923c',
                light: '#fdba74',
                dark: '#ea580c',
            },
            success: { main: '#34d399', light: '#6ee7b7', dark: '#059669' },
            warning: { main: '#fbbf24', light: '#fde68a', dark: '#d97706' },
            error: { main: '#f87171', light: '#fca5a5', dark: '#dc2626' },
            background: {
                default: isDark ? '#09090b' : '#fafafa',
                paper: isDark ? '#131316' : '#ffffff',
            },
            text: {
                primary: isDark ? '#fafafa' : '#09090b',
                secondary: isDark ? '#71717a' : '#52525b',
            },
            divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            h1: { fontWeight: 700, letterSpacing: '-0.03em' },
            h2: { fontWeight: 700, letterSpacing: '-0.025em' },
            h3: { fontWeight: 600, letterSpacing: '-0.02em' },
            h4: { fontWeight: 600, letterSpacing: '-0.015em' },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { textTransform: 'none' as const, fontWeight: 500 },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: '10px 24px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        boxShadow: 'none',
                        transition: 'all 0.2s ease',
                    },
                    containedPrimary: {
                        background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                        color: '#ffffff',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            boxShadow: '0 0 24px rgba(245,158,11,0.35)',
                        },
                    },
                    outlined: {
                        borderWidth: 1.5,
                        '&:hover': { borderWidth: 1.5 },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        background: isDark ? '#131316' : '#ffffff',
                        boxShadow: 'none',
                        transition: 'all 0.2s ease',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: { borderRadius: 12, backgroundImage: 'none' },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 10,
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: { root: { backgroundImage: 'none' } },
            },
            MuiChip: {
                styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
            },
        },
    });
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('dark');
    const theme = useMemo(() => createAppTheme(mode), [mode]);
    const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useAppTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
    return ctx;
};
