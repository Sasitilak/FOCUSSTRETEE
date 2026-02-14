import React, { useEffect } from 'react';
import { Box, Container, Typography, Button, Paper, Divider, Chip, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import HomeIcon from '@mui/icons-material/Home';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChairIcon from '@mui/icons-material/Chair';
import { useBooking } from '../context/BookingContext';

const ConfirmationPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { booking, selectedSlot, selectedLocation, selectedDate, resetBooking } = useBooking();

    useEffect(() => { if (!booking) navigate('/'); }, [booking, navigate]);

    const handleNew = () => { resetBooking(); navigate('/'); };

    const formatDate = () => {
        if (!selectedDate) return '';
        if (selectedDate.includes(' to ')) {
            const [f, t] = selectedDate.split(' to ');
            return `${new Date(f).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(t).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return selectedDate;
    };

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper
                elevation={0}
                className="animate-scale-in"
                sx={{
                    p: { xs: 4, md: 6 }, textAlign: 'center',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.2)' : 'rgba(250,204,21,0.4)'}`,
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(180deg, rgba(250,204,21,0.06) 0%, rgba(19,25,39,1) 100%)'
                        : 'linear-gradient(180deg, rgba(250,204,21,0.06) 0%, #fff 100%)',
                }}
            >
                {/* Pending Icon */}
                <Box sx={{
                    width: 96, height: 96, borderRadius: '50%', mx: 'auto', mb: 3,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'pulse 2s ease-in-out infinite',
                }}>
                    <HourglassTopIcon sx={{ fontSize: 48, color: '#fff' }} />
                </Box>

                <Typography variant="h3" fontWeight={700} gutterBottom>Booking Submitted!</Typography>
                <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.7 }}>
                    Your payment screenshot has been received. We will verify it and confirm your booking.
                </Typography>

                <Chip label={`Booking ID: ${booking?.id}`} color="warning" sx={{ fontWeight: 600, fontSize: '0.9rem', px: 1, py: 2.5, mb: 4 }} />

                <Divider sx={{ my: 3 }} />

                {/* Details */}
                <Box sx={{ textAlign: 'left', mx: 'auto', maxWidth: 320 }}>
                    {[
                        { icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />, label: 'Period', value: formatDate() },
                        { icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />, label: 'Duration', value: selectedSlot?.time },
                        { icon: <LocationOnIcon sx={{ fontSize: 18 }} />, label: 'Location', value: selectedLocation ? `Branch ${selectedLocation.branch} · Fl ${selectedLocation.floor} · Rm ${selectedLocation.roomNo}` : '' },
                        { icon: <ChairIcon sx={{ fontSize: 18 }} />, label: 'Seat', value: selectedLocation?.seatNo },
                    ].map((r, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box sx={{ color: 'primary.main' }}>{r.icon}</Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                                <Typography variant="body2" fontWeight={500}>{r.value}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
                    <WhatsAppIcon sx={{ color: '#25D366' }} />
                    <Typography variant="body2" color="text.secondary">
                        You'll be notified on WhatsApp once confirmed
                    </Typography>
                </Box>

                <Button variant="contained" size="large" startIcon={<HomeIcon />} onClick={handleNew} sx={{ px: 4 }}>
                    Back to Home
                </Button>
            </Paper>
        </Container>
    );
};

export default ConfirmationPage;
