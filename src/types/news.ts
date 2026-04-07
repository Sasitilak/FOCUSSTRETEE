export interface NewsArticle {
    id: string;
    title: string;
    description: string | null;
    source_name: string;
    category: string;
    published_at: string;
    url: string | null;
    image_url: string | null;
    content_hash: string;
    fetched_at: string;
    view_count: number;
}

export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    general:       { label: 'General',          color: '#7c83ff', bg: '#1a1a2e' },
    business:      { label: 'Banking/Economy',  color: '#00d4aa', bg: '#0d1b2a' },
    nation:        { label: 'National',         color: '#ff6b9d', bg: '#10002b' },
    world:         { label: 'International',    color: '#ffd166', bg: '#001219' },
    technology:    { label: 'Technology',       color: '#4ecdc4', bg: '#0b1215' },
    science:       { label: 'Science/Env',      color: '#e07cff', bg: '#1b0a1a' },
    health:        { label: 'Health',           color: '#06d6a0', bg: '#0a0f0d' },
    sports:        { label: 'Sports',           color: '#ff8a5c', bg: '#1a0000' },
    entertainment: { label: 'Entertainment',    color: '#f472b6', bg: '#1a1005' },
};

export type DateFilter = 'today' | 'yesterday' | 'week';
