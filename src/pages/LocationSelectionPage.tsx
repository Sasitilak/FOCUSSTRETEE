import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Button, Chip, Paper, Skeleton, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChairIcon from '@mui/icons-material/Chair';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BookingSummary from '../components/BookingSummary';
import { getBranches } from '../services/api';
import { useBooking } from '../context/BookingContext';
import type { Branch, Seat } from '../types/booking';

const MotionBox = motion.create(Box);

const LocationSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { selectedSlot, selectedLocation, setSelectedLocation } = useBooking();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(selectedLocation?.branch ?? null);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(selectedLocation?.floor ?? null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(selectedLocation?.seatNo ?? null);

    useEffect(() => {
        if (!selectedSlot) { navigate('/slots'); return; }
        const fetchBranches = async () => {
            try {
                const d = await getBranches();
                setBranches(d);
            } catch (err) {
                console.error('Failed to fetch branches:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, [selectedSlot, navigate]);

    const curBranch = branches.find(b => b.id === selectedBranch);
    const curFloor = curBranch?.floors.find(f => f.floorNumber === selectedFloor);
    const allSeats = curFloor?.rooms.flatMap(r => r.seats) ?? [];
    const availCount = allSeats.filter(s => s.available).length;

    const handleBranchSelect = (id: number) => {
        setSelectedBranch(id); setSelectedFloor(null); setSelectedSeat(null); setSelectedLocation(null);
    };
    const handleFloorSelect = (num: number) => {
        setSelectedFloor(num); setSelectedSeat(null); setSelectedLocation(null);
    };
    const handleSeatSelect = (seat: Seat) => {
        if (!seat.available || !selectedBranch || !selectedFloor || !curFloor) return;
        const foundRoom = curFloor.rooms.find(r => r.seats.some(s => s.seatNo === seat.seatNo));
        if (!foundRoom) return;
        setSelectedSeat(seat.seatNo);
        setSelectedLocation({ branch: selectedBranch as 1 | 2, floor: selectedFloor, roomNo: foundRoom.roomNo, seatNo: seat.seatNo });
    };

    if (loading) return (
        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="rounded" height={120} sx={{ mt: 2, borderRadius: 3 }} />
            <Skeleton variant="rounded" height={180} sx={{ mt: 2, borderRadius: 3 }} />
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/slots')} size="small" sx={{ mb: 1, color: 'text.secondary' }}>Back</Button>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }} gutterBottom>Select Your Seat</Typography>
                    <Typography variant="body2" color="text.secondary">Pick a branch, floor, and your perfect spot</Typography>
                </motion.div>
            </Box>

            {/* Main layout — content left, summary right on desktop */}
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                {/* Left: Selection steps */}
                <Box sx={{ flex: 1, minWidth: 0 }}>

                    {/* ── STEP 1: Branch cards ── */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 600, fontSize: '0.65rem' }}>Step 1</Typography>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Choose Branch</Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {branches.map((b, i) => {
                                const isActive = selectedBranch === b.id;
                                const avail = b.floors.reduce((sum, f) => sum + f.rooms.reduce((s, r) => s + r.seats.filter(se => se.available).length, 0), 0);
                                return (
                                    <MotionBox
                                        key={b.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                                        onClick={() => handleBranchSelect(b.id)}
                                        sx={{
                                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' }, cursor: 'pointer',
                                            p: { xs: 2, md: 2.5 }, borderRadius: 3,
                                            border: '2px solid',
                                            borderColor: isActive ? 'primary.main' : theme.palette.divider,
                                            bgcolor: isActive ? (isDark ? 'rgba(0,173,181,0.06)' : 'rgba(59,172,182,0.06)') : 'background.paper',
                                            transition: 'all 0.25s ease',
                                            '&:hover': { borderColor: 'primary.light', transform: 'translateY(-2px)' },
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {isActive && (
                                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: 'primary.main' }} />
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <LocationOnIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', fontSize: 18 }} />
                                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                                                {b.name.split('—')[0].trim()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{b.address}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                                            <Chip label={`${b.floors.length} Floors`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                            <Chip label={`${avail} available`} size="small" color="success" sx={{ fontSize: '0.7rem', height: 22 }} />
                                        </Box>
                                    </MotionBox>
                                );
                            })}
                        </Box>
                    </motion.div>

                    {/* ── STEP 2: Floor Tabs ── */}
                    <AnimatePresence mode="wait">
                        {selectedBranch && curBranch && (
                            <motion.div
                                key={`fl-${selectedBranch}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                            >
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 600, fontSize: '0.65rem' }}>Step 2</Typography>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Select Floor</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                                        {curBranch.floors.map((f, i) => {
                                            const fa = f.rooms.reduce((s, r) => s + r.seats.filter(se => se.available).length, 0);
                                            const ft = f.rooms.reduce((s, r) => s + r.seats.length, 0);
                                            const isActive = selectedFloor === f.floorNumber;
                                            return (
                                                <MotionBox
                                                    key={f.floorNumber}
                                                    initial={{ opacity: 0, scale: 0.92 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                                    onClick={() => handleFloorSelect(f.floorNumber)}
                                                    sx={{
                                                        px: { xs: 2, md: 3 }, py: 1.5, borderRadius: 2.5, cursor: 'pointer',
                                                        minWidth: { xs: 100, md: 120 }, textAlign: 'center', flexShrink: 0,
                                                        bgcolor: isActive ? 'primary.main' : 'background.paper',
                                                        border: `1.5px solid ${isActive ? 'transparent' : theme.palette.divider}`,
                                                        color: isActive ? '#fff' : 'text.primary',
                                                        transition: 'all 0.25s ease',
                                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${theme.palette.primary.main}18` },
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: '0.8rem', md: '0.85rem' } }}>Floor {f.floorNumber}</Typography>
                                                    <Typography variant="caption" sx={{ opacity: isActive ? 0.85 : 0.5, fontSize: '0.7rem' }}>{fa}/{ft} seats</Typography>
                                                </MotionBox>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── STEP 3: Seat Grid ── */}
                    <AnimatePresence mode="wait">
                        {selectedFloor && curFloor && (
                            <motion.div
                                key={`seats-${selectedBranch}-${selectedFloor}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                            >
                                <Paper elevation={0} sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 600, fontSize: '0.65rem' }}>Step 3</Typography>
                                            <Typography variant="subtitle1" fontWeight={600}>Pick Your Seat</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                                            <Chip icon={<ChairIcon sx={{ fontSize: '14px !important' }} />} label={`${availCount} available`} color="success" size="small" variant="outlined" sx={{ height: 24, fontSize: '0.72rem' }} />
                                            <Chip icon={<ChairIcon sx={{ fontSize: '14px !important' }} />} label={`${allSeats.length - availCount} taken`} size="small" sx={{ opacity: 0.4, height: 24, fontSize: '0.72rem' }} variant="outlined" />
                                        </Box>
                                    </Box>

                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(48px, 1fr))', md: 'repeat(auto-fill, minmax(56px, 1fr))' },
                                        gap: { xs: 1, md: 1.5 },
                                        maxHeight: { xs: 260, md: 340 },
                                        overflowY: 'auto', pr: 0.5,
                                    }}>
                                        {allSeats.map((seat, i) => {
                                            const isSelected = selectedSeat === seat.seatNo;
                                            return (
                                                <MotionBox
                                                    key={seat.id}
                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.012, duration: 0.25 }}
                                                    onClick={() => handleSeatSelect(seat)}
                                                    sx={{
                                                        aspectRatio: '1',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        borderRadius: 2,
                                                        cursor: seat.available ? 'pointer' : 'not-allowed',
                                                        opacity: seat.available ? 1 : 0.25,
                                                        border: '2px solid',
                                                        borderColor: isSelected ? 'primary.main' : seat.available ? theme.palette.divider : 'transparent',
                                                        bgcolor: isSelected
                                                            ? (isDark ? 'rgba(0,173,181,0.12)' : 'rgba(59,172,182,0.12)')
                                                            : seat.available ? 'background.paper' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': seat.available ? {
                                                            transform: 'scale(1.08)', borderColor: 'primary.main',
                                                            boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
                                                        } : {},
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        fontWeight={isSelected ? 700 : 500}
                                                        color={isSelected ? 'primary.main' : 'text.primary'}
                                                        sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                                                    >
                                                        {seat.seatNo}
                                                    </Typography>
                                                </MotionBox>
                                            );
                                        })}
                                    </Box>
                                </Paper>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </Box>

                {/* Right: Booking Summary — hidden on mobile, sticky sidebar on desktop */}
                <Box sx={{
                    display: { xs: 'none', md: 'block' },
                    width: 300, flexShrink: 0,
                }}>
                    <Box sx={{ position: 'sticky', top: 80 }}>
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                            <BookingSummary />
                        </motion.div>
                    </Box>
                </Box>
            </Box>

            {/* Mobile summary — shown below */}
            <Box sx={{ mt: 3, display: { xs: 'block', md: 'none' } }}>
                <BookingSummary />
            </Box>

            {/* Continue */}
            <AnimatePresence>
                {selectedLocation && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                            <Button
                                variant="contained" size="large" fullWidth
                                onClick={() => navigate('/details')}
                                endIcon={<ArrowForwardIcon />}
                                sx={{ maxWidth: 400, py: 1.5 }}
                            >
                                Continue to Details
                            </Button>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Container>
    );
};

export default LocationSelectionPage;
