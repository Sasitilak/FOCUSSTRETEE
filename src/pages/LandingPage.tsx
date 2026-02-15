import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChairIcon from '@mui/icons-material/Chair';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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

    return (
        <Box>
            {/* Hero section */}
            <Box
                sx={{
                    minHeight: { xs: '65vh', md: '75vh' },
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                }}
            >
                {/* Subtle gradient orb */}
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
                            <Button
                                variant="outlined" size="large"
                                sx={{
                                    px: { xs: 3, md: 4 }, py: 1.5,
                                    borderColor: theme.palette.divider,
                                    color: 'text.primary',
                                    '&:hover': { borderColor: 'text.secondary', bgcolor: 'transparent' },
                                }}
                            >
                                Learn More
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
    );
};

export default LandingPage;
