
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container, Paper } from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { getMaintenanceMode } from '../services/api';

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
    const location = useLocation();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        const check = async () => {
            try {
                const mode = await getMaintenanceMode();
                setIsMaintenance(mode);
            } catch (error) {
                console.error("Failed to check maintenance mode:", error);
            } finally {
                setLoading(false);
            }
        };
        check();
    }, [location.pathname]);

    if (loading) {
        // Optional: Show a loading spinner or just render nothing to avoid flash
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isMaintenance && !isAdminRoute) {
        return (
            <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                    <EngineeringIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Under Maintenance
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        We are currently performing scheduled maintenance to improve your experience.
                        Please check back later.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return <>{children}</>;
};

export default MaintenanceGuard;
