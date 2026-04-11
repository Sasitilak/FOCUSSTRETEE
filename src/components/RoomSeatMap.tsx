import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
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

// Compact study chair SVG — clean, readable at small sizes
const SeatIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 20 22" fill="none">
        {/* Chair back */}
        <rect x="3" y="0" width="14" height="11" rx="2.5" fill={color} />
        {/* Seat */}
        <rect x="2" y="12" width="16" height="4" rx="1.5" fill={color} opacity="0.8" />
        {/* Legs */}
        <rect x="4" y="17" width="2" height="5" rx="1" fill={color} opacity="0.45" />
        <rect x="14" y="17" width="2" height="5" rx="1" fill={color} opacity="0.45" />
    </svg>
);

// Theme-independent seat colors
const SEAT_COLORS = {
    available: { bg: '#1ea84b', label: '#fff' },
    selected: { bg: '#2196f3', label: '#fff' },
    occupied: { bg: '#ff0000', label: '#fff' },
    ladies: { bg: '#ec4899', label: '#fff' },
};

const getSeatStyle = (seat: Seat, isSelected: boolean) => {
    if (isSelected) return SEAT_COLORS.selected;
    if (!seat.available) return SEAT_COLORS.occupied;
    if (seat.isLadies) return SEAT_COLORS.ladies;
    return SEAT_COLORS.available;
};

const RoomSeatMap: React.FC<RoomSeatMapProps> = ({
    room, gridCols, gridRows, seatPositions, elements, selectedSeatId, onSeatClick,
}) => {
    const seatGrid = new Map<string, Seat>();
    seatPositions.forEach(sp => {
        const seat = room.seats.find(s => s.id === sp.seatId);
        if (seat) seatGrid.set(`${sp.gridRow}-${sp.gridCol}`, seat);
    });

    // ── Wall/entrance detection ──
    const hasElementAt = (type: string, row: number, col: number, side: string): boolean =>
        elements.some(e => e.type === type && e.gridRow === row && e.gridCol === col && e.side === side);

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

    // Check if a cell is on the outer boundary of the grid
    const isOuterEdge = (row: number, col: number, side: string): boolean => {
        if (side === 'top') return row === 0;
        if (side === 'bottom') return row === gridRows - 1;
        if (side === 'left') return col === 0;
        if (side === 'right') return col === gridCols - 1;
        return false;
    };

    const getCellBorders = (row: number, col: number): React.CSSProperties => {
        const style: React.CSSProperties = {};
        const sides = ['top', 'right', 'bottom', 'left'] as const;
        const cssSide = { top: 'borderTop', right: 'borderRight', bottom: 'borderBottom', left: 'borderLeft' } as const;

        for (const side of sides) {
            if (isEntranceEdge(row, col, side)) {
                (style as any)[cssSide[side]] = '5px solid #00e676';
            } else if (isWallEdge(row, col, side) || isOuterEdge(row, col, side)) {
                (style as any)[cssSide[side]] = '3px solid rgba(203,213,225,0.5)';
            }
        }
        return style;
    };

    // Compact seat cell
    const renderSeatCell = (seat: Seat, isSelected: boolean, isClickable: boolean) => {
        const colors = getSeatStyle(seat, isSelected);
        return (
            <Tooltip title={seat.label || `Seat ${seat.seatNo}`} arrow placement="top">
                <Box
                    sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: isClickable ? 'pointer' : 'not-allowed',
                        opacity: 1,
                        transition: 'transform 0.12s ease, opacity 0.12s ease',
                        '&:hover': isClickable ? { transform: 'scale(1.12)', opacity: 1 } : {},
                        py: 0.2,
                    }}
                >
                    <SeatIcon color={colors.bg} size={28} />
                    <Typography sx={{
                        fontSize: '0.65rem', fontWeight: 800, lineHeight: 1,
                        mt: '1px', color: colors.label,
                        letterSpacing: '-0.02em',
                    }}>
                        {seat.seatNo}
                    </Typography>
                </Box>
            </Tooltip>
        );
    };

    const hasLayout = seatPositions.length > 0;
    const cellSize = 56;

    // ── Fallback: no layout ──
    if (!hasLayout) {
        const fallbackCols = Math.min(Math.ceil(Math.sqrt(room.seats.length * 1.5)), 10);
        return (
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${fallbackCols}, ${cellSize}px)`,
                gap: '3px',
                justifyContent: 'center',
                p: 2,
                border: '2px solid rgba(148,163,184,0.25)',
                borderRadius: '12px',
                width: 'fit-content',
                mx: 'auto',
                bgcolor: 'rgba(148,163,184,0.14)',
            }}>
                {room.seats.map((seat, i) => {
                    const isSelected = selectedSeatId === seat.id;
                    const isClickable = seat.available || isSelected;
                    return (
                        <MotionBox
                            key={seat.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.008, duration: 0.15 }}
                            onClick={() => isClickable && onSeatClick(seat)}
                            sx={{
                                width: cellSize, height: cellSize,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            {renderSeatCell(seat, isSelected, isClickable)}
                        </MotionBox>
                    );
                })}
            </Box>
        );
    }

    // ── Layout mode ──

    const getCornerRadius = (row: number, col: number): string | undefined => {
        const r = '12px';
        if (row === 0 && col === 0) return `${r} 0 0 0`;
        if (row === 0 && col === gridCols - 1) return `0 ${r} 0 0`;
        if (row === gridRows - 1 && col === gridCols - 1) return `0 0 ${r} 0`;
        if (row === gridRows - 1 && col === 0) return `0 0 0 ${r}`;
        return undefined;
    };

    return (
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
                gap: 0,
                mx: 'auto',
                width: 'fit-content',
                bgcolor: 'rgba(148,163,184,0.14)',
                borderRadius: '12px',
                border: '2px solid rgba(148,163,184,0.25)',
            }}>
                {Array.from({ length: gridRows }).map((_, row) =>
                    Array.from({ length: gridCols }).map((_, col) => {
                        const seat = seatGrid.get(`${row}-${col}`);
                        const isSelected = !!(seat && selectedSeatId === seat.id);
                        const isClickable = !!(seat && (seat.available || isSelected));
                        const borders = getCellBorders(row, col);
                        const cornerRadius = getCornerRadius(row, col);

                        return (
                            <MotionBox
                                key={`${row}-${col}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: (row * gridCols + col) * 0.001, duration: 0.08 }}
                                onClick={() => seat && isClickable && onSeatClick(seat)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    ...borders,
                                    ...(cornerRadius ? { borderRadius: cornerRadius } : {}),
                                }}
                            >
                                {seat && renderSeatCell(seat, isSelected, isClickable)}
                            </MotionBox>
                        );
                    })
                )}
            </Box>
        </Box>
    );
};

export default RoomSeatMap;
