import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, ButtonBase, IconButton, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAppTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { mode, toggleMode } = useAppTheme();
    const isHome = location.pathname === '/';
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: theme.palette.mode === 'dark'
                    ? 'rgba(26, 29, 38, 0.92)'
                    : 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: { xs: 56, md: 64 } }}>
                <ButtonBase
                    onClick={() => navigate('/')}
                    aria-label="StudySpot home"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { opacity: 0.8 }, borderRadius: 1, p: 0.5 }}
                >
                    <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <MenuBookIcon sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                    <Typography variant="h6" sx={{
                        fontWeight: 800, fontSize: { xs: '1rem', md: '1.15rem' },
                        color: 'text.primary',
                    }}>
                        StudySpot
                    </Typography>
                </ButtonBase>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                    {!isHome && !isAdmin && (
                        <Button onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'flex' } }}>Home</Button>
                    )}
                    {!isAdmin && (
                        <Button onClick={() => navigate('/admin')} size="small" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Admin</Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary' }}>Site</Button>
                    )}
                    <IconButton onClick={toggleMode} size="small" sx={{ color: 'text.secondary', ml: 0.5 }}>
                        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
