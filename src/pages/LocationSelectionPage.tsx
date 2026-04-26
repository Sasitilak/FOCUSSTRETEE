import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Button, Chip, Paper, Skeleton, CircularProgress, useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChairIcon from '@mui/icons-material/Chair';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BookingSummary from '../components/BookingSummary';
import RoomSeatMap from '../components/RoomSeatMap';
import { getBranches, getRoomLayoutsBatch, type RoomLayoutData } from '../services/api';
import { useBooking } from '../context/BookingContext';
import { calculatePrice } from '../utils/pricing';
import type { Branch, Room, Seat, PricingConfig } from '../types/booking';

const MotionBox = motion.create(Box);

const LocationSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { selectedSlot, setSelectedSlot, selectedLocation, setSelectedLocation, selectedDate } = useBooking();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(selectedLocation?.branch ?? null);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(selectedLocation?.floor ?? null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(selectedLocation?.roomId ?? null);
    const [floorLayoutCache, setFloorLayoutCache] = useState<Map<string, RoomLayoutData>>(new Map());
    const [layoutLoading, setLayoutLoading] = useState(false);

    useEffect(() => {
        if (!selectedSlot) { navigate('/slots'); return; }
        const fetchBranches = async () => {
            try {
                const d = await getBranches(selectedDate || undefined);
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
    const curRoom = curFloor?.rooms.find(r => r.id === selectedRoomId);

    const handleBranchSelect = (id: number) => {
        setSelectedBranch(id); setSelectedFloor(null); setSelectedRoomId(null); setSelectedLocation(null);
        setFloorLayoutCache(new Map());
        if (selectedSlot) setSelectedSlot({ ...selectedSlot, price: 0 });
    };

    const handleFloorSelect = (num: number) => {
        setSelectedFloor(num); setSelectedRoomId(null); setSelectedLocation(null);
        if (selectedSlot) setSelectedSlot({ ...selectedSlot, price: 0 });

        const floor = curBranch?.floors.find(f => f.floorNumber === num);
        if (floor && floor.rooms.length > 0) {
            setLayoutLoading(true);
            const roomIds = floor.rooms.map(r => r.id);
            getRoomLayoutsBatch(roomIds)
                .then(cache => setFloorLayoutCache(cache))
                .catch(err => console.error('Failed to load floor layouts:', err))
                .finally(() => setLayoutLoading(false));
        }
    };

    const handleRoomSelect = (room: Room) => {
        setSelectedRoomId(room.id); setSelectedLocation(null);
        if (selectedSlot) setSelectedSlot({ ...selectedSlot, price: 0 });
    };

    const handleSeatSelect = (seat: Seat) => {
        if (!seat.available || !selectedBranch || !selectedFloor || !curRoom) return;

        const days = selectedSlot?.durationDays || 7;
        const weeks = selectedSlot?.effectiveWeeks || Math.ceil(days / 7);
        const tiers: PricingConfig = curRoom.pricing_tiers || {
            price_1w: 500, price_2w: 900, price_3w: 1200, price_1m: 1500
        };
        const { total: totalPrice } = calculatePrice(weeks, tiers);

        if (selectedSlot) {
            setSelectedSlot({ ...selectedSlot, price: totalPrice });
        }

        const branchObj = branches.find(b => b.id === selectedBranch);
        setSelectedLocation({
            branch: selectedBranch,
            branchName: branchObj?.name,
            floor: selectedFloor,
            roomNo: curRoom.name || curRoom.roomNo,
            roomId: curRoom.id,
            seatNo: seat.seatNo
        });
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
                    <Typography variant="body2" color="text.secondary">Pick a branch, floor, room, and your perfect spot</Typography>
                </motion.div>
            </Box>

            {/* Main layout */}
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                {/* Left: Selection steps */}
                <Box sx={{ flex: 1, minWidth: 0 }}>

                    {/* ── STEP 1: Branch ── */}
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

                    {/* ── STEP 2: Floor ── */}
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

                    {/* ── STEP 3: Room + Inline Seat Map ── */}
                    <AnimatePresence mode="wait">
                        {selectedFloor && curFloor && (
                            <motion.div
                                key={`rooms-${selectedBranch}-${selectedFloor}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                            >
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 600, fontSize: '0.65rem' }}>Step 3</Typography>
                                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Choose Room</Typography>
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                        {curFloor.rooms.map((room, i) => {
                                            const roomAvail = room.seats.filter(s => s.available).length;
                                            const isActive = selectedRoomId === room.id;
                                            return (
                                                <React.Fragment key={room.id}>
                                                    <MotionBox
                                                        initial={{ opacity: 0, scale: 0.92 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.06, duration: 0.3 }}
                                                        onClick={() => handleRoomSelect(room)}
                                                        sx={{
                                                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33% - 12px)' },
                                                            p: 2, borderRadius: 3, cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: isActive ? 'primary.main' : theme.palette.divider,
                                                            bgcolor: isActive
                                                                ? (isDark ? 'rgba(0,173,181,0.08)' : 'rgba(59,172,182,0.06)')
                                                                : 'background.paper',
                                                            transition: 'all 0.25s ease',
                                                            '&:hover': {
                                                                borderColor: 'primary.light',
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: `0 4px 16px ${theme.palette.primary.main}12`,
                                                            },
                                                            position: 'relative', overflow: 'hidden',
                                                        }}
                                                    >
                                                        {isActive && (
                                                            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: 'primary.main' }} />
                                                        )}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                                            <MeetingRoomIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', fontSize: 20 }} />
                                                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                                                                {room.name}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                                            {room.isAc && (
                                                                <Chip
                                                                    icon={<AcUnitIcon sx={{ fontSize: '12px !important' }} />}
                                                                    label="AC"
                                                                    size="small"
                                                                    color="info"
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                                                />
                                                            )}
                                                            {(() => {
                                                                const effectiveWeeks = selectedSlot?.effectiveWeeks || Math.ceil((selectedSlot?.durationDays || 7) / 7);
                                                                const tiers = room.pricing_tiers;
                                                                if (!tiers || !tiers.price_1w) return null;
                                                                const p = calculatePrice(effectiveWeeks, tiers);
                                                                return <Chip label={`₹${p.total}`} size="small" color="success" variant="filled" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />;
                                                            })()}
                                                            <Chip
                                                                icon={<ChairIcon sx={{ fontSize: '12px !important' }} />}
                                                                label={`${roomAvail}/${room.seats.length}`}
                                                                size="small"
                                                                color={roomAvail > 0 ? 'success' : 'error'}
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                                            />
                                                        </Box>
                                                    </MotionBox>

                                                    {/* Inline Seat Map */}
                                                    <AnimatePresence>
                                                        {isActive && (
                                                            <MotionBox
                                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                                sx={{ width: '100%', overflow: 'hidden' }}
                                                            >
                                                                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: `3px solid ${theme.palette.primary.main}60`, background: isDark ? 'linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(251,146,60,0.04) 50%, rgba(19,19,22,0.9) 100%)' : 'linear-gradient(145deg, rgba(245,158,11,0.06) 0%, rgba(251,146,60,0.03) 50%, rgba(255,255,255,0.95) 100%)', boxShadow: isDark ? '0 6px 32px rgba(245,158,11,0.12)' : '0 6px 32px rgba(245,158,11,0.08)' }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                        <Typography variant="subtitle2" fontWeight={700}>Select a Seat in {room.name}</Typography>
                                                                        <Chip label={`${roomAvail} available`} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                                                                    </Box>

                                                                    {layoutLoading ? (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                                                            <CircularProgress size={28} />
                                                                        </Box>
                                                                    ) : (
                                                                        <RoomSeatMap
                                                                            room={room}
                                                                            gridCols={floorLayoutCache.get(room.id)?.gridCols ?? 8}
                                                                            gridRows={floorLayoutCache.get(room.id)?.gridRows ?? 10}
                                                                            seatPositions={floorLayoutCache.get(room.id)?.seatPositions ?? []}
                                                                            elements={floorLayoutCache.get(room.id)?.elements ?? []}
                                                                            selectedSeatId={selectedLocation && selectedLocation.roomId === room.id ? room.seats.find(s => s.seatNo === selectedLocation.seatNo)?.id : undefined}
                                                                            onSeatClick={handleSeatSelect}
                                                                        />
                                                                    )}

                                                                    <Box sx={{ mt: 2.5, display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                                        {[
                                                                            { color: '#1ea84b', label: 'Available' },
                                                                            { color: '#2196f3', label: 'Selected' },
                                                                            { color: '#ff0000', label: 'Occupied' },
                                                                            { color: '#ec4899', label: 'Ladies' },
                                                                        ].map(item => (
                                                                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: item.color }} />
                                                                                <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>{item.label}</Typography>
                                                                            </Box>
                                                                        ))}
                                                                    </Box>
                                                                </Paper>
                                                            </MotionBox>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                {/* Right: Booking Summary sticky sidebar (desktop only) */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, width: 320, flexShrink: 0 }}>
                    <Box sx={{ position: 'sticky', top: 80 }}>
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                            <BookingSummary />
                            {selectedLocation && (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant="contained" fullWidth size="large"
                                        onClick={() => navigate('/details')}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                                    >
                                        Continue to Details
                                    </Button>
                                </Box>
                            )}
                        </motion.div>
                    </Box>
                </Box>
            </Box>

            {/* Mobile summary */}
            <Box sx={{ mt: 3, display: { xs: 'block', md: 'none' }, mb: selectedLocation ? 12 : 4 }}>
                <BookingSummary />
            </Box>

            {/* Floating CTA (mobile only) */}
            <AnimatePresence>
                {selectedLocation && (
                    <MotionBox
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        sx={{ position: 'fixed', bottom: 24, left: '5%', right: '5%', zIndex: 1100, display: { xs: 'block', md: 'none' } }}
                    >
                        <Button
                            variant="contained" size="large" fullWidth
                            onClick={() => navigate('/details')}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                py: 2, borderRadius: 100, fontSize: '1rem', fontWeight: 800,
                                boxShadow: `0 12px 32px ${theme.palette.primary.main}60`,
                                textTransform: 'none',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            }}
                        >
                            Confirm Seat {selectedLocation.seatNo}
                        </Button>
                    </MotionBox>
                )}
            </AnimatePresence>
        </Container>
    );
};

export default LocationSelectionPage;
