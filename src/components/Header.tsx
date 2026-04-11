import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, ButtonBase, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isHome = location.pathname === '/';
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: theme.palette.mode === 'dark'
                    ? 'rgba(9, 9, 11, 0.85)'
                    : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: { xs: 56, md: 64 } }}>
                <ButtonBase
                    onClick={() => navigate('/')}
                    aria-label="Acumen Hive home"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { opacity: 0.85 }, borderRadius: 1, p: 0.5 }}
                >
                    <Box
                        component="img"
                        src="/logo.svg"
                        alt="Acumen Hive"
                        sx={{ width: 34, height: 34, objectFit: 'contain' }}
                    />
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', letterSpacing: '-0.3px' }}>
                        Acumen Hive
                    </Typography>
                </ButtonBase>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                    {!isHome && !isAdmin && (
                        <Button onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary' }}>Home</Button>
                    )}
                    {isAdmin && (
                        <Button onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary' }}>Site</Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
