import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Button, Paper, Alert, useTheme } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useBooking } from '../context/BookingContext';

const SlotSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { setSelectedDate, setSelectedSlot } = useBooking();
    const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
    const [toDate, setToDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
    const [error, setError] = useState<string | null>(null);

    const days = fromDate && toDate ? toDate.diff(fromDate, 'day') + 1 : 0;
    const pricePerDay = 50;
    const total = days * pricePerDay;

    useEffect(() => {
        setError(fromDate && toDate && toDate.isBefore(fromDate) ? 'End date cannot be before start date' : null);
    }, [fromDate, toDate]);

    const handleContinue = () => {
        if (!fromDate || !toDate || error) return;
        setSelectedDate(`${fromDate.format('YYYY-MM-DD')} to ${toDate.format('YYYY-MM-DD')}`);
        setSelectedSlot({ id: `slot-${fromDate.format('YYYYMMDD')}-${toDate.format('YYYYMMDD')}`, time: `${days} day${days > 1 ? 's' : ''}`, available: true, price: total });
        navigate('/location');
    };

    const valid = fromDate && toDate && !error && days > 0;

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>
            <Box className="animate-fade-in-up" sx={{ mb: 4 }}>
                <Typography variant="h3" gutterBottom>Select Your Dates</Typography>
                <Typography color="text.secondary">Choose your booking period</Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} className="animate-fade-in-up stagger-1" sx={{ p: 4, border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <CalendarMonthIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>Booking Period</Typography>
                        </Box>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>From</Typography>
                                    <DatePicker value={fromDate} onChange={v => setFromDate(v)} format="DD/MM/YYYY" minDate={dayjs()} maxDate={dayjs().add(90, 'day')} slotProps={{ textField: { fullWidth: true } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>To</Typography>
                                    <DatePicker value={toDate} onChange={v => setToDate(v)} format="DD/MM/YYYY" minDate={fromDate || dayjs()} maxDate={dayjs().add(90, 'day')} slotProps={{ textField: { fullWidth: true } }} />
                                </Grid>
                            </Grid>
                        </LocalizationProvider>
                        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} className="animate-fade-in-up stagger-2" sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>Summary</Typography>
                        {fromDate && toDate && !error && (
                            <>
                                {[
                                    { l: 'From', v: fromDate.format('ddd, MMM D, YYYY') },
                                    { l: 'To', v: toDate.format('ddd, MMM D, YYYY') },
                                    { l: 'Duration', v: `${days} day${days > 1 ? 's' : ''}` },
                                ].map((r, i) => (
                                    <Box key={i} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary">{r.l}</Typography>
                                        <Typography variant="body1" fontWeight={500}>{r.v}</Typography>
                                    </Box>
                                ))}
                                <Box sx={{ pt: 2, mt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">₹{pricePerDay} × {days} days</Typography>
                                        <Typography>₹{total}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="h6" fontWeight={600}>Total</Typography>
                                        <Typography variant="h5" fontWeight={700} color="primary.main">₹{total}</Typography>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {valid && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <Button variant="contained" size="large" onClick={handleContinue} endIcon={<ArrowForwardIcon />} sx={{ px: 6, py: 1.5 }}>
                        Continue — {days} day{days > 1 ? 's' : ''} (₹{total})
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default SlotSelectionPage;
