import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, IconButton,
    List, ListItem, ListItemText, ListItemSecondaryAction, Divider,
    Chip, Alert, Snackbar, CircularProgress, useTheme, MenuItem
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AddIcon from '@mui/icons-material/Add';
import { getHolidays, addHoliday, deleteHoliday, getBranches } from '../../services/api';
import type { Holiday, Branch } from '../../types/booking';

const AdminHolidays: React.FC = () => {
    const theme = useTheme();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Dayjs | null>(dayjs());
    const [reason, setReason] = useState('');
    const [branchId, setBranchId] = useState<number | 'all'>('all');
    const [submitting, setSubmitting] = useState(false);
    const [snack, setSnack] = useState('');

    useEffect(() => { loadHolidays(); }, []);

    const loadHolidays = async () => {
        setLoading(true);
        try {
            const [holidaysData, branchesData] = await Promise.all([
                getHolidays(),
                getBranches()
            ]);
            setHolidays(holidaysData);
            setBranches(branchesData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!date || !reason) {
            setSnack('Please select a date and provide a reason');
            return;
        }
        setSubmitting(true);
        try {
            const bId = branchId === 'all' ? null : branchId;
            await addHoliday(date.format('YYYY-MM-DD'), bId, reason);
            setSnack('Holiday added successfully');
            setReason('');
            loadHolidays();
        } catch (err) {
            setSnack('Failed to add holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteHoliday(id);
            setSnack('Holiday deleted');
            loadHolidays();
        } catch (err) {
            setSnack('Failed to delete');
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>Holidays & Closures</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage days when the study hall is closed. These dates will be disabled in the booking calendar.
                </Typography>

                <Grid container spacing={3}>
                    {/* Form */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AddIcon fontSize="small" color="primary" /> Add New Closure
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <DatePicker
                                    label="Select Date"
                                    value={date}
                                    onChange={(v) => setDate(v)}
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                                <TextField
                                    select
                                    label="Branch"
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value as any)}
                                    size="small"
                                    fullWidth
                                >
                                    <MenuItem value="all">All Branches</MenuItem>
                                    {branches.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Independence Day"
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    disabled={submitting}
                                    onClick={handleAdd}
                                    sx={{ mt: 1 }}
                                >
                                    Add Holiday
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* List */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, minHeight: 300 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventBusyIcon fontSize="small" color="primary" /> Upcoming Closures
                            </Typography>

                            {holidays.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                                    <EventBusyIcon sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="body2">No holidays scheduled</Typography>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {holidays.map((h, i) => (
                                        <React.Fragment key={h.id}>
                                            <ListItem sx={{ px: 1 }}>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {dayjs(h.date).format('MMM D, YYYY')}
                                                            </Typography>
                                                            <Chip
                                                                label={h.branchId ? `Branch ${h.branchId}` : 'Global'}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={h.reason}
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" size="small" color="error" onClick={() => handleDelete(h.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            {i < holidays.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}>
                    <Alert severity="info" variant="filled" sx={{ borderRadius: 2 }}>{snack}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
};

export default AdminHolidays;
