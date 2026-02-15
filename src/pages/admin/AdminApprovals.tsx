import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Grid, Button,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    LinearProgress, Alert, Snackbar, useTheme, DialogContentText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';
import { getAdminBookings, approveBooking, rejectBooking } from '../../services/api';
import type { BookingResponse } from '../../types/booking';

const AdminApprovals: React.FC = () => {
    const theme = useTheme();
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [viewScreenshot, setViewScreenshot] = useState<BookingResponse | null>(null);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });
    const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);

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

    const pending = bookings.filter(b => b.status === 'pending');

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await approveBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
            setSnack({ open: true, msg: `Booking approved & WhatsApp confirmation sent!`, severity: 'success' });
        } catch (err: any) {
            setSnack({ open: true, msg: err.message || 'Approval failed', severity: 'error' });
        }
        setProcessing(null);
    };

    const handleReject = async (id: string) => {
        setProcessing(id);
        try {
            await rejectBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' as const } : b));
            setSnack({ open: true, msg: `Booking rejected`, severity: 'success' });
        } catch (err: any) {
            setSnack({ open: true, msg: err.message || 'Rejection failed', severity: 'error' });
        }
        setProcessing(null);
    };

    const confirmAndExecute = () => {
        if (!confirmAction) return;
        const { id, type } = confirmAction;
        setConfirmAction(null);
        if (type === 'approve') handleApprove(id);
        else handleReject(id);
    };

    if (loading) return <Box><LinearProgress /></Box>;

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Payment Approvals</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Review payment screenshots and approve or reject bookings</Typography>
            <Chip label={`${pending.length} pending`} color="warning" size="small" sx={{ mb: 3, fontWeight: 500 }} />

            {pending.length === 0 ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600}>All caught up!</Typography>
                    <Typography variant="body2" color="text.secondary">No pending approvals right now</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {pending.map((b, i) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                            <Card
                                className={`animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
                                sx={{ border: `1px solid ${theme.palette.divider}`, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-3px)' } }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                        <Chip label="Pending" color="warning" size="small" />
                                    </Box>

                                    <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>

                                    <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                        {[
                                            ['Date', b.slotDate],
                                            ['Plan', b.slotTime],
                                            ['Amount', `₹${b.amount}`],
                                        ].map(([k, v]) => (
                                            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">{k}</Typography>
                                                <Typography variant="body2" fontWeight={500}>{v}</Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    <Button
                                        fullWidth variant="outlined" size="small"
                                        startIcon={<ImageIcon />}
                                        onClick={() => setViewScreenshot(b)}
                                        disabled={!b.paymentScreenshotUrl}
                                        sx={{ mb: 2 }}
                                    >
                                        {b.paymentScreenshotUrl ? 'View Screenshot' : 'No Screenshot'}
                                    </Button>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            fullWidth variant="contained" color="success" size="small"
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => setConfirmAction({ id: b.id, type: 'approve' })}
                                            disabled={processing === b.id}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            fullWidth variant="outlined" color="error" size="small"
                                            startIcon={<CancelIcon />}
                                            onClick={() => setConfirmAction({ id: b.id, type: 'reject' })}
                                            disabled={processing === b.id}
                                        >
                                            Reject
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Screenshot Dialog */}
            <Dialog open={!!viewScreenshot} onClose={() => setViewScreenshot(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Payment Screenshot</DialogTitle>
                <DialogContent>
                    {viewScreenshot?.paymentScreenshotUrl ? (
                        <Box component="img" src={viewScreenshot.paymentScreenshotUrl} alt="Payment screenshot"
                            sx={{ width: '100%', borderRadius: 2, mt: 1 }} />
                    ) : (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography color="text.secondary">No screenshot uploaded</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setViewScreenshot(null)}>Close</Button>
                    <Button variant="contained" color="success" onClick={() => { setConfirmAction({ id: viewScreenshot!.id, type: 'approve' }); setViewScreenshot(null); }}>Approve</Button>
                    <Button variant="outlined" color="error" onClick={() => { setConfirmAction({ id: viewScreenshot!.id, type: 'reject' }); setViewScreenshot(null); }}>Reject</Button>
                </DialogActions>
            </Dialog>

            {/* Action Confirmation Dialog */}
            <Dialog
                open={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {confirmAction?.type === 'approve' ? 'Confirm Approval?' : 'Confirm Rejection?'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmAction?.type === 'approve'
                            ? `Are you sure you want to approve booking ${confirmAction?.id}? This will confirm the seat and send a WhatsApp notification to the customer.`
                            : `Are you sure you want to reject booking ${confirmAction?.id}? The customer will be notified that their booking was not successful.`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmAction(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={confirmAndExecute}
                        variant="contained"
                        color={confirmAction?.type === 'approve' ? 'success' : 'error'}
                        sx={{ borderRadius: 2 }}
                    >
                        Yes, {confirmAction?.type === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminApprovals;
