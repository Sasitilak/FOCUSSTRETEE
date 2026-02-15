import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, TextField, MenuItem, Select, FormControl,
    InputLabel, LinearProgress, Button, Snackbar, Alert, useTheme,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import { getAdminBookings, revokeBooking } from '../../services/api';
import type { BookingResponse } from '../../types/booking';

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
    pending: 'warning', confirmed: 'success', rejected: 'error',
    cancelled: 'default', revoked: 'error', expired: 'info',
};

const AdminBookings: React.FC = () => {
    const theme = useTheme();
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [snack, setSnack] = useState('');
    const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const d = await getAdminBookings();
                setBookings(d);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleRevoke = (id: string) => {
        setConfirmRevoke(id);
    };

    const performRevoke = async () => {
        if (!confirmRevoke) return;
        const id = confirmRevoke;
        setConfirmRevoke(null);
        try {
            const updated = await revokeBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? updated : b));
            setSnack('Booking revoked successfully');
        } catch {
            setSnack('Failed to revoke booking');
        }
    };

    const filtered = bookings.filter(b => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (branchFilter !== 'all' && b.location.branch.toString() !== branchFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (b.customerName?.toLowerCase().includes(q) || false) ||
                (b.customerPhone?.includes(q) || false) ||
                b.id.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>All Bookings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage and track all bookings</Typography>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    size="small" placeholder="Search name, phone, ID..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                    sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="revoked">Revoked</MenuItem>
                        <MenuItem value="expired">Expired</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Branch</InputLabel>
                    <Select value={branchFilter} label="Branch" onChange={e => setBranchFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="1">Branch 1</MenuItem>
                        <MenuItem value="2">Branch 2</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Typography>
            </Paper>

            {loading ? <LinearProgress /> : (
                <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['ID', 'Customer', 'Phone', 'Branch', 'Fl/Rm', 'From', 'To', 'Amount', 'Status', 'Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map(b => (
                                <TableRow key={b.id} sx={{ '&:hover': { bgcolor: `${theme.palette.primary.main}04` } }}>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{b.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{b.customerName || '—'}</TableCell>
                                    <TableCell>{b.customerPhone || '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{b.location.branchName || `Branch ${b.location.branch}`}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>F{b.location.floor} / {b.location.roomNo}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{b.startDate || b.slotDate}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{b.endDate || '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>₹{b.amount}</TableCell>
                                    <TableCell>
                                        <Chip label={b.status} color={statusColor[b.status] ?? 'default'} size="small" sx={{ fontWeight: 500, textTransform: 'capitalize' }} />
                                    </TableCell>
                                    <TableCell>
                                        {b.status === 'confirmed' && (
                                            <Button
                                                size="small" color="error" variant="outlined"
                                                startIcon={<BlockIcon sx={{ fontSize: '14px !important' }} />}
                                                onClick={() => handleRevoke(b.id)}
                                                sx={{ fontSize: '0.7rem', py: 0.25, borderRadius: 1.5 }}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No bookings found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack('')}>
                <Alert severity="info" variant="filled" sx={{ borderRadius: 2 }}>{snack}</Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog
                open={!!confirmRevoke}
                onClose={() => setConfirmRevoke(null)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Revoke Booking?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to revoke booking <b>{confirmRevoke}</b>? This will cancel the seat and cannot be easily undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmRevoke(null)} sx={{ color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={performRevoke}
                        variant="contained"
                        color="error"
                        autoFocus
                        sx={{ borderRadius: 2 }}
                    >
                        Yes, Revoke
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminBookings;
