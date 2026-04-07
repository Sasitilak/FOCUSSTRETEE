import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChairIcon from '@mui/icons-material/Chair';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HomeIcon from '@mui/icons-material/Home';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { getBranches, getNewsEnabled } from '../services/api';
import type { Branch } from '../types/booking';
import NewsFeed from './news/NewsFeed';

const features = [
    { icon: <CalendarMonthIcon sx={{ fontSize: 32 }} />, title: 'Pick Your Dates', desc: 'Select a date range that works for your schedule.' },
    { icon: <ChairIcon sx={{ fontSize: 32 }} />, title: 'Choose Your Seat', desc: 'Browse branches and floors — pick your spot.' },
    { icon: <UploadFileIcon sx={{ fontSize: 32 }} />, title: 'Upload Payment', desc: 'Pay via UPI and upload the screenshot.' },
    { icon: <VerifiedIcon sx={{ fontSize: 32 }} />, title: 'Get Confirmed', desc: 'We verify and confirm via WhatsApp.' },
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
                    py: 1.5,
                    bgcolor: 'transparent',
                    backdropFilter: 'blur(12px)',
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(26,29,38,0.7)'
                        : 'rgba(255,255,255,0.7)',
                    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        borderRadius: '50px',
                        p: '4px',
                        gap: 0,
                        background: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.07)'
                            : 'rgba(0,0,0,0.06)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                            : '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                    }}
                >
                    {[
                        { key: 'home', label: 'Home', icon: <HomeIcon sx={{ fontSize: 15 }} /> },
                        { key: 'news', label: 'News', icon: <NewspaperIcon sx={{ fontSize: 15 }} /> },
                    ].map(tab => (
                        <Box
                            key={tab.key}
                            onClick={() => setView(tab.key as 'home' | 'news')}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.75,
                                px: 2.5, py: 0.85,
                                borderRadius: '50px',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: view === tab.key ? 700 : 500,
                                color: view === tab.key
                                    ? theme.palette.mode === 'dark' ? '#fff' : '#fff'
                                    : 'text.secondary',
                                background: view === tab.key
                                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                    : 'transparent',
                                boxShadow: view === tab.key
                                    ? '0 2px 12px rgba(0,0,0,0.2)'
                                    : 'none',
                                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                userSelect: 'none',
                                '&:hover': {
                                    color: view === tab.key ? '#fff' : 'text.primary',
                                    background: view === tab.key
                                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                        : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
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
                        width: '200%',
                        transform: view === 'home' ? 'translateX(0)' : 'translateX(-50%)',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {/* HOME view */}
                    <Box sx={{ width: '50%', minWidth: '50%' }}>
                        {/* Hero section */}
                        <Box
                            sx={{
                                minHeight: { xs: '60vh', md: '70vh' },
                                display: 'flex',
                                alignItems: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                bgcolor: 'background.default',
                            }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                width: { xs: 300, md: 500 }, height: { xs: 300, md: 500 },
                                borderRadius: '50%',
                                background: isDark
                                    ? 'radial-gradient(circle, rgba(0,173,181,0.12) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(59,172,182,0.15) 0%, transparent 70%)',
                                top: { xs: '-10%', md: '-15%' },
                                right: { xs: '-20%', md: '-5%' },
                                pointerEvents: 'none',
                            }} />
                            <Box sx={{
                                position: 'absolute',
                                width: { xs: 200, md: 350 }, height: { xs: 200, md: 350 },
                                borderRadius: '50%',
                                background: isDark
                                    ? 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                                bottom: '10%', left: '-10%',
                                pointerEvents: 'none',
                            }} />

                            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 3, md: 4 } }}>
                                <Box className="animate-fade-in-up" sx={{ maxWidth: { xs: '100%', md: 560 } }}>
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
                                            lineHeight: 1.15, mb: 2, color: 'text.primary',
                                        }}
                                    >
                                        Your Perfect{' '}
                                        <Box component="span" sx={{ color: 'primary.main' }}>Study Space</Box>{' '}
                                        Awaits
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'text.secondary', mb: 4,
                                            maxWidth: 440, lineHeight: 1.7,
                                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                                        }}
                                    >
                                        Book your seat at Acumen Hive — quiet zones, focus rooms, and premium cabins across two branches.
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained" size="large"
                                            endIcon={<ArrowForwardIcon />}
                                            onClick={() => navigate('/slots')}
                                            sx={{ px: { xs: 3, md: 5 }, py: 1.5 }}
                                        >
                                            Book Now
                                        </Button>
                                    </Box>
                                </Box>
                            </Container>
                        </Box>

                        {/* Features */}
                        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, px: { xs: 3, md: 4 } }}>
                            <Typography variant="h4" textAlign="center" sx={{ mb: 1 }}>How It Works</Typography>
                            <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: { xs: 4, md: 6 }, maxWidth: 420, mx: 'auto' }}>
                                Four simple steps to reserve your study spot
                            </Typography>

                            <Grid container spacing={{ xs: 2, md: 3 }}>
                                {features.map((f, i) => (
                                    <Grid size={{ xs: 6, md: 3 }} key={i}>
                                        <Card
                                            className={`animate-fade-in-up stagger-${i + 1}`}
                                            sx={{
                                                height: '100%', textAlign: 'center',
                                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                '&:hover': { transform: 'translateY(-4px)' },
                                            }}
                                        >
                                            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                                                <Box sx={{
                                                    width: { xs: 52, md: 64 }, height: { xs: 52, md: 64 }, borderRadius: '14px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isDark ? 'rgba(0,173,181,0.1)' : 'rgba(59,172,182,0.1)',
                                                    color: 'primary.main', mx: 'auto', mb: 2,
                                                }}>
                                                    {f.icon}
                                                </Box>
                                                <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ fontSize: { xs: '0.8rem', md: '0.95rem' } }}>{f.title}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{f.desc}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Locations */}
                            {branches.length > 0 && (
                                <Box sx={{ mt: { xs: 6, md: 10 } }}>
                                    <Typography variant="h4" textAlign="center" sx={{ mb: 1 }}>Our Locations</Typography>
                                    <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: { xs: 4, md: 6 }, maxWidth: 420, mx: 'auto' }}>
                                        Find us across multiple branches — pick the one closest to you
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
                                                            border: `1px solid ${theme.palette.divider}`,
                                                            borderRadius: 3,
                                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] },
                                                        }}
                                                    >
                                                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                            <Box sx={{
                                                                width: 44, height: 44, borderRadius: '12px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.1)',
                                                                color: 'primary.main', mb: 2,
                                                            }}>
                                                                <LocationOnIcon />
                                                            </Box>
                                                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                                                {branch.name.split('—')[0].trim()}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                                                                {branch.address}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                                <Chip label={`${floorCount} Floor${floorCount !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                                                                {seatCount > 0 && <Chip label={`${seatCount} Seats`} size="small" variant="outlined" />}
                                                            </Box>
                                                            {branch.mapsUrl && (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<LocationOnIcon />}
                                                                    endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                                                                    onClick={() => window.open(branch.mapsUrl, '_blank', 'noopener,noreferrer')}
                                                                    sx={{ borderRadius: 2 }}
                                                                >
                                                                    View on Maps
                                                                </Button>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            )}

                            {/* CTA */}
                            <Box sx={{
                                mt: { xs: 6, md: 10 },
                                p: { xs: 4, md: 6 },
                                borderRadius: 4,
                                textAlign: 'center',
                                border: `1px solid ${theme.palette.divider}`,
                                background: isDark ? '#252833' : '#ffffff',
                            }}>
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Ready to Focus?</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Reserve your perfect study space now</Typography>
                                <Button variant="contained" size="large" onClick={() => navigate('/slots')} sx={{ px: 5 }}>
                                    Start Booking
                                </Button>
                            </Box>
                        </Container>
                    </Box>

                    {/* NEWS view */}
                    <Box sx={{ width: '50%', minWidth: '50%' }}>
                        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
                            <NewsFeed />
                        </Container>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default LandingPage;
