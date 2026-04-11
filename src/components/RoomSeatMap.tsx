import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import ChairIcon from '@mui/icons-material/Chair';
import type { Room, Seat, RoomElement, SeatPosition } from '../types/booking';

const MotionBox = motion.create(Box);

interface RoomSeatMapProps {
    room: Room;
    gridCols: number;
    gridRows: number;
    seatPositions: SeatPosition[];
    elements: RoomElement[];
    selectedSeatId?: string;
    onSeatClick: (seat: Seat) => void;
}

const RoomSeatMap: React.FC<RoomSeatMapProps> = ({
    room, gridCols, gridRows, seatPositions, elements, selectedSeatId, onSeatClick,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Build a map of seat positions → Seat objects
    const seatGrid = new Map<string, Seat>();
    seatPositions.forEach(sp => {
        const seat = room.seats.find(s => s.id === sp.seatId);
        if (seat) seatGrid.set(`${sp.gridRow}-${sp.gridCol}`, seat);
    });

    // ── Wall/entrance detection ──
    const hasElementAt = (type: string, row: number, col: number, side: string): boolean => {
        return elements.some(e => e.type === type && e.gridRow === row && e.gridCol === col && e.side === side);
    };

    const isWallEdge = (row: number, col: number, side: string): boolean => {
        if (hasElementAt('wall', row, col, side)) return true;
        if (side === 'right' && col < gridCols - 1) return hasElementAt('wall', row, col + 1, 'left');
        if (side === 'bottom' && row < gridRows - 1) return hasElementAt('wall', row + 1, col, 'top');
        if (side === 'left' && col > 0) return hasElementAt('wall', row, col - 1, 'right');
        if (side === 'top' && row > 0) return hasElementAt('wall', row - 1, col, 'bottom');
        return false;
    };

    const isEntranceEdge = (row: number, col: number, side: string): boolean => {
        if (hasElementAt('entrance', row, col, side)) return true;
        if (side === 'right' && col < gridCols - 1) return hasElementAt('entrance', row, col + 1, 'left');
        if (side === 'bottom' && row < gridRows - 1) return hasElementAt('entrance', row + 1, col, 'top');
        if (side === 'left' && col > 0) return hasElementAt('entrance', row, col - 1, 'right');
        if (side === 'top' && row > 0) return hasElementAt('entrance', row - 1, col, 'bottom');
        return false;
    };

    const wallColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    const entranceColor = '#00e676';

    const getCellBorders = (row: number, col: number): React.CSSProperties => {
        const style: React.CSSProperties = {};
        if (isWallEdge(row, col, 'right')) style.borderRight = `3px solid ${wallColor}`;
        else if (isEntranceEdge(row, col, 'right')) style.borderRight = `6px solid ${entranceColor}`;
        if (isWallEdge(row, col, 'bottom')) style.borderBottom = `3px solid ${wallColor}`;
        else if (isEntranceEdge(row, col, 'bottom')) style.borderBottom = `6px solid ${entranceColor}`;
        if (isEntranceEdge(row, col, 'left')) style.borderLeft = `6px solid ${entranceColor}`;
        else if (col === 0 && isWallEdge(row, col, 'left')) style.borderLeft = `3px solid ${wallColor}`;
        if (isEntranceEdge(row, col, 'top')) style.borderTop = `6px solid ${entranceColor}`;
        else if (row === 0 && isWallEdge(row, col, 'top')) style.borderTop = `3px solid ${wallColor}`;
        return style;
    };

    // Color logic for a seat
    const getSeatColors = (seat: Seat, isSelected: boolean) => {
        if (isSelected) {
            // Selected — bright green full tile
            return {
                bg: '#22c55e',
                hoverBg: '#16a34a',
                iconColor: '#fff',
                textColor: '#fff',
                opacity: 1,
            };
        }
        if (!seat.available) {
            // Occupied — bright red
            return {
                bg: '#ef4444',
                hoverBg: '#dc2626',
                iconColor: '#fff',
                textColor: '#fff',
                opacity: 1,
            };
        }
        if (seat.isLadies) {
            // Ladies — bright pink
            return {
                bg: '#ec4899',
                hoverBg: '#db2777',
                iconColor: '#fff',
                textColor: '#fff',
                opacity: 1,
            };
        }
        // Available — teal
        return {
            bg: isDark ? 'rgba(0,173,181,0.25)' : 'rgba(59,172,182,0.2)',
            hoverBg: isDark ? 'rgba(0,173,181,0.4)' : 'rgba(59,172,182,0.35)',
            iconColor: theme.palette.primary.main,
            textColor: theme.palette.text.primary,
            opacity: 1,
        };
    };

    const hasLayout = seatPositions.length > 0;

    if (!hasLayout) {
        const fallbackCols = Math.min(Math.ceil(Math.sqrt(room.seats.length * 1.5)), 10);
        return (
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${fallbackCols}, minmax(48px, 64px))`,
                    gap: '1px',
                    border: `2px solid ${theme.palette.text.primary}`,
                    borderRadius: 2,
                    p: '1px',
                    overflow: 'hidden',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(245,222,179,0.3)',
                    width: 'fit-content',
                    mx: 'auto',
                }}
            >
                {room.seats.map((seat, i) => {
                    const isSelected = selectedSeatId === seat.id;
                    const colors = getSeatColors(seat, isSelected);
                    return (
                        <Tooltip key={seat.id} title={seat.label || ''} arrow disableHoverListener={!seat.label} placement="top">
                            <MotionBox
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.012, duration: 0.2 }}
                                onClick={() => onSeatClick(seat)}
                                sx={{
                                    width: 56, height: 56,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    bgcolor: colors.bg,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                    opacity: colors.opacity,
                                    transition: 'all 0.15s ease',
                                    '&:hover': { bgcolor: colors.hoverBg },
                                }}
                            >
                                <ChairIcon sx={{
                                    fontSize: 16,
                                    color: colors.iconColor,
                                    display: 'block',
                                    mx: 'auto',
                                }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        color: colors.textColor,
                                    }}
                                >
                                    {seat.seatNo}
                                </Typography>
                            </MotionBox>
                        </Tooltip>
                    );
                })}
            </Box>
        );
    }

    // ── Visual Layout mode ──
    return (
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridCols}, minmax(48px, 64px))`,
                    gridTemplateRows: `repeat(${gridRows}, minmax(48px, 64px))`,
                    gap: '1px',
                    mx: 'auto',
                    width: 'fit-content',
                    border: `2px solid ${theme.palette.text.primary}`,
                    borderRadius: 2,
                    p: '1px',
                    overflow: 'hidden',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(245,222,179,0.3)',
                }}
            >
                {Array.from({ length: gridRows }).map((_, row) =>
                    Array.from({ length: gridCols }).map((_, col) => {
                        const seat = seatGrid.get(`${row}-${col}`);
                        const isSelected = seat && selectedSeatId === seat.id;
                        const borders = getCellBorders(row, col);
                        const colors = seat ? getSeatColors(seat, !!isSelected) : null;

                        return (
                            <MotionBox
                                key={`${row}-${col}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: (row * gridCols + col) * 0.002, duration: 0.1 }}
                                onClick={() => seat && onSeatClick(seat)}
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: seat ? 'pointer' : 'default',
                                    bgcolor: colors ? colors.bg : 'transparent',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                    ...borders,
                                    transition: 'all 0.15s ease',
                                    '&:hover': seat ? { bgcolor: colors?.hoverBg } : {},
                                }}
                            >
                                {seat && (
                                    <Tooltip title={seat.label || ''} arrow disableHoverListener={!seat.label} placement="top">
                                        <Box sx={{ textAlign: 'center', opacity: colors?.opacity }}>
                                            <ChairIcon sx={{
                                                fontSize: 16,
                                                color: colors!.iconColor,
                                                display: 'block',
                                                mx: 'auto',
                                            }} />
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    lineHeight: 1,
                                                    color: colors!.textColor,
                                                }}
                                            >
                                                {seat.seatNo}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                )}
                            </MotionBox>
                        );
                    })
                )}
            </Box>
        </Box>
    );
};

export default RoomSeatMap;
