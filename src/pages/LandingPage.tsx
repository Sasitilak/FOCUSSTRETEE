import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme, Chip, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HomeIcon from '@mui/icons-material/Home';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { getBranches, getNewsEnabled } from '../services/api';
import type { Branch } from '../types/booking';
import NewsFeed from './news/NewsFeed';

const STEPS = [
    { num: '01', title: 'Pick dates', desc: 'Choose your start date and duration — weekly or monthly.' },
    { num: '02', title: 'Choose seat', desc: 'Browse branches, floors, and rooms. Pick the exact seat you want.' },
    { num: '03', title: 'Pay via UPI', desc: 'Scan the QR, pay, and upload your screenshot.' },
    { num: '04', title: 'Get confirmed', desc: 'We verify and confirm your booking on WhatsApp.' },
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [branches, setBranches] = useState<Branch[]>([]);
    const [view, setView] = useState<'home' | 'news'>('home');
    const [newsEnabled, setNewsEnabled] = useState(false);

    useEffect(() => {
        getBranches().then(setBranches).catch(console.error);
        getNewsEnabled().then(setNewsEnabled).catch(console.error);
    }, []);

    return (
        <Box>
            {/* Home | News Switcher */}
            <Box
                sx={{
                    position: 'sticky',
                    top: { xs: 56, md: 64 },
                    zIndex: 99,
                    display: newsEnabled ? 'flex' : 'none',
                    justifyContent: 'center',
                    py: 1,
                    backdropFilter: 'blur(20px)',
                    background: isDark ? 'rgba(9,9,11,0.8)' : 'rgba(255,255,255,0.8)',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        borderRadius: '10px',
                        p: '3px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    {[
                        { key: 'home', label: 'Home', icon: <HomeIcon sx={{ fontSize: 15 }} /> },
                        { key: 'news', label: 'News', icon: <NewspaperIcon sx={{ fontSize: 15 }} /> },
                    ].map(tab => (
                        <Box
                            key={tab.key}
                            onClick={() => { setView(tab.key as 'home' | 'news'); window.scrollTo({ top: 0 }); }}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.6,
                                px: 2, py: 0.7,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: view === tab.key ? 600 : 400,
                                color: view === tab.key ? (isDark ? '#fff' : '#fff') : 'text.secondary',
                                bgcolor: view === tab.key ? 'primary.main' : 'transparent',
                                transition: 'all 0.2s ease',
                                userSelect: 'none',
                                '&:hover': {
                                    bgcolor: view === tab.key ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                },
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Sliding content */}
            <Box sx={{ overflow: 'hidden' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        width: '200%',
                        transform: view === 'home' ? 'translateX(0)' : 'translateX(-50%)',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {/* HOME view */}
                    <Box sx={{ width: '50%', minWidth: '50%' }}>
                        {/* Hero */}
                        <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 12 }, position: 'relative' }}>
                            {/* Background accent */}
                            <Box sx={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: isDark
                                    ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 60%)'
                                    : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.04) 0%, transparent 60%)',
                                pointerEvents: 'none',
                            }} />

                            <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
                                <Box
                                    component="img"
                                    src="/logo.svg"
                                    alt="Acumen Hive"
                                    className="animate-fade-in-up"
                                    sx={{ width: 72, height: 72, mb: 2, mx: 'auto', display: 'block' }}
                                />
                                <Typography
                                    variant="body2"
                                    className="animate-fade-in-up"
                                    sx={{
                                        mb: 2.5,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 2, py: 0.6,
                                        borderRadius: '20px',
                                        bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)',
                                        color: '#f59e0b',
                                        fontWeight: 500,
                                        fontSize: '0.82rem',
                                        border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'}`,
                                    }}
                                >
                                    Premium study spaces for aspirants
                                </Typography>
                                <Typography
                                    variant="h1"
                                    className="animate-fade-in-up stagger-1"
                                    sx={{
                                        fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
                                        lineHeight: 1.1, mb: 2.5, color: 'text.primary',
                                    }}
                                >
                                    Focus better.{' '}
                                    <Box component="span" sx={{ color: '#f59e0b' }}>Study smarter.</Box>
                                </Typography>
                                <Typography
                                    variant="body1"
                                    className="animate-fade-in-up stagger-2"
                                    sx={{
                                        color: 'text.secondary', mb: 4,
                                        maxWidth: 480, mx: 'auto', lineHeight: 1.7,
                                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    }}
                                >
                                    Book your seat at Acumen Hive. Quiet zones, AC rooms, and dedicated desks
                                    for competitive exam aspirants.
                                </Typography>
                                <Stack direction="row" spacing={1.5} justifyContent="center" className="animate-fade-in-up stagger-3">
                                    <Button
                                        variant="contained" size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={() => navigate('/slots')}
                                        sx={{
                                            px: { xs: 3, md: 4 }, py: 1.4,
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                                            '&:hover': { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 0 24px rgba(245,158,11,0.35)' },
                                        }}
                                    >
                                        Book a seat
                                    </Button>
                                    <Button
                                        variant="outlined" size="large"
                                        onClick={() => {
                                            const el = document.getElementById('locations');
                                            el?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        sx={{ px: { xs: 3, md: 4 }, py: 1.4, color: 'text.secondary', borderColor: 'divider', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                    >
                                        View locations
                                    </Button>
                                </Stack>
                            </Container>
                        </Box>

                        {/* How it works */}
                        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: isDark ? 'rgba(19,19,22,0.6)' : '#f8fafc' }}>
                            <Container maxWidth="lg" sx={{ px: { xs: 3, md: 4 } }}>
                                <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block', textAlign: 'center', letterSpacing: 2, fontSize: '0.7rem' }}>
                                    How it works
                                </Typography>
                                <Typography variant="h4" textAlign="center" sx={{ mb: { xs: 4, md: 6 } }}>
                                    Book in 4 simple steps
                                </Typography>

                                <Grid container spacing={{ xs: 2, md: 3 }}>
                                    {STEPS.map((s, i) => (
                                        <Grid size={{ xs: 6, md: 3 }} key={i}>
                                            <Box
                                                className={`animate-fade-in-up stagger-${i + 1}`}
                                                sx={{
                                                    p: { xs: 2.5, md: 3 },
                                                    borderRadius: 3,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    bgcolor: 'background.paper',
                                                    height: '100%',
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        color: '#f59e0b',
                                                        mb: 1.5,
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {s.num}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, fontSize: { xs: '0.82rem', md: '0.95rem' } }}>
                                                    {s.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: { xs: 'none', sm: 'block' } }}>
                                                    {s.desc}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Container>
                        </Box>

                        {/* Locations */}
                        {branches.length > 0 && (
                            <Box id="locations" sx={{ py: { xs: 6, md: 10 } }}>
                                <Container maxWidth="lg" sx={{ px: { xs: 3, md: 4 } }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block', textAlign: 'center', letterSpacing: 2, fontSize: '0.7rem' }}>
                                        Locations
                                    </Typography>
                                    <Typography variant="h4" textAlign="center" sx={{ mb: { xs: 4, md: 6 } }}>
                                        Visit us
                                    </Typography>
                                    <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center">
                                        {branches.map((branch, i) => {
                                            const seatCount = branch.floors.reduce((sum, f) => sum + f.rooms.reduce((rs, r) => rs + r.seats.length, 0), 0);
                                            const floorCount = branch.floors.length;
                                            return (
                                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={branch.id}>
                                                    <Card
                                                        className={`animate-fade-in-up stagger-${i + 1}`}
                                                        elevation={0}
                                                        sx={{
                                                            height: '100%',
                                                            '&:hover': { borderColor: '#f59e0b' },
                                                        }}
                                                    >
                                                        {/* Accent bar */}
                                                        <Box sx={{ height: 3, background: 'linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)' }} />
                                                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 'calc(100% - 3px)' }}>
                                                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                                                {branch.name.split('—')[0].trim()}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1, fontSize: '0.85rem' }}>
                                                                {branch.address}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                                <Chip label={`${floorCount} Floor${floorCount !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                                                                {seatCount > 0 && <Chip label={`${seatCount} Seats`} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />}
                                                            </Box>
                                                            {branch.mapsUrl && (
                                                                <Button
                                                                    variant="text"
                                                                    size="small"
                                                                    startIcon={<LocationOnIcon sx={{ fontSize: '16px !important' }} />}
                                                                    endIcon={<OpenInNewIcon sx={{ fontSize: '12px !important' }} />}
                                                                    onClick={() => window.open(branch.mapsUrl, '_blank', 'noopener,noreferrer')}
                                                                    sx={{ px: 0, justifyContent: 'flex-start', fontSize: '0.82rem' }}
                                                                >
                                                                    Open in Maps
                                                                </Button>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Container>
                            </Box>
                        )}

                        {/* CTA */}
                        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: isDark ? 'rgba(19,19,22,0.6)' : '#f8fafc' }}>
                            <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={600} sx={{ mb: 1.5 }}>
                                    Ready to start?
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                                    Reserve your spot in under two minutes. Pick your dates, choose a seat, and you're in.
                                </Typography>
                                <Button
                                    variant="contained" size="large"
                                    onClick={() => navigate('/slots')}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        px: 5, py: 1.4,
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                                        '&:hover': { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 0 24px rgba(245,158,11,0.35)' },
                                    }}
                                >
                                    Book a seat
                                </Button>
                            </Container>
                        </Box>
                    </Box>

                    {/* NEWS view */}
                    <Box sx={{ width: '50%', minWidth: '50%' }}>
                        {view === 'news' && (
                            <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
                                <NewsFeed />
                            </Container>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default LandingPage;
