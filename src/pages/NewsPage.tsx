import React, { useState } from 'react';
import { Box, Container, Tabs, Tab, useTheme } from '@mui/material';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import NewsFeed from './news/NewsFeed';
import NewsWeekly from './news/NewsWeekly';

const TABS = [
    { label: 'Feed', icon: <NewspaperIcon sx={{ fontSize: 18 }} /> },
    { label: 'Weekly', icon: <CalendarViewWeekIcon sx={{ fontSize: 18 }} /> },
];

const NewsPage: React.FC = () => {
    const theme = useTheme();
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
                <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 3 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', minHeight: 44 },
                        }}
                    >
                        {TABS.map((t, i) => (
                            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
                        ))}
                    </Tabs>
                </Box>

                {tab === 0 && <NewsFeed />}
                {tab === 1 && <NewsWeekly />}
            </Container>
        </Box>
    );
};

export default NewsPage;
