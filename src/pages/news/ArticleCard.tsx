import React, { useState } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { NewsArticle } from '../../types/news';
import { CATEGORY_CONFIG } from '../../types/news';
import { timeAgo } from '../../utils/newsHelpers';

interface Props {
    article: NewsArticle;
}

const ArticleCard: React.FC<Props> = ({ article }) => {
    const theme = useTheme();
    const [imgError, setImgError] = useState(false);
    const cfg = CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.general;

    return (
        <Box
            component="a"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    borderColor: cfg.color,
                },
            }}
        >
            {/* Thumbnail strip */}
            {article.image_url && !imgError ? (
                <Box
                    component="img"
                    src={article.image_url}
                    alt={article.title}
                    onError={() => setImgError(true)}
                    sx={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', display: 'block', flexShrink: 0, bgcolor: theme.palette.mode === 'dark' ? '#1a1d26' : '#f5f5f5' }}
                />
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: 6,
                        background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}60)`,
                        flexShrink: 0,
                    }}
                />
            )}

            {/* Content */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Meta row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label={cfg.label}
                        size="small"
                        sx={{
                            bgcolor: `${cfg.color}20`,
                            color: cfg.color,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 20,
                        }}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem', ml: 'auto' }}>
                        {timeAgo(article.published_at)}
                    </Typography>
                </Box>

                {/* Title */}
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                        mb: 1,
                        lineHeight: 1.45,
                        fontSize: '0.92rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: 'text.primary',
                    }}
                >
                    {article.title}
                </Typography>

                {/* Description */}
                {article.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            fontSize: '0.8rem',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.description}
                    </Typography>
                )}

                {/* Footer */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                        {article.source_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: cfg.color, fontSize: '0.72rem', fontWeight: 600 }}>
                        Read
                        <OpenInNewIcon sx={{ fontSize: '12px' }} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ArticleCard;
