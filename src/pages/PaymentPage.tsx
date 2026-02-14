import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Container, Typography, Button, Grid, Paper, Divider,
    CircularProgress, Alert, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import BookingSummary from '../components/BookingSummary';
import { createBooking } from '../services/api';
import { useBooking } from '../context/BookingContext';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const fileRef = useRef<HTMLInputElement>(null);
    const {
        selectedSlot, selectedDate, selectedLocation, bookingDetails,
        paymentScreenshot, setPaymentScreenshot,
        setBooking, setPaymentStatus,
    } = useBooking();

    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedSlot || !selectedLocation || !bookingDetails) navigate('/slots');
    }, [selectedSlot, selectedLocation, bookingDetails, navigate]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentScreenshot(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!paymentScreenshot) { setError('Please upload your payment screenshot'); return; }
        if (!selectedSlot || !selectedDate || !selectedLocation || !bookingDetails) return;
        setSubmitting(true);
        setError(null);
        try {
            const booking = await createBooking(selectedSlot.id, selectedDate, selectedLocation, bookingDetails, paymentScreenshot);
            setBooking(booking);
            setPaymentStatus('success');
            navigate('/confirmation');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Box className="animate-fade-in-up">
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/details')} sx={{ mb: 2, color: 'text.secondary' }} disabled={submitting}>Back</Button>
                <Typography variant="h3" gutterBottom>Complete Payment</Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>Pay via UPI and upload the screenshot</Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                    {/* Payment Info */}
                    <Paper elevation={0} className="animate-fade-in-up stagger-1" sx={{ p: 4, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Payment Details</Typography>

                        <Box sx={{ p: 3, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)', border: `1px dashed ${theme.palette.primary.main}40`, mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>Pay to UPI</Typography>
                            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'monospace' }}>studyspot@upi</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Amount: <b>₹{selectedSlot?.price}</b>
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Screenshot Upload */}
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upload Payment Screenshot</Typography>
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

                        {preview ? (
                            <Box sx={{ position: 'relative' }}>
                                <Box
                                    component="img"
                                    src={preview}
                                    alt="Payment screenshot"
                                    sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                                    <Typography variant="body2" color="success.main" fontWeight={500}>Screenshot uploaded</Typography>
                                    <Button size="small" onClick={() => fileRef.current?.click()} sx={{ ml: 'auto' }}>Change</Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box
                                onClick={() => fileRef.current?.click()}
                                sx={{
                                    p: 5, borderRadius: 3, border: `2px dashed ${theme.palette.divider}`,
                                    textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: `${theme.palette.primary.main}05` },
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                <Typography variant="body1" fontWeight={500}>Click to upload screenshot</Typography>
                                <Typography variant="caption" color="text.secondary">PNG, JPG up to 5MB</Typography>
                            </Box>
                        )}

                        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

                        <Button
                            fullWidth variant="contained" size="large" onClick={handleSubmit}
                            disabled={submitting || !paymentScreenshot}
                            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ImageIcon />}
                            sx={{ mt: 3, py: 1.8, fontSize: '1rem' }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Booking'}
                        </Button>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ position: 'sticky', top: 90 }}>
                        <BookingSummary />
                        <Paper elevation={0} sx={{ p: 3, mt: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.08)' : '#fffbeb', border: '1px solid #fbbf24' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#92400e', mb: 0.5 }}>💡 How it works</Typography>
                            <Typography variant="body2" sx={{ color: '#78350f' }}>
                                Pay the amount via UPI, take a screenshot, and upload it here. We'll verify your payment and confirm your booking via WhatsApp.
                            </Typography>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PaymentPage;
