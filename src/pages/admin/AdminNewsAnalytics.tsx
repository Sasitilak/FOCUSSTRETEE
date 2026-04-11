import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, CircularProgress, ToggleButtonGroup, ToggleButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getNewsAnalytics, type NewsAnalyticsStats } from '../../services/newsAnalytics';
import { CATEGORY_CONFIG } from '../../types/news';

const AdminNewsAnalytics: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [stats, setStats] = useState<NewsAnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    useEffect(() => {
        setLoading(true);
        getNewsAnalytics(days)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [days]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );

    if (!stats) return <Typography color="error">Failed to load analytics</Typography>;

    const ctr = stats.totalVisitors > 0
        ? ((stats.totalArticleClicks / stats.totalVisitors) * 100).toFixed(1)
        : '0';

    const statCards = [
        { label: 'Unique Visitors', value: stats.totalVisitors, icon: <PeopleIcon />, color: '#3b82f6' },
        { label: 'Article Clicks', value: stats.totalArticleClicks, icon: <TouchAppIcon />, color: '#f59e0b' },
        { label: 'Click-through Rate', value: `${ctr}%`, icon: <TrendingUpIcon />, color: '#10b981' },
        { label: 'Peak Hour', value: stats.peakHours.length > 0 ? `${stats.peakHours.reduce((a, b) => a.count > b.count ? a : b).hour}:00` : '-', icon: <AccessTimeIcon />, color: '#8b5cf6' },
    ];

    const maxDaily = Math.max(...stats.dailyVisitors.map(d => d.count), 1);
    const maxHour = Math.max(...stats.peakHours.map(h => h.count), 1);

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>News Analytics</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track how users interact with the news section
            </Typography>

            {/* Period selector */}
            <ToggleButtonGroup
                value={days}
                exclusive
                onChange={(_, v) => v && setDays(v)}
                size="small"
                sx={{ mb: 3 }}
            >
                <ToggleButton value={1} sx={{ px: 2, textTransform: 'none' }}>Today</ToggleButton>
                <ToggleButton value={7} sx={{ px: 2, textTransform: 'none' }}>7 Days</ToggleButton>
                <ToggleButton value={30} sx={{ px: 2, textTransform: 'none' }}>30 Days</ToggleButton>
            </ToggleButtonGroup>

            {/* Stat cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {statCards.map(card => (
                    <Grid size={{ xs: 6, md: 3 }} key={card.label}>
                        <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={800}>{card.value}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Daily visitors chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Daily Visitors</Typography>
                        {stats.dailyVisitors.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No data yet</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 120 }}>
                                {stats.dailyVisitors.map(d => (
                                    <Box key={d.date} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ fontSize: '0.55rem', mb: 0.5, color: 'text.secondary' }}>
                                            {d.count}
                                        </Typography>
                                        <Box sx={{
                                            width: '100%',
                                            maxWidth: 32,
                                            height: `${(d.count / maxDaily) * 100}px`,
                                            minHeight: 4,
                                            bgcolor: '#3b82f6',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.3s ease',
                                        }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.5rem', mt: 0.5, color: 'text.disabled' }}>
                                            {d.date.slice(5)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Peak hours chart */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Activity by Hour</Typography>
                        {stats.peakHours.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No data yet</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 120 }}>
                                {Array.from({ length: 24 }).map((_, h) => {
                                    const entry = stats.peakHours.find(p => p.hour === h);
                                    const count = entry?.count || 0;
                                    return (
                                        <Box key={h} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Box sx={{
                                                width: '100%',
                                                height: count > 0 ? `${(count / maxHour) * 100}px` : 2,
                                                minHeight: 2,
                                                bgcolor: count > 0 ? '#8b5cf6' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                                borderRadius: '3px 3px 0 0',
                                            }} />
                                            {h % 4 === 0 && (
                                                <Typography variant="caption" sx={{ fontSize: '0.45rem', mt: 0.3, color: 'text.disabled' }}>
                                                    {h}h
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Top articles */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Most Clicked Articles</Typography>
                        {stats.topArticles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No clicks yet</Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>#</TableCell>
                                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Article</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Clicks</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stats.topArticles.map((a, i) => (
                                            <TableRow key={i}>
                                                <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{i + 1}</TableCell>
                                                <TableCell sx={{ fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {a.title}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>
                                                    {a.clicks}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>

                {/* Top categories */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Popular Categories</Typography>
                        {stats.topCategories.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No data yet</Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {stats.topCategories.map(c => {
                                    const cfg = CATEGORY_CONFIG[c.category];
                                    const maxCat = stats.topCategories[0].count;
                                    return (
                                        <Box key={c.category}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                                                    {cfg?.label || c.category}
                                                </Typography>
                                                <Typography variant="caption" fontWeight={700} sx={{ color: cfg?.color || 'text.primary' }}>
                                                    {c.count}
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                height: 6, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                overflow: 'hidden',
                                            }}>
                                                <Box sx={{
                                                    height: '100%',
                                                    width: `${(c.count / maxCat) * 100}%`,
                                                    bgcolor: cfg?.color || '#f59e0b',
                                                    borderRadius: 3,
                                                    transition: 'width 0.5s ease',
                                                }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminNewsAnalytics;
