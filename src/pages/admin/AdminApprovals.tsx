import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Grid, Button,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    LinearProgress, Alert, Snackbar, useTheme, DialogContentText, Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { getAdminBookings, approveBooking, rejectBooking, getBranches } from '../../services/api';
import type { BookingResponse, Branch } from '../../types/booking';

// ─── WhatsApp helpers ────────────────────────────────────────────────────────

const buildWhatsAppLink = (phone: string, message: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

const buildLocationText = (b: BookingResponse): string => {
    const branch = b.location?.branchName ?? `Branch ${b.location?.branch ?? ''}`;
    const floor = b.location?.floor ? `Floor ${b.location.floor}` : '';
    return [branch, floor].filter(Boolean).join(', ');
};

const buildConfirmationMessage = (b: BookingResponse, mapsUrl?: string): string => {
    const location = buildLocationText(b);
    const mapsLine = mapsUrl ? `\nLocation: ${mapsUrl}` : '';
    return `Hello ${b.customerName ?? 'Customer'},

Thank you for booking with AcumenHive.

Your booking for ${location} has been confirmed.${mapsLine}

Booking ID: ${b.id}
Amount Paid: ₹${b.amount}

We look forward to serving you.`;
};

const buildRejectionMessage = (b: BookingResponse): string => {
    const location = buildLocationText(b);
    return `Hello ${b.customerName ?? 'Customer'},

Thank you for your booking request with AcumenHive.

Unfortunately, your request for ${location} could not be approved at this time.

Reference ID: ${b.id}

You may submit a new request or contact support if needed.`;
};

const openWhatsApp = (b: BookingResponse, type: 'approved' | 'rejected', mapsUrl?: string) => {
    const msg = type === 'approved' ? buildConfirmationMessage(b, mapsUrl) : buildRejectionMessage(b);
    const link = buildWhatsAppLink(b.customerPhone ?? '', msg);
    window.open(link, '_blank');
};

// ─── Reusable WhatsApp button ─────────────────────────────────────────────────

const WhatsAppButton = ({ booking, type, label, mapsUrl }: { booking: BookingResponse; type: 'approved' | 'rejected'; label: string; mapsUrl?: string }) => (
    <Button
        fullWidth
        variant="contained"
        size="small"
        startIcon={<WhatsAppIcon />}
        onClick={() => openWhatsApp(booking, type, mapsUrl)}
        sx={{
            bgcolor: '#25D366',
            '&:hover': { bgcolor: '#1ebe5d' },
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2,
        }}
    >
        {label}
    </Button>
);

// ─── Booking info rows ────────────────────────────────────────────────────────

const BookingInfoBox = ({ b, theme }: { b: BookingResponse; theme: any }) => (
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
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminApprovals: React.FC = () => {
    const theme = useTheme();
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [viewScreenshot, setViewScreenshot] = useState<BookingResponse | null>(null);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });
    const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
    // Tracks bookings acted on THIS session (cleared on page leave/refresh)
    const [sessionProcessed, setSessionProcessed] = useState<{ [id: string]: 'approved' | 'rejected' }>({});

    const getMapsUrl = (b: BookingResponse) =>
        branches.find(br => br.id === b.location?.branch)?.mapsUrl;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [d, br] = await Promise.all([getAdminBookings(), getBranches()]);
                setBookings(d);
                setBranches(br);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const pending = bookings.filter(b => b.status === 'pending');
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    // Bookings acted on this session (for "recently processed" strip)
    const recentlyProcessed = bookings.filter(b => sessionProcessed[b.id]);

    const handleApprove = async (id: string) => {
        setProcessing(id);
        try {
            await approveBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
            setSessionProcessed(prev => ({ ...prev, [id]: 'approved' }));
            setSnack({ open: true, msg: 'Booking approved! WhatsApp should have opened.', severity: 'success' });
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
            setSessionProcessed(prev => ({ ...prev, [id]: 'rejected' }));
            setSnack({ open: true, msg: 'Booking rejected. WhatsApp should have opened.', severity: 'success' });
        } catch (err: any) {
            setSnack({ open: true, msg: err.message || 'Rejection failed', severity: 'error' });
        }
        setProcessing(null);
    };

    // KEY FIX: open WhatsApp SYNCHRONOUSLY (before any await) so browser doesn't block it
    const confirmAndExecute = () => {
        if (!confirmAction) return;
        const { id, type } = confirmAction;
        const booking = bookings.find(b => b.id === id);

        // ✅ Open WhatsApp RIGHT HERE — synchronous, direct user gesture, never blocked
        if (booking) {
            openWhatsApp(booking, type === 'approve' ? 'approved' : 'rejected', getMapsUrl(booking));
        }

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

            {/* ── PENDING SECTION ── */}
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
                                    <BookingInfoBox b={b} theme={theme} />
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

            {/* ── RECENTLY PROCESSED (session only, gone on page leave) ── */}
            {recentlyProcessed.length > 0 && (
                <Box sx={{ mt: 5 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                        Just Processed — Send Again?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        These were processed this session. Click to re-send the WhatsApp message if needed. This section resets when you leave the page.
                    </Typography>
                    <Grid container spacing={2}>
                        {recentlyProcessed.map((b) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                                <Card sx={{
                                    border: `2px solid ${sessionProcessed[b.id] === 'approved' ? '#25D366' : theme.palette.error.main}`,
                                    borderRadius: 3,
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                            <Chip
                                                label={sessionProcessed[b.id] === 'approved' ? 'Confirmed' : 'Rejected'}
                                                color={sessionProcessed[b.id] === 'approved' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>
                                        <BookingInfoBox b={b} theme={theme} />
                                        <WhatsAppButton
                                            booking={b}
                                            type={sessionProcessed[b.id]}
                                            label={`Send Again to ${(b.customerName ?? 'Customer').split(' ')[0]}`}
                                            mapsUrl={getMapsUrl(b)}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* ── APPROVED HISTORY ── */}
            {confirmed.length > 0 && (
                <Box sx={{ mt: 5 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>Approved Bookings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        All confirmed bookings. Use "Send Again" if the customer didn't receive the message.
                    </Typography>
                    <Grid container spacing={2}>
                        {confirmed.map((b) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                                <Card sx={{ border: `1px solid ${theme.palette.divider}`, opacity: 0.9 }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                            <Chip label="Confirmed" color="success" size="small" />
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>
                                        <BookingInfoBox b={b} theme={theme} />
                                        <WhatsAppButton
                                            booking={b}
                                            type="approved"
                                            label={`Send Again to ${(b.customerName ?? 'Customer').split(' ')[0]}`}
                                            mapsUrl={getMapsUrl(b)}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* ── Screenshot Dialog ── */}
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

            {/* ── Confirm Dialog ── */}
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
                            ? `Approve this booking? WhatsApp will open immediately so you can send the confirmation.`
                            : `Reject this booking? WhatsApp will open immediately so you can notify the customer.`
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
                        startIcon={<WhatsAppIcon />}
                    >
                        Yes — {confirmAction?.type === 'approve' ? 'Approve & Open WhatsApp' : 'Reject & Open WhatsApp'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(p => ({ ...p, open: false }))}>
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminApprovals;
