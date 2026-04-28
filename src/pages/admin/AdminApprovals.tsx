import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Grid, Button,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    LinearProgress, Alert, Snackbar, useTheme, DialogContentText, Tabs, Tab,
    TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import { getAdminBookings, approveBooking, rejectBooking, getBranches, holdBooking, markHeldBookingPaid, autoRevokeExpiredHolds, autoExpireBookings } from '../../services/api';
import type { BookingResponse, Branch } from '../../types/booking';

// ─── WhatsApp helpers ────────────────────────────────────────────────────────

const buildWhatsAppLink = (phone: string, message: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

const buildLocationText = (b: BookingResponse): string => {
    const branch = b.location?.branchName ?? `Branch ${b.location?.branch ?? ''}`;
    const floor = b.location?.floor ? `Floor ${b.location.floor}` : '';
    const seat = b.location?.seatNo ? `Seat ${b.location.seatNo}` : '';
    return [branch, floor, seat].filter(Boolean).join(', ');
};

const buildConfirmationMessage = (b: BookingResponse, mapsUrl?: string): string => {
    const location = buildLocationText(b);
    const mapsLine = mapsUrl ? `\nLocation: ${mapsUrl}` : '';
    const periodLine = b.startDate && b.endDate
        ? `\nPeriod: ${new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(b.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : '';
    return `Hello ${b.customerName ?? 'Customer'},

Thank you for booking with AcumenHive.

Your booking for ${location} has been confirmed.${mapsLine}

Booking ID: ${b.id}${periodLine}
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

const buildRenewalMessage = (b: BookingResponse): string => {
    const location = buildLocationText(b);
    const endDate = b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'soon';
    return `Hello ${b.customerName ?? 'Customer'},

Your booking at AcumenHive (${location}) is expiring on *${endDate}*.

We'd love to have you continue! Please renew your booking to keep your seat reserved.

Renew here: https://acumenhive.vercel.app

If you have any questions, feel free to reach out. Thank you!`;
};

const openWhatsApp = (b: BookingResponse, type: 'approved' | 'rejected', mapsUrl?: string) => {
    const msg = type === 'approved' ? buildConfirmationMessage(b, mapsUrl) : buildRejectionMessage(b);
    const link = buildWhatsAppLink(b.customerPhone ?? '', msg);
    window.open(link, '_blank');
};

const openRenewalWhatsApp = (b: BookingResponse) => {
    const msg = buildRenewalMessage(b);
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
    const [activeTab, setActiveTab] = useState<'pending' | 'expiring' | 'recent' | 'approved' | 'expired' | 'held'>('pending');

    // Hold dialog state
    const [holdDialog, setHoldDialog] = useState<BookingResponse | null>(null);
    const [holdStartDate, setHoldStartDate] = useState('');
    const [holdEndDate, setHoldEndDate] = useState('');
    const [holdGraceDays, setHoldGraceDays] = useState(3);
    const [holdProcessing, setHoldProcessing] = useState(false);
    // Payment confirm dialog
    const [paymentConfirm, setPaymentConfirm] = useState<BookingResponse | null>(null);

    const getMapsUrl = (b: BookingResponse) =>
        branches.find(br => br.id === b.location?.branch)?.mapsUrl;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lazy: expire old confirmed bookings & revoke expired holds
                const [expiredCount, revokedCount] = await Promise.all([
                    autoExpireBookings(),
                    autoRevokeExpiredHolds(),
                ]);
                if (expiredCount > 0) console.log(`Auto-expired ${expiredCount} booking(s)`);
                if (revokedCount > 0) console.log(`Auto-revoked ${revokedCount} expired hold(s)`);
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
    const expired = bookings.filter(b => b.status === 'expired');
    const held = bookings.filter(b => b.status === 'held');
    // Bookings acted on this session (for "recently processed" strip)
    const recentlyProcessed = bookings.filter(b => sessionProcessed[b.id]);

    // Expiring soon: confirmed bookings within 7 days + expired bookings within last 3 days
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const expiringSoon = bookings.filter(b => {
        if (!b.endDate) return false;
        const end = new Date(b.endDate);
        if (b.status === 'confirmed') return end <= sevenDaysLater;
        if (b.status === 'expired') return end >= threeDaysAgo;
        return false;
    }).sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());

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

    const openHoldDialog = (b: BookingResponse) => {
        const today = new Date().toISOString().split('T')[0];
        setHoldStartDate(today);
        setHoldEndDate(b.endDate || today);
        setHoldGraceDays(3);
        setHoldDialog(b);
    };

    const handleHoldSubmit = async () => {
        if (!holdDialog || !holdStartDate || !holdEndDate) return;
        setHoldProcessing(true);
        try {
            const graceEnd = new Date(holdEndDate);
            graceEnd.setDate(graceEnd.getDate() + holdGraceDays);
            const gracePeriodEnd = graceEnd.toISOString().split('T')[0];
            await holdBooking(holdDialog.id, holdStartDate, holdEndDate, gracePeriodEnd);
            setBookings(prev => prev.map(b => b.id === holdDialog.id
                ? { ...b, status: 'held' as const, startDate: holdStartDate, endDate: holdEndDate, gracePeriodEnd: gracePeriodEnd, slotDate: holdStartDate }
                : b));
            setSnack({ open: true, msg: `Booking ${holdDialog.id} put on hold. Grace period ends ${gracePeriodEnd}.`, severity: 'success' });
            setHoldDialog(null);
        } catch (err: any) {
            setSnack({ open: true, msg: err.message || 'Hold failed', severity: 'error' });
        }
        setHoldProcessing(false);
    };

    const handlePaymentDone = async (b: BookingResponse) => {
        setProcessing(b.id);
        try {
            await markHeldBookingPaid(b.id);
            setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, status: 'confirmed' as const, gracePeriodEnd: undefined, heldAt: undefined } : bk));
            setSnack({ open: true, msg: `Payment confirmed! Booking ${b.id} is now active.`, severity: 'success' });
            setPaymentConfirm(null);
        } catch (err: any) {
            setSnack({ open: true, msg: err.message || 'Payment confirmation failed', severity: 'error' });
        }
        setProcessing(null);
    };

    if (loading) return <Box><LinearProgress /></Box>;

    const tabCounts = {
        pending: pending.length,
        expiring: expiringSoon.length,
        recent: recentlyProcessed.length,
        approved: confirmed.length,
        expired: expired.length,
        held: held.length,
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Payment Approvals</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Review payment screenshots, approve/reject bookings, and track renewals</Typography>

            {/* ── TABS ── */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    mb: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        minHeight: 48,
                    },
                    '& .Mui-selected': {
                        color: '#f59e0b !important',
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#f59e0b',
                    },
                }}
            >
                <Tab value="pending" label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Pending
                        {tabCounts.pending > 0 && <Chip label={tabCounts.pending} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />}
                    </Box>
                } />
                <Tab value="approved" label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        All Approved
                        {tabCounts.approved > 0 && <Chip label={tabCounts.approved} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />}
                    </Box>
                } />
                <Tab value="expiring" label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 18 }} />
                        Expiring Soon
                        {tabCounts.expiring > 0 && <Chip label={tabCounts.expiring} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f59e0b', color: '#000' }} />}
                    </Box>
                } />
                <Tab value="expired" label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Expired
                        {tabCounts.expired > 0 && <Chip label={tabCounts.expired} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#94a3b8', color: '#fff' }} />}
                    </Box>
                } />
                {tabCounts.held > 0 && (
                    <Tab value="held" label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PauseCircleIcon sx={{ fontSize: 18 }} />
                            Held
                            <Chip label={tabCounts.held} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#8b5cf6', color: '#fff' }} />
                        </Box>
                    } />
                )}
                {tabCounts.recent > 0 && (
                    <Tab value="recent" label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Recently Processed
                            <Chip label={tabCounts.recent} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#25D366', color: '#fff' }} />
                        </Box>
                    } />
                )}
            </Tabs>

            {/* ── TAB: PENDING ── */}
            {activeTab === 'pending' && (
                <>
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
                </>
            )}

            {/* ── TAB: ALL APPROVED ── */}
            {activeTab === 'approved' && (
                <>
                    {confirmed.length === 0 ? (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="h6" fontWeight={600}>No approved bookings yet</Typography>
                            <Typography variant="body2" color="text.secondary">Approved bookings will appear here</Typography>
                        </Paper>
                    ) : (
                        <>
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
                        </>
                    )}
                </>
            )}

            {/* ── TAB: EXPIRING SOON ── */}
            {activeTab === 'expiring' && (
                <>
                    {expiringSoon.length === 0 ? (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                            <AccessTimeIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                            <Typography variant="h6" fontWeight={600}>No expiring bookings</Typography>
                            <Typography variant="body2" color="text.secondary">No bookings expiring within the next 7 days</Typography>
                        </Paper>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Bookings expiring within 7 days. Send a renewal reminder via WhatsApp.
                            </Typography>
                            <Grid container spacing={2}>
                                {expiringSoon.map((b) => {
                                    const endDate = new Date(b.endDate!);
                                    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    const isExpired = daysLeft <= 0;
                                    return (
                                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                                            <Card sx={{
                                                border: `2px solid ${isExpired ? '#ef4444' : '#f59e0b'}`,
                                                borderRadius: 3,
                                            }}>
                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                                        <Chip
                                                            label={isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isExpired ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#22c55e',
                                                                color: isExpired || daysLeft <= 3 ? '#000' : '#fff',
                                                                fontWeight: 700,
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>
                                                    <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                                        {[
                                                            ['Location', buildLocationText(b)],
                                                            ['Seat', b.location?.seatNo ? `Seat ${b.location.seatNo}` : '-'],
                                                            ['Plan', b.slotTime],
                                                            ['Expires', endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
                                                        ].map(([k, v]) => (
                                                            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="caption" color="text.secondary">{k}</Typography>
                                                                <Typography variant="body2" fontWeight={500}>{v}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<WhatsAppIcon />}
                                                            onClick={() => openRenewalWhatsApp(b)}
                                                            sx={{
                                                                bgcolor: '#25D366',
                                                                '&:hover': { bgcolor: '#1ebe5d' },
                                                                color: '#fff',
                                                                fontWeight: 600,
                                                                borderRadius: 2,
                                                            }}
                                                        >
                                                            Remind
                                                        </Button>
                                                        <Button
                                                            fullWidth
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<PauseCircleIcon />}
                                                            onClick={() => openHoldDialog(b)}
                                                            sx={{
                                                                bgcolor: '#8b5cf6',
                                                                '&:hover': { bgcolor: '#7c3aed' },
                                                                color: '#fff',
                                                                fontWeight: 600,
                                                                borderRadius: 2,
                                                            }}
                                                        >
                                                            Hold
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </>
                    )}
                </>
            )}

            {/* ── TAB: EXPIRED ── */}
            {activeTab === 'expired' && (
                <>
                    {expired.length === 0 ? (
                        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="h6" fontWeight={600}>No expired bookings</Typography>
                            <Typography variant="body2" color="text.secondary">Expired bookings will appear here</Typography>
                        </Paper>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Past bookings that have expired. For reference only.
                            </Typography>
                            <Grid container spacing={2}>
                                {expired.map((b) => (
                                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                                        <Card sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, opacity: 0.85 }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                                    <Chip label="Expired" size="small" sx={{ bgcolor: '#94a3b8', color: '#fff', fontWeight: 700 }} />
                                                </Box>
                                                <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>
                                                <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                                    {[
                                                        ['Location', buildLocationText(b)],
                                                        ['Seat', b.location?.seatNo ? `Seat ${b.location.seatNo}` : '-'],
                                                        ['Was booked', `${b.slotDate || '-'} to ${b.endDate || '-'}`],
                                                        ['Amount', `₹${b.amount}`],
                                                    ].map(([k, v]) => (
                                                        <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">{k}</Typography>
                                                            <Typography variant="body2" fontWeight={500}>{v}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                </>
            )}

            {/* ── TAB: HELD ── */}
            {activeTab === 'held' && tabCounts.held > 0 && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Bookings on hold awaiting payment. Click "Payment Done" when cash/payment is received.
                    </Typography>
                    <Grid container spacing={2}>
                        {held.map((b) => {
                            const graceEnd = b.gracePeriodEnd ? new Date(b.gracePeriodEnd) : null;
                            const graceDaysLeft = graceEnd ? Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b.id}>
                                    <Card sx={{ border: `2px solid #8b5cf6`, borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{b.id}</Typography>
                                                <Chip label="On Hold" size="small" sx={{ bgcolor: '#8b5cf6', color: '#fff', fontWeight: 700 }} />
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight={600}>{b.customerName}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{b.customerPhone}</Typography>
                                            <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                                {[
                                                    ['Location', buildLocationText(b)],
                                                    ['Seat', b.location?.seatNo ? `Seat ${b.location.seatNo}` : '-'],
                                                    ['Booking Period', `${b.startDate || b.slotDate || '-'} to ${b.endDate || '-'}`],
                                                    ['Amount', `₹${b.amount}`],
                                                    ['Grace Period Ends', graceEnd ? graceEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'],
                                                    ['Grace Left', graceDaysLeft > 0 ? `${graceDaysLeft} day${graceDaysLeft === 1 ? '' : 's'}` : 'Expiring soon'],
                                                ].map(([k, v]) => (
                                                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                                                        <Typography variant="body2" fontWeight={500}>{v}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            {graceDaysLeft <= 1 && (
                                                <Alert severity="warning" sx={{ mb: 1.5, py: 0, fontSize: '0.75rem' }}>
                                                    Grace period expiring soon! Mark payment or it will auto-revoke.
                                                </Alert>
                                            )}
                                            <Button
                                                fullWidth variant="contained" color="success" size="small"
                                                startIcon={<PaymentIcon />}
                                                onClick={() => setPaymentConfirm(b)}
                                                disabled={processing === b.id}
                                                sx={{ fontWeight: 600, borderRadius: 2, mb: 1 }}
                                            >
                                                Payment Done (Cash)
                                            </Button>
                                            <WhatsAppButton
                                                booking={b}
                                                type="approved"
                                                label={`Message ${(b.customerName ?? 'Customer').split(' ')[0]}`}
                                                mapsUrl={getMapsUrl(b)}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </>
            )}

            {/* ── TAB: RECENTLY PROCESSED (only visible when there are items) ── */}
            {activeTab === 'recent' && tabCounts.recent > 0 && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Processed this session. Click to re-send the WhatsApp message. Resets when you leave the page.
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
                </>
            )}

            {/* ── Hold Dialog ── */}
            <Dialog open={!!holdDialog} onClose={() => setHoldDialog(null)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Hold Booking</DialogTitle>
                <DialogContent>
                    {holdDialog && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Hold this booking for <strong>{holdDialog.customerName}</strong> ({holdDialog.customerPhone}).
                                The seat will be reserved during the booking period + grace period.
                            </Typography>
                            <Box sx={{ my: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                {[
                                    ['Location', buildLocationText(holdDialog)],
                                    ['Seat', holdDialog.location?.seatNo ? `Seat ${holdDialog.location.seatNo}` : '-'],
                                    ['Previous Period', `${holdDialog.slotDate || '-'} to ${holdDialog.endDate || '-'}`],
                                    ['Amount', `₹${holdDialog.amount}`],
                                ].map(([k, v]) => (
                                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                                        <Typography variant="body2" fontWeight={500}>{v}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>New Booking Period</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                <TextField
                                    label="Start Date" type="date" size="small" fullWidth
                                    value={holdStartDate} onChange={e => setHoldStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="End Date" type="date" size="small" fullWidth
                                    value={holdEndDate} onChange={e => setHoldEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Grace Period</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                                Auto-revokes if payment is not confirmed within this period after the booking end date.
                            </Typography>
                            <FormControl fullWidth size="small">
                                <InputLabel>Grace Period</InputLabel>
                                <Select value={holdGraceDays} label="Grace Period" onChange={e => setHoldGraceDays(Number(e.target.value))}>
                                    {[1, 2, 3, 5, 7, 10, 14].map(d => (
                                        <MenuItem key={d} value={d}>{d} day{d > 1 ? 's' : ''}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {holdEndDate && holdGraceDays > 0 && (
                                <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                                    Seat will be occupied from <strong>{holdStartDate}</strong> until grace ends on <strong>
                                    {(() => { const d = new Date(holdEndDate); d.setDate(d.getDate() + holdGraceDays); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); })()}
                                    </strong>. If payment isn't confirmed by then, booking auto-revokes.
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setHoldDialog(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleHoldSubmit}
                        variant="contained"
                        disabled={holdProcessing || !holdStartDate || !holdEndDate}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, borderRadius: 2 }}
                        startIcon={<PauseCircleIcon />}
                    >
                        {holdProcessing ? 'Holding...' : 'Confirm Hold'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Payment Confirm Dialog ── */}
            <Dialog open={!!paymentConfirm} onClose={() => setPaymentConfirm(null)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Payment Received?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Mark booking <strong>{paymentConfirm?.id}</strong> for <strong>{paymentConfirm?.customerName}</strong> as paid?
                        This will change the booking status from "Held" to "Confirmed" (active).
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setPaymentConfirm(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={() => paymentConfirm && handlePaymentDone(paymentConfirm)}
                        variant="contained" color="success"
                        disabled={!!processing}
                        sx={{ borderRadius: 2 }}
                        startIcon={<PaymentIcon />}
                    >
                        Yes — Payment Done
                    </Button>
                </DialogActions>
            </Dialog>

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
