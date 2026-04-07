import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, ButtonBase, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';

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
                    <MenuBookIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h5" fontWeight={800} sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        Acumen Hive
                    </Typography>
                </ButtonBase>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                    {!isHome && !isAdmin && (
                        <Button onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'flex' } }}>Home</Button>
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
