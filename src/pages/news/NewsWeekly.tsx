import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Accordion,
    AccordionSummary, AccordionDetails, Chip, useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getWeeklyNews } from '../../services/newsApi';
import { CATEGORY_CONFIG } from '../../types/news';
import type { NewsArticle } from '../../types/news';
import { timeAgo } from '../../utils/newsHelpers';

const NewsWeekly: React.FC = () => {
    const theme = useTheme();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getWeeklyNews()
            .then(setArticles)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} />
        </Box>
    );

    if (error) return <Alert severity="error">{error}</Alert>;

    // Group by category
    const grouped = Object.keys(CATEGORY_CONFIG).map(cat => ({
        cat,
        cfg: CATEGORY_CONFIG[cat],
        items: articles.filter(a => a.category === cat),
    })).filter(g => g.items.length > 0).sort((a, b) => b.items.length - a.items.length);

    const maxCount = Math.max(1, ...grouped.map(g => g.items.length));

    const startOfWeek = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    {startOfWeek} — {today} · {articles.length} articles
                </Typography>
            </Box>

            {grouped.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">No articles this week yet.</Typography>
                </Box>
            )}

            {grouped.map(({ cat, cfg, items }) => (
                <Accordion
                    key={cat}
                    elevation={0}
                    disableGutters
                    sx={{
                        mb: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '12px !important',
                        overflow: 'hidden',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, mr: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: cfg.color, minWidth: 120 }}>
                                {cfg.label}
                            </Typography>
                            {/* Visual bar */}
                            <Box sx={{ flex: 1, height: 6, bgcolor: theme.palette.action.hover, borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${(items.length / maxCount) * 100}%`,
                                    bgcolor: cfg.color,
                                    borderRadius: 3,
                                    transition: 'width 0.6s ease',
                                }} />
                            </Box>
                            <Chip label={items.length} size="small" sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', height: 20, minWidth: 28 }} />
                        </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                        {items.map((article, i) => (
                            <Box
                                key={article.id}
                                sx={{
                                    py: 1.25,
                                    borderTop: i > 0 ? `1px solid ${theme.palette.divider}` : 'none',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{ lineHeight: 1.4, mb: 0.25, fontSize: '0.82rem' }}
                                    >
                                        {article.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                        {article.source_name} · {timeAgo(article.published_at)}
                                    </Typography>
                                </Box>
                                {article.url && (
                                    <Box
                                        component="a"
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: cfg.color, mt: 0.25, display: 'flex', flexShrink: 0 }}
                                    >
                                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default NewsWeekly;
