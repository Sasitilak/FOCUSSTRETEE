import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, useTheme, Paper, Chip, LinearProgress, Alert } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getAdminBookings } from '../../services/api';
import type { DashboardStats, BookingResponse } from '../../types/booking';

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
    pending: 'warning', confirmed: 'success', rejected: 'error', cancelled: 'default', revoked: 'error', expired: 'info',
};

const AdminDashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [s, b] = await Promise.all([getDashboardStats(), getAdminBookings()]);
                setStats(s);
                setBookings(b);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Box><LinearProgress /></Box>;

    if (error || !stats) return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard</Typography>
            <Alert severity="error" sx={{ mt: 2 }}>{error || 'Unable to load dashboard statistics.'}</Alert>
        </Box>
    );

    const statCards = [
        { label: 'Total Bookings', value: stats.totalBookings, icon: <TrendingUpIcon />, color: '#00ADB5', path: '/admin/bookings' },
        { label: 'Active Now', value: stats.activeBookings, icon: <PeopleIcon />, color: '#06b6d4', path: '/admin/bookings' },
        { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <CurrencyRupeeIcon />, color: '#10b981' },
        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <PendingActionsIcon />, color: '#f59e0b', path: '/admin/approvals' },
    ];

    const maxBooking = Math.max(1, ...stats.monthlyBookings.map(m => m.count));

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Overview of your study space</Typography>

            {/* Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {statCards.map((s, i) => (
                    <Grid size={{ xs: 6, md: 3 }} key={i}>
                        <Card
                            className={`animate-fade-in-up stagger-${i + 1}`}
                            onClick={() => s.path && navigate(s.path)}
                            sx={{
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: s.path ? 'pointer' : 'default',
                                '&:hover': s.path ? {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)',
                                    borderColor: s.color,
                                } : {}
                            }}
                        >
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${s.color}15`, color: s.color }}>
                                        {s.icon}
                                    </Box>
                                </Box>
                                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Monthly Chart */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 3 }}>Monthly Bookings</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 160 }}>
                            {stats.monthlyBookings.map((m, i) => (
                                <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.65rem' }}>{m.count}</Typography>
                                    <Box
                                        sx={{
                                            width: '100%', maxWidth: 40,
                                            height: `${(m.count / maxBooking) * 120}px`,
                                            borderRadius: '6px 6px 3px 3px',
                                            bgcolor: 'primary.main',
                                            opacity: 0.8,
                                            transition: 'height 1s ease',
                                            '&:hover': { opacity: 1 },
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{m.month}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Bookings */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Recent Bookings</Typography>
                        {bookings.slice(0, 5).map((b, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: i < 4 ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', mb: 0.25, fontSize: '0.75rem' }}>{b.id}</Typography>
                                    <Typography variant="body2" fontWeight={500}>{b.customerName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{b.slotDate} · ₹{b.amount}</Typography>
                                </Box>
                                <Chip label={b.status} color={statusColor[b.status] ?? 'default'} size="small" sx={{ fontWeight: 500, textTransform: 'capitalize' }} />
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
