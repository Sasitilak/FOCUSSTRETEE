import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleMode: () => void;
    theme: Theme;
}

/*
 * Light palette — soft minty aqua tones
 *   bg:      #E3FDFD   paper: #FFFFFF   primary: #71C9CE
 *   accent:  #A6E3E9   muted: #CBF1F5   text: #2B2D42
 *
 * Dark palette — charcoal with teal pop
 *   bg:      #1a1d26   paper: #252833   primary: #00ADB5
 *   accent:  #33bdc4   surface: #2f3341  text: #E8E8E8
 */
const createAppTheme = (mode: ThemeMode): Theme => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? '#00ADB5' : '#3BACB6',
                light: isDark ? '#33bdc4' : '#71C9CE',
                dark: isDark ? '#008f96' : '#2a8f97',
            },
            secondary: {
                main: isDark ? '#6C63FF' : '#8B5CF6',
                light: isDark ? '#908aff' : '#a78bfa',
                dark: isDark ? '#524bd4' : '#6d28d9',
            },
            success: { main: '#10b981', light: '#34d399', dark: '#059669' },
            warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
            error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
            background: {
                default: isDark ? '#1a1d26' : '#f0fafa',
                paper: isDark ? '#252833' : '#ffffff',
            },
            text: {
                primary: isDark ? '#e8e8e8' : '#2B2D42',
                secondary: isDark ? '#8b8fa3' : '#6b7280',
            },
            divider: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.025em' },
            h2: { fontWeight: 700, letterSpacing: '-0.02em' },
            h3: { fontWeight: 700, letterSpacing: '-0.015em' },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { textTransform: 'none' as const, fontWeight: 600 },
        },
        shape: { borderRadius: 16 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        transition: 'background-color 0.4s ease, color 0.4s ease',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        boxShadow: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    containedPrimary: {
                        background: isDark
                            ? 'linear-gradient(135deg, #00ADB5 0%, #008f96 100%)'
                            : 'linear-gradient(135deg, #3BACB6 0%, #71C9CE 100%)',
                        color: '#ffffff',
                        '&:hover': {
                            background: isDark
                                ? 'linear-gradient(135deg, #00bfc8 0%, #00ADB5 100%)'
                                : 'linear-gradient(135deg, #2a9da6 0%, #5bbfc5 100%)',
                            boxShadow: isDark
                                ? '0 8px 24px rgba(0,173,181,0.3)'
                                : '0 8px 24px rgba(59,172,182,0.3)',
                            transform: 'translateY(-2px)',
                        },
                    },
                    outlined: {
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        background: isDark ? '#252833' : '#ffffff',
                        boxShadow: isDark
                            ? '0 2px 12px rgba(0,0,0,0.3)'
                            : '0 2px 12px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: { borderRadius: 16, backgroundImage: 'none' },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 12,
                            transition: 'all 0.3s ease',
                            '&.Mui-focused': {
                                boxShadow: isDark
                                    ? '0 0 0 3px rgba(0,173,181,0.15)'
                                    : '0 0 0 3px rgba(59,172,182,0.15)',
                            },
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: { root: { backgroundImage: 'none' } },
            },
            MuiChip: {
                styleOverrides: { root: { borderRadius: 10, fontWeight: 500 } },
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
