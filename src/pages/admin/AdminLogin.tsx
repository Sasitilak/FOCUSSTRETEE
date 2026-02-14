import React, { useState } from 'react';
import {
    Box, Container, Typography, TextField, Button, Paper, CircularProgress,
    Alert, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { signInWithPhone, verifyOtp, isAdmin } = useAuth();

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('+91');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already admin, redirect
    React.useEffect(() => {
        if (isAdmin) navigate('/admin');
    }, [isAdmin, navigate]);

    const handleSendOtp = async () => {
        if (phone.length < 10) { setError('Enter a valid phone number'); return; }
        setLoading(true); setError('');
        const { error: err } = await signInWithPhone(phone);
        setLoading(false);
        if (err) { setError(err); return; }
        setStep('otp');
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 4) { setError('Enter the OTP'); return; }
        setLoading(true); setError('');
        const { error: err } = await verifyOtp(phone, otp);
        setLoading(false);
        if (err) { setError(err); return; }
        // AuthContext will check admin table and set isAdmin
        navigate('/admin');
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default', px: 2,
        }}>
            <Container maxWidth="xs">
                <Paper elevation={0} sx={{
                    p: 4, borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center',
                }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <LockIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>

                    <Typography variant="h5" fontWeight={700} gutterBottom>Admin Login</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {step === 'phone' ? 'Enter your registered admin phone number' : `Enter the OTP sent to ${phone}`}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                    {step === 'phone' ? (
                        <>
                            <TextField
                                fullWidth label="Phone Number" variant="outlined"
                                value={phone} onChange={e => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained" fullWidth size="large"
                                onClick={handleSendOtp} disabled={loading}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <TextField
                                fullWidth label="OTP Code" variant="outlined"
                                value={otp} onChange={e => setOtp(e.target.value)}
                                placeholder="123456"
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem' } }}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained" fullWidth size="large"
                                onClick={handleVerifyOtp} disabled={loading}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
                            </Button>
                            <Button
                                fullWidth size="small" sx={{ mt: 1, color: 'text.secondary' }}
                                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                            >
                                Change Number
                            </Button>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;
