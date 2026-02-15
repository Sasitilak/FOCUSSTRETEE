import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Chip,
    Dialog, DialogTitle,
    DialogContent, TextField, DialogActions, Button,
    Snackbar, Alert, useTheme, IconButton, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { getAdminSeats, blockSeat, unblockSeat, createAdminBooking, sendWhatsAppConfirmation, getAdminBookings, revokeBooking } from '../../services/api';
import type { BookingResponse, Floor, Branch } from '../../types/booking';

interface SeatRow {
    id: number;
    seat_no: string;
    is_blocked: boolean;
    floor_id: number;
    branch_id: number;
    floor_number: number;
    branch_name: string;
    is_ac: boolean;
    room_name: string;
    room_no: string;
    price_daily: number;
}

const AdminSeats: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [seats, setSeats] = useState<SeatRow[]>([]);
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterBranch, setFilterBranch] = useState<number | null>(null);
    const [filterFloor, setFilterFloor] = useState<number | null>(null);

    // Booking Dialog state
    const [selectedSeat, setSelectedSeat] = useState<SeatRow | null>(null);
    const [bookingDialog, setBookingDialog] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(1, 'month'));
    const [submitting, setSubmitting] = useState(false);

    // Detail Dialog state
    const [detailsDialog, setDetailsDialog] = useState(false);

    const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [seatsData, bookingsData] = await Promise.all([
                getAdminSeats(),
                getAdminBookings()
            ]);
            setSeats(seatsData);
            setBookings(bookingsData);
        } catch (err) {
            console.error(err);
            setSnack({ msg: 'Failed to load seats', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat: any) => {
        // Handle both Seat and SeatRow types
        const seatRow = seats.find(s => s.seat_no === (seat.seat_no || seat.seatNo) && s.branch_id === (seat.branch_id || filterBranch) && s.floor_number === (seat.floor_number || filterFloor)) || seat;

        const booking = getSeatBooking(seatRow.seat_no, seatRow.branch_id, seatRow.floor_number);
        setSelectedSeat(seatRow);

        if (seatRow.is_blocked || booking) {
            setDetailsDialog(true);
        } else {
            setBookingDialog(true);
        }
    };

    const handleCreateBooking = async () => {
        if (!selectedSeat || !customerName || !customerPhone || !startDate || !endDate) return;
        setSubmitting(true);
        try {
            const location = {
                branch: selectedSeat.branch_id,
                floor: selectedSeat.floor_number,
                roomNo: selectedSeat.room_no, // Use actual room number for lookup
                seatNo: selectedSeat.seat_no,
                branchName: selectedSeat.branch_name,
                isAc: selectedSeat.is_ac
            };
            const start = startDate.format('YYYY-MM-DD');
            const end = endDate.format('YYYY-MM-DD');

            // Calculate duration and amount
            const days = endDate.diff(startDate, 'day') + 1;
            const amount = days * (selectedSeat.price_daily || 50);

            // Perform transactional booking creation
            let bookingId: string | null = null;
            try {
                const booking = await createAdminBooking({ name: customerName, phone: customerPhone, amount }, location, start, end);
                bookingId = booking.id;

                // Attempt to block the seat
                await blockSeat(selectedSeat.id);
            } catch (err: any) {
                // Rollback if booking was created but blocking failed
                if (bookingId) {
                    console.error("Blocking failed, rolling back booking:", bookingId);
                    await revokeBooking(bookingId).catch(console.error);
                }
                throw err; // Re-throw to be caught by outer catch
            }

            setSnack({ msg: 'Booking created and confirmed!', severity: 'success' });
            setBookingDialog(false);
            setCustomerName('');
            setCustomerPhone('');
            loadData();

            // Optional: WhatsApp
            const message = `Hello ${customerName}, your booking for Seat ${selectedSeat.seat_no} from ${start} to ${end} is confirmed.`;
            sendWhatsAppConfirmation(customerPhone, message).catch(console.error);
        } catch (err: any) {
            setSnack({ msg: err.message || 'Failed to create booking', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReleaseSeat = async () => {
        if (!selectedSeat) return;
        setSubmitting(true);
        try {
            const booking = getSeatBooking(selectedSeat.seat_no, selectedSeat.branch_id, selectedSeat.floor_number);

            if (booking) {
                // If there's a booking, revoke it (this also unblocks the seat in api.ts)
                await revokeBooking(booking.id);
                setSnack({ msg: 'Booking revoked and seat released', severity: 'success' });
            } else {
                // If just manually blocked
                await unblockSeat(selectedSeat.id);
                setSnack({ msg: 'Seat unblocked successfully', severity: 'success' });
            }

            setDetailsDialog(false);
            loadData();
        } catch (err: any) {
            setSnack({ msg: err.message || 'Failed to release seat', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getSeatBooking = (seatNo: string, branchId: number, floorNo: number) => {
        return bookings.find(b =>
            b.location.seatNo === seatNo &&
            b.location.branch === branchId &&
            b.location.floor === floorNo &&
            ['confirmed', 'pending'].includes(b.status)
        );
    };

    // Filters and derived metadata
    const branches = seats.reduce((acc: Branch[], s) => {
        if (!acc.find(b => b.id === s.branch_id)) {
            const branchFloors = Array.from({ length: Math.max(...seats.filter(st => st.branch_id === s.branch_id).map(st => st.floor_number)) }, (_, i) => {
                const floorNumber = i + 1;
                return {
                    floorNumber: floorNumber,
                    rooms: [], // Placeholder for mapping
                };
            });

            acc.push({
                id: s.branch_id,
                name: s.branch_name,
                address: '',
                floors: branchFloors as Floor[]
            });
        }
        return acc;
    }, []);

    const floorNumbers = filterBranch
        ? [...new Set(seats.filter(s => s.branch_id === filterBranch).map(s => s.floor_number))].sort()
        : [];

    const filtered = seats
        .filter(s => !filterBranch || s.branch_id === filterBranch)
        .filter(s => !filterFloor || s.floor_number === filterFloor);

    const blockedCount = filtered.filter(s => s.is_blocked).length;
    const rooms = [...new Set(filtered.map(s => s.room_name))];

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
        </Box>
    );

    const activeBooking = selectedSeat ? getSeatBooking(selectedSeat.seat_no, selectedSeat.branch_id, selectedSeat.floor_number) : null;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>Seat Management</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage occupancy and create admin bookings for walk-in customers.
                </Typography>

                {/* Branch filter */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Branch</Typography>
                    <ToggleButtonGroup
                        value={filterBranch}
                        exclusive
                        onChange={(_, v) => { setFilterBranch(v); setFilterFloor(null); }}
                        size="small"
                    >
                        {branches.map(b => (
                            <ToggleButton key={b.id} value={b.id} sx={{ px: 2, textTransform: 'none', fontSize: '0.8rem' }}>
                                {b.name?.split('—')[0]?.trim() ?? `Branch ${b.id}`}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                {/* Floor filter */}
                {filterBranch && floorNumbers.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Floor</Typography>
                        <ToggleButtonGroup
                            value={filterFloor}
                            exclusive
                            onChange={(_, v) => setFilterFloor(v)}
                            size="small"
                        >
                            {floorNumbers.map(f => (
                                <ToggleButton key={f} value={f} sx={{ px: 2, textTransform: 'none', fontSize: '0.8rem' }}>
                                    Floor {f}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                )}

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                    <Chip label={`${filtered.length} total`} variant="outlined" size="small" />
                    <Chip label={`${blockedCount} occupied/blocked`} color="info" variant="outlined" size="small" icon={<BlockIcon />} />
                    <Chip label={`${filtered.length - blockedCount} available`} color="success" variant="outlined" size="small" icon={<CheckCircleOutlineIcon />} />
                </Box>

                {/* Seat grid */}
                {!filterBranch ? (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Select a branch to manage seats
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {!filterFloor ? (
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Select a floor to manage seats
                                </Typography>
                            </Paper>
                        ) : (
                            rooms.map(roomName => (
                                <Box key={roomName}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                                        {roomName}
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                            gap: 1.5,
                                        }}>
                                            {filtered.filter(s => s.room_name === roomName).map(seat => {
                                                const booking = getSeatBooking(seat.seat_no, seat.branch_id, seat.floor_number);
                                                return (
                                                    <Box
                                                        key={seat.id}
                                                        onClick={() => handleSeatClick(seat)}
                                                        sx={{
                                                            p: 1.2, borderRadius: 2, textAlign: 'center',
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: (seat.is_blocked || booking) ? 'error.main' : theme.palette.divider,
                                                            bgcolor: (seat.is_blocked || booking)
                                                                ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
                                                                : 'background.paper',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.05)',
                                                                boxShadow: theme.shadows[2],
                                                            },
                                                        }}
                                                    >
                                                        <Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>
                                                            {seat.seat_no}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: (seat.is_blocked || booking) ? 'error.main' : 'success.main', fontWeight: (seat.is_blocked || booking) ? 700 : 400 }}>
                                                            {booking ? (booking.status === 'pending' ? 'Pending' : 'Booked') : (seat.is_blocked ? 'Blocked' : 'Free')}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Paper>
                                </Box>
                            ))
                        )}
                    </Box>
                )}

                {/* Booking Dialog */}
                <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Offline Booking</DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Typography variant="caption" color="text.secondary">Location</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {selectedSeat?.branch_name} — Floor {selectedSeat?.floor_number}, Seat {selectedSeat?.seat_no}
                                </Typography>
                            </Box>
                            <TextField
                                label="Customer Name"
                                fullWidth
                                variant="outlined"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                            <TextField
                                label="Phone Number"
                                fullWidth
                                variant="outlined"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="e.g. 919876543210"
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(v) => setStartDate(v)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(v) => setEndDate(v)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setBookingDialog(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateBooking}
                            disabled={submitting || !customerName || !customerPhone}
                        >
                            {submitting ? 'Confirming...' : 'Confirm Booking'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Detail/Release Dialog */}
                <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Seat Details
                        <IconButton size="small" onClick={() => setDetailsDialog(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Box sx={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    bgcolor: 'primary.main', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '1.2rem'
                                }}>
                                    {selectedSeat?.seat_no}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>Seat {selectedSeat?.seat_no}</Typography>
                                    <Typography variant="body2" color="text.secondary">{selectedSeat?.branch_name} — Floor {selectedSeat?.floor_number}</Typography>
                                </Box>
                            </Box>

                            {activeBooking ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <PersonIcon color="action" />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Occupant</Typography>
                                            <Typography variant="body2" fontWeight={600}>{activeBooking.customerName || 'N/A'}</Typography>
                                            <Typography variant="caption" color="text.secondary">{activeBooking.customerPhone || 'N/A'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <CalendarMonthIcon color="action" />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Booking Period</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                From: {activeBooking.startDate ? dayjs(activeBooking.startDate).format('MMM D, YYYY') : dayjs(activeBooking.slotDate).format('MMM D, YYYY')}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                To: {activeBooking.endDate ? dayjs(activeBooking.endDate).format('MMM D, YYYY') : '—'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="error">
                                    No active booking found. This seat is manually blocked.
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button color="error" variant="contained" onClick={handleReleaseSeat} disabled={submitting}>
                            {submitting ? 'Processing...' : (activeBooking ? 'Revoke Booking' : 'Unblock Seat')}
                        </Button>
                        <Button variant="outlined" onClick={() => setDetailsDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {snack && (
                    <Snackbar open autoHideDuration={4000} onClose={() => setSnack(null)}>
                        <Alert severity={snack.severity} sx={{ width: '100%', borderRadius: 3 }}>
                            {snack.msg}
                        </Alert>
                    </Snackbar>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default AdminSeats;
