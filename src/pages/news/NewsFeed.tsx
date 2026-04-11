import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, CircularProgress, Alert, Button, useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ArticleCard from './ArticleCard';
import { getNews } from '../../services/newsApi';
import { trackNewsEvent } from '../../services/newsAnalytics';
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

    // Track tab open on mount
    useEffect(() => { trackNewsEvent('tab_open'); }, []);

    useEffect(() => {
        setPage(0);
        setHasMore(true);
        load(true);
    }, [dateFilter, category]);

    const pillSx = (isActive: boolean, color?: string) => ({
        flexShrink: 0,
        px: 1.8, py: 0.6,
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: isActive ? 700 : 500,
        border: `1.5px solid ${isActive ? (color ?? theme.palette.primary.main) : theme.palette.divider}`,
        bgcolor: isActive ? `${color ?? theme.palette.primary.main}18` : 'transparent',
        color: isActive ? (color ?? theme.palette.primary.main) : 'text.secondary',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        '&:hover': {
            borderColor: color ?? theme.palette.primary.main,
            bgcolor: `${color ?? theme.palette.primary.main}10`,
        },
    });

    return (
        <Box>
            {/* Date filter pills */}
            <Box sx={{ mb: 2, display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
                {DATE_OPTIONS.map(d => (
                    <Box
                        key={d.value}
                        onClick={() => { setDateFilter(d.value); trackNewsEvent('date_filter', { filter: d.value }); }}
                        sx={pillSx(dateFilter === d.value)}
                    >
                        {d.label}
                    </Box>
                ))}
            </Box>

            {/* Category pills */}
            <Box sx={{ mb: 3, overflowX: 'auto', display: 'flex', gap: 0.75, pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
                {CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const isActive = category === cat;
                    return (
                        <Box
                            key={cat}
                            onClick={() => { setCategory(cat); trackNewsEvent('category_filter', { category: cat }); }}
                            sx={pillSx(isActive, cfg?.color)}
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
                    <NewspaperIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>No articles found</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                        News is fetched 4 times a day — try a different filter or check back later.
                    </Typography>
                </Box>
            )}

            {/* Articles grid */}
            {!loading && articles.length > 0 && (
                <>
                    <Grid container spacing={2}>
                        {articles.map(a => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
                                <ArticleCard article={a} onArticleClick={() => trackNewsEvent('article_click', { title: a.title, category: a.category, articleId: a.id })} />
                            </Grid>
                        ))}
                    </Grid>

                    {hasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Button
                                variant="outlined"
                                onClick={() => { load(false); trackNewsEvent('load_more'); }}
                                disabled={loadingMore}
                                startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
                                sx={{ borderRadius: '20px', px: 3 }}
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
