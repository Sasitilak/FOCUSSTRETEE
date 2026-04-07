import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, ToggleButtonGroup, ToggleButton,
    TextField, useTheme, MenuItem, Select, FormControl,
    InputLabel, Chip, Snackbar, Alert, CircularProgress, Tooltip,
    Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ChairIcon from '@mui/icons-material/Chair';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { getBranches, getRoomLayout, saveRoomLayout } from '../../services/api';
import type { Branch, RoomElement } from '../../types/booking';

type Tool = 'seat' | 'wall' | 'entrance';
type EdgeSide = 'top' | 'bottom' | 'left' | 'right';

interface PlacedSeat {
    seatId: string;
    seatNo: string;
    gridRow: number;
    gridCol: number;
}

const AdminLayoutBuilder: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Data states
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
    const [selectedFloor, setSelectedFloor] = useState<number | ''>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

    // Layout editor states
    const [gridCols, setGridCols] = useState(0);
    const [gridRows, setGridRows] = useState(0);
    const [activeTool, setActiveTool] = useState<Tool>('seat');
    const [placedSeats, setPlacedSeats] = useState<PlacedSeat[]>([]);
    const [elements, setElements] = useState<RoomElement[]>([]);

    // Derived
    const curBranch = branches.find(b => b.id === selectedBranchId);
    const curFloor = curBranch?.floors.find(f => f.floorNumber === selectedFloor);
    const curRoom = curFloor?.rooms.find(r => r.id === selectedRoomId);

    useEffect(() => {
        getBranches().then(d => { setBranches(d); setLoading(false); }).catch(console.error);
    }, []);

    // Load existing layout when room changes
    useEffect(() => {
        if (!selectedRoomId || !curRoom) return;

        const loadLayout = async () => {
            try {
                const layout = await getRoomLayout(selectedRoomId);
                setGridCols(layout.gridCols);
                setGridRows(layout.gridRows);
                setElements(layout.elements);

                // Load existing seat positions from layout data
                const positioned = layout.seatPositions.map(sp => {
                    const seat = curRoom.seats.find(s => s.id === sp.seatId);
                    return {
                        seatId: sp.seatId,
                        seatNo: seat?.seatNo || sp.seatId,
                        gridRow: sp.gridRow,
                        gridCol: sp.gridCol,
                    };
                }).filter(sp => curRoom.seats.some(s => s.id === sp.seatId));
                setPlacedSeats(positioned);
            } catch (err) {
                console.error('Failed to load layout:', err);
            }
        };
        loadLayout();
    }, [selectedRoomId, curRoom]);

    // Cell click handler
    const handleCellClick = useCallback((row: number, col: number) => {
        if (activeTool === 'seat') {
            // Toggle seat at this cell
            const existing = placedSeats.find(s => s.gridRow === row && s.gridCol === col);
            if (existing) {
                setPlacedSeats(prev => prev.filter(s => !(s.gridRow === row && s.gridCol === col)));
            } else {
                // Only place if we have seats available from the room
                if (!curRoom) return;
                const unplacedSeats = curRoom.seats.filter(
                    s => !placedSeats.some(p => p.seatId === s.id)
                );
                if (unplacedSeats.length > 0) {
                    const seat = unplacedSeats[0];
                    setPlacedSeats(prev => [...prev, { seatId: seat.id, seatNo: seat.seatNo, gridRow: row, gridCol: col }]);
                } else {
                    setSnackbar({ open: true, msg: 'All seats are already placed! Add more seats in Facility Config first.', severity: 'error' });
                }
            }
        }
    }, [activeTool, placedSeats, curRoom]);

    // Edge click handler (for walls/entrances)
    const handleEdgeClick = useCallback((row: number, col: number, side: EdgeSide) => {
        if (activeTool === 'seat') return;

        const type = activeTool as 'wall' | 'entrance';
        const existing = elements.find(
            e => e.gridRow === row && e.gridCol === col && e.side === side && e.type === type
        );

        if (existing) {
            setElements(prev => prev.filter(e => !(e.gridRow === row && e.gridCol === col && e.side === side && e.type === type)));
        } else {
            // Remove any other element at this exact edge position first
            setElements(prev => [
                ...prev.filter(e => !(e.gridRow === row && e.gridCol === col && e.side === side)),
                { roomId: selectedRoomId, type, gridRow: row, gridCol: col, side }
            ]);
        }
    }, [activeTool, elements, selectedRoomId]);

    // Save handler
    const handleSave = async () => {
        if (!selectedRoomId) return;
        setSaving(true);
        try {
            const seatPositions = placedSeats.map(s => ({
                seatId: s.seatId,
                gridRow: s.gridRow,
                gridCol: s.gridCol,
            }));
            const elems = elements.map(e => ({
                type: e.type,
                gridRow: e.gridRow,
                gridCol: e.gridCol,
                side: e.side,
            }));
            await saveRoomLayout(selectedRoomId, gridCols, gridRows, seatPositions, elems);
            setSnackbar({ open: true, msg: 'Layout saved successfully!', severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, msg: err.message || 'Failed to save', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const clearAll = () => {
        setPlacedSeats([]);
        setElements([]);
    };

    // Check if an edge has a wall — bidirectional check (adjacent cell's shared side)
    const hasWallAt = (row: number, col: number, side: EdgeSide): boolean => {
        const direct = elements.some(e => e.type === 'wall' && e.gridRow === row && e.gridCol === col && e.side === side);
        if (direct) return true;
        if (side === 'left' && col > 0) return elements.some(e => e.type === 'wall' && e.gridRow === row && e.gridCol === col - 1 && e.side === 'right');
        if (side === 'right' && col < gridCols - 1) return elements.some(e => e.type === 'wall' && e.gridRow === row && e.gridCol === col + 1 && e.side === 'left');
        if (side === 'top' && row > 0) return elements.some(e => e.type === 'wall' && e.gridRow === row - 1 && e.gridCol === col && e.side === 'bottom');
        if (side === 'bottom' && row < gridRows - 1) return elements.some(e => e.type === 'wall' && e.gridRow === row + 1 && e.gridCol === col && e.side === 'top');
        return false;
    };

    // Get element at a specific edge (for entrance rendering)
    const getEdgeElement = (row: number, col: number, side: EdgeSide): RoomElement | undefined => {
        return elements.find(e => e.gridRow === row && e.gridCol === col && e.side === side);
    };

    // Get seat at a cell
    const getSeatAt = (row: number, col: number): PlacedSeat | undefined => {
        return placedSeats.find(s => s.gridRow === row && s.gridCol === col);
    };

    // Edge style — uses bidirectional wall check
    const edgeStyle = (row: number, col: number, side: EdgeSide): React.CSSProperties => {
        const borderProp = `border${side.charAt(0).toUpperCase() + side.slice(1)}` as any;
        if (hasWallAt(row, col, side)) return { [borderProp]: `3px solid ${theme.palette.text.primary}` };
        const elem = getEdgeElement(row, col, side);
        if (elem?.type === 'entrance') return { [borderProp]: `3px solid ${theme.palette.success.main}` };
        return {};
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Room Layout Builder</Typography>

            {/* Room Selector */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Branch</InputLabel>
                        <Select
                            value={selectedBranchId}
                            label="Branch"
                            onChange={e => { setSelectedBranchId(Number(e.target.value)); setSelectedFloor(''); setSelectedRoomId(''); }}
                        >
                            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name.split('—')[0].trim()}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!selectedBranchId}>
                        <InputLabel>Floor</InputLabel>
                        <Select
                            value={selectedFloor}
                            label="Floor"
                            onChange={e => { setSelectedFloor(Number(e.target.value)); setSelectedRoomId(''); }}
                        >
                            {curBranch?.floors.map(f => <MenuItem key={f.floorNumber} value={f.floorNumber}>Floor {f.floorNumber}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 200 }} disabled={!selectedFloor}>
                        <InputLabel>Room</InputLabel>
                        <Select
                            value={selectedRoomId}
                            label="Room"
                            onChange={e => setSelectedRoomId(e.target.value)}
                        >
                            {curFloor?.rooms.map(r => (
                                <MenuItem key={r.id} value={r.id}>
                                    {r.name} ({r.seats.length} seats) {r.isAc ? '❄️' : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Editor */}
            {selectedRoomId && curRoom && (
                <Box>
                    {/* Toolbar */}
                    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <ToggleButtonGroup
                                    value={activeTool}
                                    exclusive
                                    onChange={(_, v) => v && setActiveTool(v)}
                                    size="small"
                                >
                                    <ToggleButton value="seat">
                                        <Tooltip title="Place Seat"><ChairIcon sx={{ fontSize: 18, mr: 0.5 }} /></Tooltip>
                                        Seat
                                    </ToggleButton>
                                    <ToggleButton value="wall">
                                        <Tooltip title="Add Wall"><BorderAllIcon sx={{ fontSize: 18, mr: 0.5 }} /></Tooltip>
                                        Wall
                                    </ToggleButton>
                                    <ToggleButton value="entrance">
                                        <Tooltip title="Mark Entrance"><MeetingRoomIcon sx={{ fontSize: 18, mr: 0.5 }} /></Tooltip>
                                        Entrance
                                    </ToggleButton>
                                </ToggleButtonGroup>

                                <Chip
                                    label={`${placedSeats.length}/${curRoom.seats.length} placed`}
                                    size="small"
                                    color={placedSeats.length === curRoom.seats.length ? 'success' : 'warning'}
                                />
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    label="Cols"
                                    type="number"
                                    size="small"
                                    sx={{ width: 70 }}
                                    value={gridCols || ''}
                                    onChange={e => {
                                        const n = Number(e.target.value);
                                        setGridCols(e.target.value === '' ? 0 : Math.min(20, Math.max(0, n)));
                                    }}
                                    onBlur={() => setGridCols(c => Math.max(2, c || 2))}
                                    inputProps={{ min: 2, max: 20 }}
                                />
                                <Typography variant="body2" color="text.secondary">×</Typography>
                                <TextField
                                    label="Rows"
                                    type="number"
                                    size="small"
                                    sx={{ width: 70 }}
                                    value={gridRows || ''}
                                    onChange={e => {
                                        const n = Number(e.target.value);
                                        setGridRows(e.target.value === '' ? 0 : Math.min(25, Math.max(0, n)));
                                    }}
                                    onBlur={() => setGridRows(r => Math.max(2, r || 2))}
                                    inputProps={{ min: 2, max: 25 }}
                                />

                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteSweepIcon />}
                                    onClick={clearAll}
                                >
                                    Clear
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    Save
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Info bar */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', px: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong>Room:</strong> {curRoom.name} | <strong>Seats in DB:</strong> {curRoom.seats.length} |
                            <strong> Grid:</strong> {gridCols}×{gridRows}
                        </Typography>
                        {activeTool === 'seat' && (
                            <Typography variant="caption" color="info.main">
                                Click empty cell to place next unplaced seat. Click existing seat to remove it.
                            </Typography>
                        )}
                        {activeTool !== 'seat' && (
                            <Typography variant="caption" color="info.main">
                                Click on cell edges (top/bottom/left/right hover zones) to toggle {activeTool}.
                            </Typography>
                        )}
                    </Box>

                    {/* Grid */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1, md: 3 },
                            borderRadius: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            overflowX: 'auto',
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${gridCols}, minmax(48px, 64px))`,
                                gridTemplateRows: `repeat(${gridRows}, minmax(48px, 64px))`,
                                gap: '1px',
                                mx: 'auto',
                                width: 'fit-content',
                                border: `2px solid ${theme.palette.text.primary}`,
                                borderRadius: 1,
                                p: '1px',
                                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(245,222,179,0.3)',
                            }}
                        >
                            {Array.from({ length: gridRows }).map((_, row) =>
                                Array.from({ length: gridCols }).map((_, col) => {
                                    const seat = getSeatAt(row, col);
                                    const topElem = getEdgeElement(row, col, 'top');
                                    const bottomElem = getEdgeElement(row, col, 'bottom');
                                    const leftElem = getEdgeElement(row, col, 'left');
                                    const rightElem = getEdgeElement(row, col, 'right');

                                    return (
                                        <Box
                                            key={`${row}-${col}`}
                                            onClick={() => handleCellClick(row, col)}
                                            sx={{
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                bgcolor: seat
                                                    ? (isDark ? 'rgba(0,173,181,0.2)' : 'rgba(59,172,182,0.15)')
                                                    : 'transparent',
                                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: seat
                                                        ? (isDark ? 'rgba(255,80,80,0.15)' : 'rgba(255,80,80,0.1)')
                                                        : (isDark ? 'rgba(0,173,181,0.08)' : 'rgba(59,172,182,0.08)'),
                                                },
                                                ...edgeStyle(row, col, 'top'),
                                                ...edgeStyle(row, col, 'bottom'),
                                                ...edgeStyle(row, col, 'left'),
                                                ...edgeStyle(row, col, 'right'),
                                            }}
                                        >
                                            {seat && (
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <ChairIcon sx={{ fontSize: 16, color: 'primary.main', display: 'block', mx: 'auto' }} />
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>
                                                        {seat.seatNo}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Edge click zones — only visible in wall/entrance modes */}
                                            {activeTool !== 'seat' && (
                                                <>
                                                    {/* Top edge */}
                                                    <Box
                                                        onClick={e => { e.stopPropagation(); handleEdgeClick(row, col, 'top'); }}
                                                        sx={{
                                                            position: 'absolute', top: 0, left: '10%', right: '10%', height: '20%',
                                                            cursor: 'pointer', zIndex: 2,
                                                            '&:hover': { bgcolor: 'rgba(255,152,0,0.25)' },
                                                            borderRadius: '2px 2px 0 0',
                                                        }}
                                                    />
                                                    {/* Bottom edge */}
                                                    <Box
                                                        onClick={e => { e.stopPropagation(); handleEdgeClick(row, col, 'bottom'); }}
                                                        sx={{
                                                            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '20%',
                                                            cursor: 'pointer', zIndex: 2,
                                                            '&:hover': { bgcolor: 'rgba(255,152,0,0.25)' },
                                                            borderRadius: '0 0 2px 2px',
                                                        }}
                                                    />
                                                    {/* Left edge */}
                                                    <Box
                                                        onClick={e => { e.stopPropagation(); handleEdgeClick(row, col, 'left'); }}
                                                        sx={{
                                                            position: 'absolute', left: 0, top: '10%', bottom: '10%', width: '20%',
                                                            cursor: 'pointer', zIndex: 2,
                                                            '&:hover': { bgcolor: 'rgba(255,152,0,0.25)' },
                                                            borderRadius: '2px 0 0 2px',
                                                        }}
                                                    />
                                                    {/* Right edge */}
                                                    <Box
                                                        onClick={e => { e.stopPropagation(); handleEdgeClick(row, col, 'right'); }}
                                                        sx={{
                                                            position: 'absolute', right: 0, top: '10%', bottom: '10%', width: '20%',
                                                            cursor: 'pointer', zIndex: 2,
                                                            '&:hover': { bgcolor: 'rgba(255,152,0,0.25)' },
                                                            borderRadius: '0 2px 2px 0',
                                                        }}
                                                    />
                                                </>
                                            )}

                                            {/* Entrance icon */}
                                            {topElem?.type === 'entrance' && (
                                                <MeetingRoomIcon sx={{ position: 'absolute', top: -2, fontSize: 12, color: 'success.main' }} />
                                            )}
                                            {bottomElem?.type === 'entrance' && (
                                                <MeetingRoomIcon sx={{ position: 'absolute', bottom: -2, fontSize: 12, color: 'success.main' }} />
                                            )}
                                            {leftElem?.type === 'entrance' && (
                                                <MeetingRoomIcon sx={{ position: 'absolute', left: -2, fontSize: 12, color: 'success.main', transform: 'rotate(90deg)' }} />
                                            )}
                                            {rightElem?.type === 'entrance' && (
                                                <MeetingRoomIcon sx={{ position: 'absolute', right: -2, fontSize: 12, color: 'success.main', transform: 'rotate(-90deg)' }} />
                                            )}
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                    </Paper>

                    {/* Legend */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap', px: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box sx={{ width: 14, height: 14, bgcolor: isDark ? 'rgba(0,173,181,0.2)' : 'rgba(59,172,182,0.15)', border: '1px solid', borderColor: 'primary.main', borderRadius: 0.5 }} />
                            <Typography variant="caption">Seat</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box sx={{ width: 14, height: 3, bgcolor: 'text.primary' }} />
                            <Typography variant="caption">Wall</Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <MeetingRoomIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption">Entrance</Typography>
                        </Stack>
                    </Box>
                </Box>
            )}

            {!selectedRoomId && (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px dashed ${theme.palette.divider}` }}>
                    <Typography variant="body1" color="text.secondary">
                        Select a Branch, Floor, and Room above to start editing its layout
                    </Typography>
                </Paper>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            >
                <Alert severity={snackbar.severity} variant="filled">{snackbar.msg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminLayoutBuilder;
