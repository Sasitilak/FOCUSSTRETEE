import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';

const Footer: React.FC = () => {
    const theme = useTheme();
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                mt: 'auto',
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    © {new Date().getFullYear()} Acumen Hive — All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
