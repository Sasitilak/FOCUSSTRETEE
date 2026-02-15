import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, Grid, Chip, Divider, useTheme,
    Breadcrumbs, Link, Switch, FormControlLabel, CircularProgress
} from '@mui/material';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import LayersIcon from '@mui/icons-material/Layers';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ChairIcon from '@mui/icons-material/Chair';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import {
    getBranches, addBranch, updateBranch, deleteBranch,
    addFloor, updateFloor, deleteFloor,
    addRoom, updateRoom, deleteRoom,
    getSetting, updateSetting
} from '../../services/api';
import type { Branch, Floor } from '../../types/booking';

const AdminLocations: React.FC = () => {
    const theme = useTheme();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState<{ type: 'branches' | 'floors' | 'rooms', id?: number | string }>({ type: 'branches' });
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

    // Dialog states
    const [dialog, setDialog] = useState<{ open: boolean, type: 'branch' | 'floor' | 'room', mode: 'add' | 'edit', data?: any }>({ open: false, type: 'branch', mode: 'add' });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // UPI Settings
    const [upiSettings, setUpiSettings] = useState({ id: '', name: '', phone: '' });
    const [showUpiconfig, setShowUpiConfig] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bData, uId, uName, uPhone] = await Promise.all([
                getBranches(),
                getSetting('upi_id'),
                getSetting('upi_merchant_name'),
                getSetting('upi_phone')
            ]);
            setBranches(bData);
            setUpiSettings({ id: uId || '', name: uName || '', phone: uPhone || '' });

            // Sync selected state if needed
            if (selectedBranch) {
                const updated = bData.find(b => b.id === selectedBranch.id);
                if (updated) {
                    setSelectedBranch(updated);
                    if (selectedFloor) {
                        const updatedF = updated.floors.find(f => f.floorNumber === selectedFloor.floorNumber);
                        if (updatedF) setSelectedFloor(updatedF);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            setErrorMsg('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUpi = async () => {
        try {
            await Promise.all([
                updateSetting('upi_id', upiSettings.id),
                updateSetting('upi_merchant_name', upiSettings.name),
                updateSetting('upi_phone', upiSettings.phone)
            ]);
            alert('UPI Settings Saved');
            setShowUpiConfig(false);
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to save UPI settings');
        }
    };

    const handleOpenDialog = (type: 'branch' | 'floor' | 'room', mode: 'add' | 'edit', data?: any) => {
        setErrorMsg(null);
        setDialog({ open: true, type, mode, data });
    };

    const handleSave = async (formData: any) => {
        try {
            setErrorMsg(null);
            if (dialog.type === 'branch') {
                if (dialog.mode === 'add') await addBranch(formData);
                else await updateBranch(dialog.data.id, formData);
            } else if (dialog.type === 'floor') {
                if (dialog.mode === 'add') await addFloor(selectedBranch!.id, formData);
                else await updateFloor(selectedBranch!.id, dialog.data.floorNumber, formData);
            } else if (dialog.type === 'room') {
                if (dialog.mode === 'add') await addRoom(selectedBranch!.id, selectedFloor!.floorNumber, formData);
                else await updateRoom(selectedBranch!.id, selectedFloor!.floorNumber, dialog.data.id, formData);
            }
            await loadData();
            setDialog({ ...dialog, open: false });
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to save changes');
        }
    };

    const handleDelete = async (type: 'branch' | 'floor' | 'room', id: any) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            if (type === 'branch') await deleteBranch(id);
            else if (type === 'floor') await deleteFloor(selectedBranch!.id, id);
            else if (type === 'room') await deleteRoom(selectedBranch!.id, selectedFloor!.floorNumber, id);
            await loadData();
            if (type === 'branch' && selectedBranch?.id === id) setView({ type: 'branches' });
            if (type === 'floor' && selectedFloor?.floorNumber === id) setView({ type: 'floors', id: selectedBranch?.id });
        } catch (err: any) {
            alert(err.message || 'Failed to delete');
        }
    };

    if (loading && branches.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Facility Configuration</Typography>
                    <Breadcrumbs sx={{ mt: 1 }}>
                        <Link component="button" color="inherit" underline="hover" onClick={() => { setView({ type: 'branches' }); setSelectedBranch(null); setSelectedFloor(null); }}>
                            Branches
                        </Link>
                        {selectedBranch && (
                            <Link component="button" color="inherit" underline="hover" onClick={() => { setView({ type: 'floors', id: selectedBranch.id }); setSelectedFloor(null); }}>
                                {selectedBranch.name}
                            </Link>
                        )}
                        {selectedFloor && (
                            <Typography color="primary" fontWeight={600}>
                                Floor {selectedFloor.floorNumber}
                            </Typography>
                        )}
                    </Breadcrumbs>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setShowUpiConfig(!showUpiconfig)}>
                        Payment Config
                    </Button>
                    {view.type === 'branches' && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('branch', 'add')}>
                            Add Branch
                        </Button>
                    )}
                    {view.type === 'floors' && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('floor', 'add')}>
                            Add Floor
                        </Button>
                    )}
                    {view.type === 'rooms' && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('room', 'add')}>
                            Add Room
                        </Button>
                    )}
                </Box>
            </Box>

            {showUpiconfig && (
                <Card sx={{ mb: 4, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }} elevation={0}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Payment Settings (UPI)</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="UPI ID" fullWidth size="small"
                                    value={upiSettings.id}
                                    onChange={e => setUpiSettings({ ...upiSettings, id: e.target.value })}
                                    placeholder="username@bank"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Merchant Name" fullWidth size="small"
                                    value={upiSettings.name}
                                    onChange={e => setUpiSettings({ ...upiSettings, name: e.target.value })}
                                    placeholder="Business Name"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="UPI Phone" fullWidth size="small"
                                    value={upiSettings.phone}
                                    onChange={e => setUpiSettings({ ...upiSettings, phone: e.target.value })}
                                    placeholder="9876543210"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                                <Button variant="contained" onClick={handleSaveUpi} fullWidth>Save</Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errorMsg}
                </Alert>
            )}

            {view.type === 'branches' && (
                <Grid container spacing={3}>
                    {branches.map(branch => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={branch.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <LocationCityIcon color="primary" />
                                        <Typography variant="h6" fontWeight={700}>{branch.name}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{branch.address}</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            {branch.floors.length} Floors
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenDialog('branch', 'edit', branch)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete('branch', branch.id)}><DeleteIcon fontSize="small" /></IconButton>
                                            <Button
                                                size="small" variant="text" sx={{ ml: 1 }}
                                                onClick={() => { setSelectedBranch(branch); setView({ type: 'floors', id: branch.id }); }}
                                            >
                                                Manage Floors
                                            </Button>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {view.type === 'floors' && selectedBranch && (
                <Grid container spacing={3}>
                    {selectedBranch.floors.map(floor => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={floor.floorNumber}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <LayersIcon color="secondary" />
                                        <Typography variant="h6" fontWeight={700}>Floor {floor.floorNumber}</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            {floor.rooms.length} Rooms
                                        </Typography>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenDialog('floor', 'edit', floor)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete('floor', floor.floorNumber)}><DeleteIcon fontSize="small" /></IconButton>
                                            <Button
                                                size="small" variant="text" sx={{ ml: 1 }}
                                                onClick={() => { setSelectedFloor(floor); setView({ type: 'rooms', id: floor.floorNumber }); }}
                                            >
                                                Manage Rooms
                                            </Button>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {view.type === 'rooms' && selectedFloor && (
                <Grid container spacing={3}>
                    {selectedFloor.rooms.map(room => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={room.id}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <MeetingRoomIcon color="action" />
                                        <Typography variant="h6" fontWeight={700}>{room.name}</Typography>
                                        <Chip label={room.roomNo} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                        {room.isAc && <Chip icon={<AcUnitIcon sx={{ fontSize: '14px !important' }} />} label="AC" size="small" color="info" variant="filled" />}
                                        <Chip label={`₹${room.price_daily || 50}/day`} size="small" color="success" variant="outlined" />
                                        <Chip icon={<ChairIcon sx={{ fontSize: '14px !important' }} />} label={`${room.seats.length} Seats`} size="small" variant="outlined" />
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <IconButton size="small" onClick={() => handleOpenDialog('room', 'edit', room)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete('room', room.id)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Edit/Add Dialog */}
            <LocationDialog
                open={dialog.open}
                type={dialog.type}
                mode={dialog.mode}
                data={dialog.data}
                onClose={() => setDialog({ ...dialog, open: false })}
                onSave={handleSave}
            />
        </Box>
    );
};

interface LocationDialogProps {
    open: boolean;
    type: 'branch' | 'floor' | 'room';
    mode: 'add' | 'edit';
    data?: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

const LocationDialog: React.FC<LocationDialogProps> = ({ open, type, mode, data, onClose, onSave }) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (data) {
            if (type === 'room') setFormData({ ...data, seatsCount: data.seats?.length || 0, price_daily: data.price_daily || 50, isAc: data.isAc || false });
            else setFormData(data);
        }
        else if (type === 'floor') setFormData({ floorNumber: 1 });
        else if (type === 'room') setFormData({ name: '', roomNo: '', seatsCount: 10, price_daily: 50, isAc: false });
        else setFormData({ name: '', address: '' });
    }, [data, type, open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {mode === 'add' ? 'Add' : 'Edit'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </DialogTitle>
            <DialogContent dividers>
                {type === 'branch' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Branch Name" fullWidth size="small"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Address" fullWidth size="small" multiline rows={2}
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </Box>
                )}
                {type === 'floor' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Floor Number" type="number" fullWidth size="small"
                            value={formData.floorNumber || 1}
                            onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
                        />
                    </Box>
                )}
                {type === 'room' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Room Name" fullWidth size="small" placeholder="Main Hall"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Room No" fullWidth size="small" placeholder="R1"
                            value={formData.roomNo || ''}
                            onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                        />
                        <TextField
                            label="Daily Price (₹)" type="number" fullWidth size="small"
                            value={formData.price_daily || 50}
                            onChange={(e) => setFormData({ ...formData, price_daily: parseInt(e.target.value) })}
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.isAc || false} onChange={e => setFormData({ ...formData, isAc: e.target.checked })} />}
                            label="AC Room"
                        />
                        <TextField
                            label="Number of Seats" type="number" fullWidth size="small"
                            value={formData.seatsCount || 10}
                            onChange={(e) => setFormData({ ...formData, seatsCount: parseInt(e.target.value) })}
                            helperText="Seats will be automatically generated (S1, S2, ...)"
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(formData)} disabled={!formData.name && type !== 'floor'}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminLocations;
