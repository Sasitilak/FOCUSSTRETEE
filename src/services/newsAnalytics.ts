import { supabase } from '../lib/supabase';

// Generate a simple anonymous session ID (persisted in sessionStorage)
const getSessionId = (): string => {
    let id = sessionStorage.getItem('news_session_id');
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem('news_session_id', id);
    }
    return id;
};

type EventType = 'tab_open' | 'article_click' | 'category_filter' | 'date_filter' | 'load_more';

// Throttle: max 1 event of same type per 2 seconds
const lastEvent = new Map<string, number>();

export const trackNewsEvent = async (
    eventType: EventType,
    metadata?: Record<string, string | number>
) => {
    const now = Date.now();
    const key = `${eventType}-${JSON.stringify(metadata || {})}`;
    if (now - (lastEvent.get(key) || 0) < 2000) return;
    lastEvent.set(key, now);

    try {
        await supabase.from('news_analytics').insert({
            session_id: getSessionId(),
            event_type: eventType,
            metadata: metadata || {},
        });
    } catch {
        // silently fail — analytics should never break the app
    }
};

// ── Admin: fetch analytics ──

export interface NewsAnalyticsStats {
    totalVisitors: number;
    totalArticleClicks: number;
    topArticles: { title: string; clicks: number }[];
    topCategories: { category: string; count: number }[];
    dailyVisitors: { date: string; count: number }[];
    peakHours: { hour: number; count: number }[];
}

export const getNewsAnalytics = async (days = 7): Promise<NewsAnalyticsStats> => {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: events } = await supabase
        .from('news_analytics')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

    const rows = events ?? [];

    // Unique visitors (unique session IDs)
    const uniqueSessions = new Set(rows.map(r => r.session_id));
    const totalVisitors = uniqueSessions.size;

    // Tab opens vs article clicks
    const tabOpens = rows.filter(r => r.event_type === 'tab_open');
    const articleClicks = rows.filter(r => r.event_type === 'article_click');
    const totalArticleClicks = articleClicks.length;

    // Top articles by clicks
    const articleMap = new Map<string, number>();
    articleClicks.forEach(r => {
        const title = r.metadata?.title || 'Unknown';
        articleMap.set(title, (articleMap.get(title) || 0) + 1);
    });
    const topArticles = Array.from(articleMap.entries())
        .map(([title, clicks]) => ({ title, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

    // Top categories
    const catEvents = rows.filter(r => r.event_type === 'category_filter');
    const catMap = new Map<string, number>();
    catEvents.forEach(r => {
        const cat = r.metadata?.category || 'unknown';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    // Also count article clicks by category
    articleClicks.forEach(r => {
        const cat = r.metadata?.category || 'unknown';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    const topCategories = Array.from(catMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Daily visitors (unique sessions per day)
    const dailyMap = new Map<string, Set<string>>();
    rows.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (!dailyMap.has(day)) dailyMap.set(day, new Set());
        dailyMap.get(day)!.add(r.session_id);
    });
    const dailyVisitors = Array.from(dailyMap.entries())
        .map(([date, sessions]) => ({ date, count: sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Peak hours
    const hourMap = new Map<number, number>();
    tabOpens.forEach(r => {
        const hour = new Date(r.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    const peakHours = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour - b.hour);

    return { totalVisitors, totalArticleClicks, topArticles, topCategories, dailyVisitors, peakHours };
};
