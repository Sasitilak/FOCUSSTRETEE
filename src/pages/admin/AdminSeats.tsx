import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, Snackbar, Alert, CircularProgress,
    ToggleButtonGroup, ToggleButton, useTheme,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getAdminSeats, toggleSeatBlock } from '../../services/api';

interface SeatRow {
    id: number;
    seat_no: string;
    is_blocked: boolean;
    floor_id: number;
    branch_id: number;
    floor_number: number;
    branch_name: string;
}

const AdminSeats: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [seats, setSeats] = useState<SeatRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<number | null>(null);
    const [snack, setSnack] = useState('');
    const [filterBranch, setFilterBranch] = useState<number | null>(null);
    const [filterFloor, setFilterFloor] = useState<number | null>(null);

    useEffect(() => { loadSeats(); }, []);

    const loadSeats = async () => {
        setLoading(true);
        try {
            const data = await getAdminSeats();
            setSeats(data);
        } catch (err) {
            console.error('Failed to load seats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (seatId: number, currentBlocked: boolean) => {
        setToggling(seatId);
        try {
            await toggleSeatBlock(seatId, !currentBlocked);
            setSeats(prev => prev.map(s => s.id === seatId ? { ...s, is_blocked: !currentBlocked } : s));
            setSnack(!currentBlocked ? 'Seat blocked' : 'Seat unblocked');
        } catch {
            setSnack('Failed to update');
        }
        setToggling(null);
    };

    // Get unique branches and floors
    const branches = [...new Map(seats.map(s => [s.branch_id, { id: s.branch_id, name: s.branch_name }])).values()];
    const floors = filterBranch
        ? [...new Set(seats.filter(s => s.branch_id === filterBranch).map(s => s.floor_number))].sort()
        : [];

    const filtered = seats
        .filter(s => !filterBranch || s.branch_id === filterBranch)
        .filter(s => !filterFloor || s.floor_number === filterFloor);

    const blockedCount = filtered.filter(s => s.is_blocked).length;

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Seat Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Block or unblock seats. Blocked seats won't appear as available to users.
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
            {filterBranch && floors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Floor</Typography>
                    <ToggleButtonGroup
                        value={filterFloor}
                        exclusive
                        onChange={(_, v) => setFilterFloor(v)}
                        size="small"
                    >
                        {floors.map(f => (
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
                <Chip label={`${blockedCount} blocked`} color="error" variant="outlined" size="small" icon={<BlockIcon />} />
                <Chip label={`${filtered.length - blockedCount} active`} color="success" variant="outlined" size="small" icon={<CheckCircleOutlineIcon />} />
            </Box>

            {/* Seat grid */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                {!filterBranch ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                        Select a branch to manage seats
                    </Typography>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: 1.5,
                    }}>
                        {filtered.map(seat => (
                            <Box
                                key={seat.id}
                                onClick={() => handleToggle(seat.id, seat.is_blocked)}
                                sx={{
                                    p: 1.5, borderRadius: 2, textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: seat.is_blocked ? 'error.main' : theme.palette.divider,
                                    bgcolor: seat.is_blocked
                                        ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')
                                        : 'background.paper',
                                    opacity: toggling === seat.id ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        borderColor: seat.is_blocked ? 'success.main' : 'error.main',
                                    },
                                }}
                            >
                                <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                                    {seat.seat_no}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: seat.is_blocked ? 'error.main' : 'success.main' }}>
                                    {seat.is_blocked ? 'Blocked' : 'Active'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack('')}>
                <Alert severity="info" variant="filled" sx={{ borderRadius: 2 }}>{snack}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminSeats;
