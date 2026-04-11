import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Alert, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookingSummary from '../components/BookingSummary';
import { useBooking } from '../context/BookingContext';

const BookingDetailsPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { selectedSlot, selectedLocation, bookingDetails, setBookingDetails } = useBooking();
    const [form, setForm] = useState({ name: bookingDetails?.name || '', phone: bookingDetails?.phone || '', email: bookingDetails?.email || '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => { if (!selectedSlot || !selectedLocation) navigate('/slots'); }, [selectedSlot, selectedLocation, navigate]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.phone.trim()) e.phone = 'Required';
        else if (!/^[+]?[\d\s-]{10,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Invalid phone';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        return e;
    };

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length === 0) {
            setBookingDetails({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined });
            navigate('/payment');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            <Box className="animate-fade-in-up">
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/location')} sx={{ mb: 2, color: 'text.secondary', px: 0 }}>Back</Button>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2, fontSize: '0.65rem' }}>Step 3 of 4</Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>Your details</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>We'll send your confirmation on WhatsApp</Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} className="animate-fade-in-up stagger-1" sx={{ p: { xs: 3, md: 4 }, border: `1px solid ${theme.palette.divider}` }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField size="small" fullWidth label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={!!errors.name} helperText={errors.name} required />
                                <TextField size="small" fullWidth label="Phone Number" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} error={!!errors.phone} helperText={errors.phone || 'For WhatsApp confirmation'} required />
                                <TextField size="small" fullWidth label="Email (optional)" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={!!errors.email} helperText={errors.email} />
                                <Alert severity="info" sx={{ fontSize: '0.82rem' }}>Your info is only used for booking confirmation.</Alert>
                                <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, py: 1.3 }}>
                                    Continue to payment
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ position: 'sticky', top: 90 }}><BookingSummary /></Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BookingDetailsPage;
