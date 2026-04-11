import React from 'react';
import { Box, Typography, Container, Grid, Link, Divider, Stack, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
    const theme = useTheme();

    const linkSx = { fontSize: '0.85rem', textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'text.primary' } };

    return (
        <Box
            component="footer"
            sx={{
                py: { xs: 5, md: 6 },
                mt: 'auto',
                borderTop: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box component="img" src="/logo.svg" alt="" sx={{ width: 28, height: 28 }} />
                            <Typography variant="subtitle1" fontWeight={700}>Acumen Hive</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 340, lineHeight: 1.7 }}>
                            Study spaces for competitive exam aspirants. Quiet environments, dedicated desks, and flexible booking.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                +91 81435 35390
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                acumenhive@gmail.com
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                            Product
                        </Typography>
                        <Stack spacing={1.2}>
                            <Link component={RouterLink} to="/" sx={linkSx}>Home</Link>
                            <Link component={RouterLink} to="/slots" sx={linkSx}>Book a seat</Link>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                            Legal
                        </Typography>
                        <Stack spacing={1.2}>
                            <Link component={RouterLink} to="/privacy" sx={linkSx}>Privacy</Link>
                            <Link component={RouterLink} to="/terms" sx={linkSx}>Terms</Link>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                            Support
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            For queries, refunds, or support — call or WhatsApp us directly.
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="caption" color="text.secondary">
                    &copy; {new Date().getFullYear()} Acumen Hive. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
