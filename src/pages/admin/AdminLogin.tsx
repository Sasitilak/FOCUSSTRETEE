import React, { useState } from 'react';
import {
    Box, Container, Typography, TextField, Button, Paper, CircularProgress,
    Alert, useTheme, InputAdornment, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { signInWithUsername, isAdmin } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isAdmin) navigate('/admin');
    }, [isAdmin, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) { setError('Please enter both username and password'); return; }

        setLoading(true); setError('');

        const { error: err } = await signInWithUsername(username, password);

        if (err) {
            setLoading(false);
            if (err.includes('Invalid login credentials')) setError('Invalid username or password');
            else setError(err);
        } else {
            // Context updates state
        }
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: '12px',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(0,173,181,0.2)'
                        }}>
                            <MenuBookIcon sx={{ color: '#fff', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>Acumen Hive</Typography>
                            <Typography variant="caption" color="text.secondary">Admin Portal</Typography>
                        </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Sign in with username and password
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth label="Username" variant="outlined"
                            value={username} onChange={e => setUsername(e.target.value)}
                            placeholder="admin"
                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth label="Password" variant="outlined"
                            value={password} onChange={e => setPassword(e.target.value)}
                            type={showPassword ? 'text' : 'password'}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            variant="contained" fullWidth size="large"
                            disabled={loading}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;
