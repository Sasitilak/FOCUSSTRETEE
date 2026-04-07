import { supabase } from '../lib/supabase';
import type { NewsArticle } from '../types/news';

const PAGE_SIZE = 20;

function getDateRange(filter: 'today' | 'yesterday' | 'week'): { from: string; to?: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

    if (filter === 'today') return { from: today };
    if (filter === 'yesterday') return { from: yesterday, to: today };
    return { from: weekAgo };
}

export const getNews = async (opts: {
    dateFilter: 'today' | 'yesterday' | 'week';
    category?: string;
    page?: number;
}): Promise<NewsArticle[]> => {
    const { dateFilter, category, page = 0 } = opts;
    const { from, to } = getDateRange(dateFilter);

    // Use fetched_at for today/yesterday so timezone differences don't hide articles
    const dateColumn = dateFilter === 'week' ? 'published_at' : 'fetched_at';

    let query = supabase
        .from('news_articles')
        .select('*')
        .gte(dateColumn, from)
        .order('published_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (to) query = query.lt(dateColumn, to);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
};

export const getReelsNews = async (category?: string): Promise<NewsArticle[]> => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    let query = supabase
        .from('news_articles')
        .select('*')
        .gte('published_at', weekAgo)
        .order('published_at', { ascending: false })
        .limit(50);

    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
};

export const getWeeklyNews = async (): Promise<NewsArticle[]> => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .gte('published_at', weekAgo)
        .order('published_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
};
