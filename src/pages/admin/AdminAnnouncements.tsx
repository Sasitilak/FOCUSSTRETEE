import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    List, ListItem, ListItemText, Divider,
    Chip, Alert, Snackbar, CircularProgress, useTheme, FormGroup, FormControlLabel, Checkbox,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import { getAnnouncementHistory, sendBulkAnnouncement } from '../../services/api';
import type { Announcement } from '../../types/booking';

const AdminAnnouncements: React.FC = () => {
    const theme = useTheme();
    const [history, setHistory] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [targets, setTargets] = useState({
        active: true,
        pending: false,
        past: false,
        all: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [snack, setSnack] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncementHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setConfirmOpen(false);
        setSubmitting(true);
        try {
            const selectedTargets = Object.entries(targets)
                .filter(([key, checked]) => checked && key !== 'all')
                .map(([key]) => key as any);

            await sendBulkAnnouncement(message, selectedTargets);
            setSnack('Announcement broadcast request sent successfully!');
            setMessage('');
            loadHistory();
        } catch (err) {
            setSnack('Failed to send announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const preSendCheck = () => {
        const selectedTargets = Object.entries(targets)
            .filter(([key, checked]) => checked && key !== 'all')
            .map(([key]) => key as any);

        if (!message || selectedTargets.length === 0) {
            setSnack('Please enter a message and select at least one target group');
            return;
        }
        setConfirmOpen(true);
    };

    const handleTargetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        if (name === 'all' && checked) {
            setTargets({ active: true, pending: true, past: true, all: true });
        } else if (name === 'all' && !checked) {
            setTargets({ active: false, pending: false, past: false, all: false });
        } else {
            setTargets(prev => {
                const updated = { ...prev, [name]: checked };
                const allSelected = updated.active && updated.pending && updated.past;
                return { ...updated, all: allSelected };
            });
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>Bulk Announcements</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Send broadcast messages to your customers via WhatsApp based on their booking status.
            </Typography>

            <Grid container spacing={3}>
                {/* Editor */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CampaignIcon fontSize="small" color="primary" /> Compose Message
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                                    Target Stakeholders
                                </Typography>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={targets.active} onChange={handleTargetChange} name="active" />}
                                        label={<Typography variant="body2">Active</Typography>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={targets.pending} onChange={handleTargetChange} name="pending" />}
                                        label={<Typography variant="body2">Pending</Typography>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={targets.past} onChange={handleTargetChange} name="past" />}
                                        label={<Typography variant="body2">Past</Typography>}
                                    />
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={targets.all} onChange={handleTargetChange} name="all" color="primary" />}
                                        label={<Typography variant="body2" fontWeight={targets.all ? 700 : 400}>Select All</Typography>}
                                    />
                                </FormGroup>
                            </Box>

                            <TextField
                                label="WhatsApp Message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your announcement here..."
                                multiline
                                rows={6}
                                fullWidth
                                helperText="Note: Standard WhatsApp rates and policies apply."
                            />

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<SendIcon />}
                                disabled={submitting}
                                onClick={preSendCheck}
                                sx={{ py: 1.2 }}
                            >
                                Broadcast Message
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* History */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, minHeight: 400 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon fontSize="small" color="primary" /> Recently Sent
                        </Typography>

                        {history.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                                <HistoryIcon sx={{ fontSize: 48, mb: 1 }} />
                                <Typography variant="body2">No announcement history</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {history.map((a, i) => (
                                    <React.Fragment key={a.id}>
                                        <ListItem sx={{ px: 0, py: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ mb: 1 }}>
                                                        <Typography variant="body2" fontWeight={500}>{a.message}</Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                                        {a.targets.map((t: string) => (
                                                            <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.6rem', textTransform: 'capitalize' }} />
                                                        ))}
                                                        <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.7 }}>
                                                            {new Date(a.sentAt).toLocaleDateString()} • {a.recipientCount} recipients
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        {i < history.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')}>
                <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snack}</Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Broadcast?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are about to send a WhatsApp broadcast to all <b>{
                            Object.entries(targets)
                                .filter(([k, v]) => v && k !== 'all')
                                .map(([k]) => k)
                                .join(', ')
                        }</b> stakeholders. This action cannot be undone.
                        <br /><br />
                        Message: <i>"{message.substring(0, 100)}{message.length > 100 ? '...' : ''}"</i>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleSend}
                        variant="contained"
                        sx={{ px: 3, borderRadius: 2 }}
                    >
                        Send Now
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminAnnouncements;
