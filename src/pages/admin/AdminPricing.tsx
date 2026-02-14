import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Switch, Snackbar, Alert,
    CircularProgress, useTheme,
} from '@mui/material';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { getAdminSlots, updateSlotPrice, toggleSlotActive } from '../../services/api';

interface SlotRow {
    id: string;
    name: string;
    duration_days: number;
    price: number;
    is_active: boolean;
}

const AdminPricing: React.FC = () => {
    const theme = useTheme();
    const [slots, setSlots] = useState<SlotRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [snack, setSnack] = useState('');
    const [editPrices, setEditPrices] = useState<Record<string, string>>({});

    useEffect(() => { loadSlots(); }, []);

    const loadSlots = async () => {
        setLoading(true);
        const data = await getAdminSlots();
        setSlots(data);
        const prices: Record<string, string> = {};
        data.forEach(s => { prices[s.id] = String(s.price); });
        setEditPrices(prices);
        setLoading(false);
    };

    const handleSavePrice = async (slotId: string) => {
        const newPrice = parseInt(editPrices[slotId]);
        if (isNaN(newPrice) || newPrice < 0) { setSnack('Invalid price'); return; }
        setSaving(slotId);
        try {
            await updateSlotPrice(slotId, newPrice);
            setSlots(prev => prev.map(s => s.id === slotId ? { ...s, price: newPrice } : s));
            setSnack('Price updated');
        } catch {
            setSnack('Failed to update');
        }
        setSaving(null);
    };

    const handleToggleActive = async (slotId: string, currentActive: boolean) => {
        try {
            await toggleSlotActive(slotId, !currentActive);
            setSlots(prev => prev.map(s => s.id === slotId ? { ...s, is_active: !currentActive } : s));
            setSnack(!currentActive ? 'Slot enabled' : 'Slot disabled');
        } catch {
            setSnack('Failed to update');
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Pricing</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Edit slot prices and enable/disable plans.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {slots.map(slot => (
                    <Paper
                        key={slot.id}
                        elevation={0}
                        sx={{
                            p: 3, borderRadius: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            opacity: slot.is_active ? 1 : 0.5,
                            transition: 'opacity 0.3s ease',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>{slot.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{slot.duration_days} days</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {slot.is_active ? 'Active' : 'Disabled'}
                                </Typography>
                                <Switch
                                    checked={slot.is_active}
                                    onChange={() => handleToggleActive(slot.id, slot.is_active)}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                value={editPrices[slot.id] ?? ''}
                                onChange={e => setEditPrices(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                type="number"
                                InputProps={{
                                    startAdornment: <CurrencyRupeeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />,
                                }}
                                sx={{
                                    width: 140,
                                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleSavePrice(slot.id)}
                                disabled={saving === slot.id || String(slot.price) === editPrices[slot.id]}
                                sx={{ px: 2, minWidth: 70 }}
                            >
                                {saving === slot.id ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                            </Button>
                            {String(slot.price) !== editPrices[slot.id] && (
                                <Typography variant="caption" color="text.secondary">
                                    was ₹{slot.price}
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack('')}>
                <Alert severity="info" variant="filled" sx={{ borderRadius: 2 }}>{snack}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminPricing;
