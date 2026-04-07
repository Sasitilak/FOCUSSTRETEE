import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, CircularProgress, Alert, Button,
    ToggleButtonGroup, ToggleButton, useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArticleCard from './ArticleCard';
import { getNews } from '../../services/newsApi';
import { CATEGORY_CONFIG } from '../../types/news';
import type { NewsArticle, DateFilter } from '../../types/news';

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Latest' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
];

const CATEGORIES = ['all', ...Object.keys(CATEGORY_CONFIG)];

const NewsFeed: React.FC = () => {
    const theme = useTheme();
    const [dateFilter, setDateFilter] = useState<DateFilter>('week');
    const [category, setCategory] = useState('all');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (reset = false) => {
        const currentPage = reset ? 0 : page;
        if (reset) setLoading(true); else setLoadingMore(true);
        setError(null);
        try {
            const data = await getNews({ dateFilter, category, page: currentPage });
            if (reset) {
                setArticles(data);
                setPage(1);
            } else {
                setArticles(prev => [...prev, ...data]);
                setPage(p => p + 1);
            }
            setHasMore(data.length === 20);
        } catch (err: any) {
            setError(err.message || 'Failed to load news');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [dateFilter, category, page]);

    // Reset when filters change
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        load(true);
    }, [dateFilter, category]);

    return (
        <Box>
            {/* Date filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={dateFilter}
                    exclusive
                    onChange={(_, v) => v && setDateFilter(v)}
                    size="small"
                >
                    {DATE_OPTIONS.map(d => (
                        <ToggleButton key={d.value} value={d.value} sx={{ px: 2, textTransform: 'none', fontSize: '0.8rem' }}>
                            {d.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {/* Category tabs */}
            <Box sx={{ mb: 3, overflowX: 'auto', display: 'flex', gap: 0.75, pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
                {CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const isActive = category === cat;
                    return (
                        <Box
                            key={cat}
                            onClick={() => setCategory(cat)}
                            sx={{
                                flexShrink: 0,
                                px: 1.5, py: 0.5,
                                borderRadius: 2,
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 700 : 400,
                                border: `1px solid ${isActive ? (cfg?.color ?? theme.palette.primary.main) : theme.palette.divider}`,
                                bgcolor: isActive ? `${cfg?.color ?? theme.palette.primary.main}15` : 'transparent',
                                color: isActive ? (cfg?.color ?? 'primary.main') : 'text.secondary',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cat === 'all' ? 'All' : cfg?.label}
                        </Box>
                    );
                })}
            </Box>

            {/* Loading */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={32} />
                </Box>
            )}

            {/* Error */}
            {error && (
                <Alert
                    severity="error"
                    action={<Button size="small" startIcon={<RefreshIcon />} onClick={() => load(true)}>Retry</Button>}
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            {/* Empty */}
            {!loading && !error && articles.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body1" color="text.secondary">No articles found for this filter.</Typography>
                    <Typography variant="caption" color="text.disabled">News is fetched 4 times a day — check back later.</Typography>
                </Box>
            )}

            {/* Articles grid */}
            {!loading && articles.length > 0 && (
                <>
                    <Grid container spacing={2}>
                        {articles.map(a => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
                                <ArticleCard article={a} />
                            </Grid>
                        ))}
                    </Grid>

                    {/* Load more */}
                    {hasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => load(false)}
                                disabled={loadingMore}
                                startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default NewsFeed;
