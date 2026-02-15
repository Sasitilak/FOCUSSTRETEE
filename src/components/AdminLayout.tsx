import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Typography, Divider, Button, useTheme, IconButton, AppBar, Toolbar,
    useMediaQuery, Switch, FormControlLabel, Snackbar, Alert
} from '@mui/material';
import { getMaintenanceMode, setMaintenanceMode } from '../services/api';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ChairIcon from '@mui/icons-material/Chair';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CampaignIcon from '@mui/icons-material/Campaign';

const DRAWER_WIDTH = 240;

const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { label: 'Bookings', icon: <BookOnlineIcon />, path: '/admin/bookings' },
    { label: 'Approvals', icon: <PendingActionsIcon />, path: '/admin/approvals' },
    { label: 'Seats', icon: <ChairIcon />, path: '/admin/seats' },
    { label: 'Holidays', icon: <EventBusyIcon />, path: '/admin/holidays' },
    { label: 'Announcements', icon: <CampaignIcon />, path: '/admin/announcements' },
    { label: 'Facility Config', icon: <LocationOnIcon />, path: '/admin/locations' },
];

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { signOut } = useAuth();
    const { mode, toggleMode } = useAppTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    const [maintenance, setMaintenance] = useState(false);
    const [snack, setSnack] = useState('');

    useEffect(() => {
        const fetchMaintenance = async () => {
            try {
                const isMaint = await getMaintenanceMode();
                setMaintenance(isMaint);
            } catch (error) {
                console.error("Failed to fetch maintenance mode", error);
            }
        };
        fetchMaintenance();
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const handleNav = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleMaintenanceToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.checked;
        setMaintenance(newVal);
        try {
            await setMaintenanceMode(newVal);
            setSnack(newVal ? 'Maintenance Mode ON' : 'Maintenance Mode OFF');
        } catch (err) {
            console.error(err);
            setMaintenance(!newVal); // revert
            setSnack('Failed to update maintenance mode');
        }
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <MenuBookIcon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.1 }}>Acumen Hive</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Admin Panel</Typography>
                </Box>
                {isMobile && (
                    <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Divider />

            <List sx={{ px: 1, py: 1, flex: 1 }}>
                {navItems.map(item => {
                    const isActive = location.pathname === item.path;
                    const isFacilityConfig = item.path === '/admin/locations';
                    const isDisabled = isFacilityConfig && !maintenance;

                    return (
                        <ListItemButton
                            key={item.path}
                            onClick={() => !isDisabled && handleNav(item.path)}
                            disabled={isDisabled}
                            sx={{
                                borderRadius: 2, mb: 0.5,
                                bgcolor: isActive ? (theme.palette.mode === 'dark' ? 'rgba(0,173,181,0.08)' : 'rgba(59,172,182,0.08)') : 'transparent',
                                color: isActive ? 'primary.main' : 'text.secondary',
                                opacity: isDisabled ? 0.5 : 1,
                                '&:hover': { bgcolor: !isDisabled ? (theme.palette.mode === 'dark' ? 'rgba(0,173,181,0.04)' : 'rgba(59,172,182,0.04)') : 'transparent' },
                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                secondary={isDisabled ? "(Maintenance Only)" : null}
                                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400 }}
                                secondaryTypographyProps={{ fontSize: '0.65rem', color: 'text.disabled' }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={<Switch size="small" checked={maintenance} onChange={handleMaintenanceToggle} color="warning" />}
                        label={<Typography variant="caption" color="text.secondary">Maintenance Mode</Typography>}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <IconButton onClick={toggleMode} size="small" sx={{ color: 'text.secondary' }}>
                        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </IconButton>
                    <Button
                        onClick={() => handleNav('/')} size="small"
                        startIcon={<HomeIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                    >
                        Public Site
                    </Button>
                </Box>
                <Button
                    fullWidth variant="outlined" color="error" size="small"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ borderRadius: 2 }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Mobile top bar */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    elevation={0}
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Toolbar sx={{ minHeight: 56 }}>
                        <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: 'text.primary' }}>
                            <MenuIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                            <Box sx={{
                                width: 24, height: 24, borderRadius: '6px',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <MenuBookIcon sx={{ color: '#fff', fontSize: 14 }} />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={700}>Acumen Hive Admin</Typography>
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            {/* Sidebar — temporary on mobile, permanent on desktop */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={() => setMobileOpen(false)}
                sx={{
                    width: isMobile ? 0 : DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        bgcolor: 'background.paper',
                        borderRight: `1px solid ${theme.palette.divider}`,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Content */}
            <Box sx={{
                flex: 1,
                p: { xs: 2, md: 4 },
                pt: { xs: isMobile ? 9 : 2, md: 4 },
                overflow: 'auto',
                minWidth: 0,
            }}>
                <Outlet />
            </Box>

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')}>
                <Alert severity="info" variant="filled" sx={{ width: '100%' }}>
                    {snack}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminLayout;
