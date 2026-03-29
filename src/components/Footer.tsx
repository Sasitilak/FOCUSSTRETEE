import React from 'react';
import { Box, Typography, Container, Grid, Link, Divider, Stack, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const Footer: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            component="footer"
            sx={{
                py: { xs: 6, md: 8 },
                mt: 'auto',
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'background.paper' : '#f9fafb',
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Brand & Description */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" fontWeight={800} color="primary.main" gutterBottom>
                            Acumen Hive
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 300, lineHeight: 1.7 }}>
                            Premium study spaces designed for deep focus and maximum productivity. Quiet zones, focus rooms, and cabins across our prime branches.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Your data is safe with us. We won't use it for anything other than your booking confirmation.
                        </Typography>
                    </Grid>

                    {/* Quick Links */}
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Explore
                        </Typography>
                        <Stack spacing={1.5}>
                            <Link component={RouterLink} to="/" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Home</Link>
                            <Link component={RouterLink} to="/slots" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Book Now</Link>
                        </Stack>
                    </Grid>

                    {/* Legal */}
                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Legal
                        </Typography>
                        <Stack spacing={1.5}>
                            <Link component={RouterLink} to="/privacy" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Privacy Policy</Link>
                            <Link component={RouterLink} to="/terms" color="text.secondary" sx={{ fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Terms & Condition</Link>
                        </Stack>
                    </Grid>

                    {/* Contact */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            Contact & Support
                        </Typography>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <PhoneIcon sx={{ fontSize: 20, color: 'primary.main', mt: 0.2 }} />
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>For any queries, refunds, or support, please contact:</Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mt: 0.5 }}>+91 81435 35390</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">acumenhive@gmail.com</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        © {new Date().getFullYear()} Acumen Hive. All rights reserved.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Powering Focus. Built for Aspirants.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
