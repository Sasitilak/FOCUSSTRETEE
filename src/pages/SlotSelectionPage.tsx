import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Container, Typography, Grid, Button, Paper, Alert, useTheme,
    MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useBooking } from '../context/BookingContext';
import { getHolidays } from '../services/api';
import type { Holiday } from '../types/booking';

const SlotSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { setSelectedDate, setSelectedSlot } = useBooking();

    const [months, setMonths] = useState(0);
    const [weeks, setWeeks] = useState(1);
    const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { getHolidays().then(setHolidays).catch(console.error); }, []);

    useEffect(() => {
        if (weeks >= 4) { setMonths(m => m + 1); setWeeks(0); }
    }, [weeks]);

    const toDate = useMemo(() => {
        if (!fromDate) return null;
        let date = fromDate;
        if (months > 0) date = date.add(months, 'month');
        if (weeks > 0) date = date.add(weeks, 'week');
        return date;
    }, [fromDate, months, weeks]);

    const totalDays = useMemo(() => {
        if (!fromDate || !toDate) return 0;
        return toDate.diff(fromDate, 'day') + 1;
    }, [fromDate, toDate]);

    useEffect(() => {
        setError(totalDays > 0 && totalDays < 7 ? 'Minimum booking period is 1 week' : null);
    }, [totalDays]);

    const shouldDisableDate = (date: Dayjs) => {
        return holidays.some(h => h.date === date.format('YYYY-MM-DD') && h.branchId === null);
    };

    const durationParts: string[] = [];
    if (months > 0) durationParts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (weeks > 0) durationParts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
    const durationLabel = durationParts.join(' + ') || 'Select duration';

    const handleContinue = () => {
        if (!fromDate || !toDate || error || totalDays < 7) return;
        setSelectedDate(`${fromDate.format('YYYY-MM-DD')} to ${toDate.format('YYYY-MM-DD')}`);
        setSelectedSlot({
            id: `slot-${fromDate.format('YYYYMMDD')}-${toDate.format('YYYYMMDD')}`,
            time: durationLabel,
            available: true,
            price: 0,
            durationDays: totalDays,
            effectiveWeeks: months * 4 + weeks,
        });
        navigate('/location');
    };

    const valid = fromDate && !error && totalDays >= 7;

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
            <Box className="animate-fade-in-up" sx={{ mb: 4 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2, fontSize: '0.65rem' }}>Step 1 of 4</Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>Select your duration</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 500 }}>
                    Choose how long you'd like to book. Room pricing will be shown in the next step.
                </Typography>
            </Box>

            <Grid container spacing={3} justifyContent="center">
                <Grid size={{ xs: 12, md: 7 }}>
                    {/* Duration */}
                    <Paper
                        elevation={0}
                        className="animate-fade-in-up stagger-1"
                        sx={{ p: { xs: 3, md: 4 }, mb: 2.5, border: `1px solid ${theme.palette.divider}` }}
                    >
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2.5 }}>Duration</Typography>

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Months</InputLabel>
                                    <Select value={months} label="Months" onChange={e => setMonths(Number(e.target.value))}>
                                        {[0, 1, 2, 3, 4, 5, 6].map(m => (
                                            <MenuItem key={m} value={m}>{m === 0 ? '0 months' : `${m} month${m > 1 ? 's' : ''}`}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Weeks</InputLabel>
                                    <Select value={weeks} label="Weeks" onChange={e => setWeeks(Number(e.target.value))}>
                                        {[0, 1, 2, 3, 4].map(w => (
                                            <MenuItem key={w} value={w}>{w === 0 ? '0 weeks' : w === 4 ? '4 weeks (1 month)' : `${w} week${w > 1 ? 's' : ''}`}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {totalDays > 0 && (
                            <Box sx={{
                                mt: 2.5, p: 2, borderRadius: 2,
                                bgcolor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.03)',
                                border: `1px solid ${isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)'}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                                    <Typography variant="body1" fontWeight={600}>{durationLabel}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">Total</Typography>
                                    <Typography variant="body1" fontWeight={600} color="primary.main">{totalDays} days</Typography>
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    {/* Start date */}
                    <Paper
                        elevation={0}
                        className="animate-fade-in-up stagger-2"
                        sx={{ p: { xs: 3, md: 4 }, border: `1px solid ${theme.palette.divider}` }}
                    >
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2.5 }}>Start date</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>From</Typography>
                                    <DatePicker
                                        value={fromDate}
                                        onChange={v => setFromDate(v)}
                                        shouldDisableDate={shouldDisableDate}
                                        format="DD/MM/YYYY"
                                        minDate={dayjs()}
                                        maxDate={dayjs().add(90, 'day')}
                                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>To (calculated)</Typography>
                                    <DatePicker
                                        value={toDate}
                                        readOnly
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true, size: 'small',
                                                sx: { '& .MuiOutlinedInput-root': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' } }
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </LocalizationProvider>
                        {error && <Alert severity="error" sx={{ mt: 2.5 }}>{error}</Alert>}
                    </Paper>
                </Grid>
            </Grid>

            {valid && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button variant="contained" size="large" onClick={handleContinue} endIcon={<ArrowForwardIcon />} sx={{ px: 5, py: 1.4 }}>
                        Continue
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default SlotSelectionPage;
