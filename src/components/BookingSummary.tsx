import React from 'react';
import { Paper, Typography, Box, Divider, Chip, useTheme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChairIcon from '@mui/icons-material/Chair';
import { useBooking } from '../context/BookingContext';

const BookingSummary: React.FC<{ showPrice?: boolean }> = ({ showPrice = true }) => {
    const { selectedDate, selectedSlot, selectedLocation } = useBooking();
    const theme = useTheme();
    if (!selectedDate || !selectedSlot) return null;

    const isRange = selectedDate.includes(' to ');
    let displayDate = selectedDate;
    if (isRange) {
        const [f, t] = selectedDate.split(' to ');
        displayDate = `${new Date(f).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(t).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    const rows = [
        { icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />, label: isRange ? 'Period' : 'Date', value: displayDate },
        { icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />, label: 'Duration', value: selectedSlot.time },
        ...(selectedLocation ? [
            { icon: <LocationOnIcon sx={{ fontSize: 18 }} />, label: 'Location', value: `Branch ${selectedLocation.branch} · Floor ${selectedLocation.floor} · Room ${selectedLocation.roomNo}` },
            { icon: <ChairIcon sx={{ fontSize: 18 }} />, label: 'Seat', value: selectedLocation.seatNo },
        ] : []),
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark' ? 'rgba(19,25,39,0.6)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Booking Summary</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {rows.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ color: 'primary.main' }}>{r.icon}</Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {r.label === 'Seat' ? <Chip label={r.value} size="small" color="primary" sx={{ fontWeight: 600 }} /> : r.value}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
            {showPrice && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Total</Typography>
                        <Typography variant="h5" fontWeight={700} color="primary.main">₹{selectedSlot.price}</Typography>
                    </Box>
                </>
            )}
        </Paper>
    );
};

export default BookingSummary;
