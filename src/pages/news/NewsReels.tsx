import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Button, CircularProgress, Alert, useTheme } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getReelsNews } from '../../services/newsApi';
import { CATEGORY_CONFIG } from '../../types/news';
import type { NewsArticle } from '../../types/news';
import { timeAgo } from '../../utils/newsHelpers';

const CATEGORIES = ['all', ...Object.keys(CATEGORY_CONFIG)];

const NewsReels: React.FC = () => {
    const theme = useTheme();
    const [category, setCategory] = useState('all');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getReelsNews(category)
            .then(setArticles)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [category]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Category filter */}
            <Box sx={{ overflowX: 'auto', display: 'flex', gap: 0.75, pb: 1, mb: 2, '::-webkit-scrollbar': { display: 'none' } }}>
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

            {articles.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">No articles found.</Typography>
                </Box>
            )}

            {/* Snap-scroll container */}
            <Box
                ref={containerRef}
                sx={{
                    height: 'calc(100vh - 240px)',
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    '::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {articles.map((article) => {
                    const cfg = CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.general;
                    const hasImg = article.image_url && !imgErrors[article.id];

                    return (
                        <Box
                            key={article.id}
                            sx={{
                                scrollSnapAlign: 'start',
                                height: 'calc(100vh - 240px)',
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 3,
                                overflow: 'hidden',
                                mb: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: 'background.paper',
                            }}
                        >
                            {/* Image / Gradient top */}
                            <Box sx={{ position: 'relative', height: '38%', flexShrink: 0 }}>
                                {hasImg ? (
                                    <Box
                                        component="img"
                                        src={article.image_url!}
                                        alt={article.title}
                                        onError={() => setImgErrors(p => ({ ...p, [article.id]: true }))}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Box sx={{
                                        width: '100%', height: '100%',
                                        background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}50)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography sx={{ fontSize: 64, opacity: 0.2, fontWeight: 800 }}>
                                            {cfg.label[0]}
                                        </Typography>
                                    </Box>
                                )}
                                {/* Gradient overlay */}
                                <Box sx={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
                                }} />
                            </Box>

                            {/* Content */}
                            <Box sx={{ p: 2.5, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={cfg.label}
                                        size="small"
                                        sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">{article.source_name}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                        {timeAgo(article.published_at)}
                                    </Typography>
                                </Box>

                                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                                    {article.title}
                                </Typography>

                                {article.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flex: 1 }}>
                                        {article.description}
                                    </Typography>
                                )}

                                {article.url && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ alignSelf: 'flex-start', borderRadius: 2, borderColor: cfg.color, color: cfg.color }}
                                    >
                                        Read Full
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default NewsReels;
