import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Loader2, RefreshCw, Clock, Filter, Globe, ChevronRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

const NewsHub = () => {
    const { t } = useTranslation();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');

    // Mock timestamps/authors for demo since backend might not provide them yet
    const enrichNewsData = (data) => {
        return data.map((item, index) => ({
            ...item,
            id: index,
            // Generate a realistic recent time if missing
            timestamp: item.timestamp || new Date(Date.now() - Math.random() * 86400000).toISOString(),
            // Extract source from URL if not provided
            source: item.source || (item.url ? new URL(item.url).hostname.replace('www.', '').split('.')[0] : 'TradeSense'),
            author: item.author || 'Market Desk',
            category: ['Markets', 'Forex', 'Economy', 'Crypto'][Math.floor(Math.random() * 4)] // Simulated category
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    const fetchNews = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const response = await api.get('/api/news');
            // Assuming backend returns flat list: [{title, summary, url}, ...]
            const enriched = enrichNewsData(response.data);
            setNews(enriched);
        } catch (err) {
            console.error('[NewsHub] Error:', err);
            // On error, we might want to keep old news or show empty state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
        const interval = setInterval(() => fetchNews(), 300000); // 5 min auto-refresh
        return () => clearInterval(interval);
    }, []);

    const filteredNews = filter === 'ALL'
        ? news
        : news.filter(item => item.category.toUpperCase() === filter);

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-96 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Newspaper className="w-4 h-4 text-primary opacity-50" />
                    </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary animate-pulse">
                    {t('news.loading_feed') || 'Chargement du Flux...'}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in font-primary">
            {/* Header / Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                        <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tighter uppercase leading-none">
                            {t('news.hub_title') || 'Market Insights'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                {t('news.live_feed') || 'Flux en temps réel'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex bg-background-input/50 p-1 rounded-xl border border-border/50">
                        {['ALL', 'FOREX', 'CRYPTO', 'ECONOMY'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${filter === cat
                                        ? 'bg-background-card text-primary shadow-sm border border-border/50'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchNews(true)}
                        disabled={refreshing}
                        className="p-2.5 bg-background-input/50 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-xl border border-border/50 transition-all group"
                        title="Actualiser"
                    >
                        <RefreshCw className={`w-4 h-4 transition-transform ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    </button>
                </div>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredNews.length > 0 ? (
                    filteredNews.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex flex-col bg-background-card border border-border/60 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full"
                        >
                            {/* Card Header: Source & Time */}
                            <div className="px-5 pt-5 pb-3 flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-background-input flex items-center justify-center text-[10px] font-black uppercase text-text-secondary border border-border/50 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                        {item.source.substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                            {item.source}
                                        </span>
                                        <span className="text-[9px] font-bold text-text-secondary opacity-60">
                                            {item.author}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background-input/30 border border-border/30">
                                    <Clock className="w-3 h-3 text-text-secondary" />
                                    <span className="text-[9px] font-mono font-bold text-text-secondary">
                                        {getTimeAgo(item.timestamp)}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-5 pb-5 flex-1 flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-text-primary leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                {item.summary && (
                                    <p className="text-xs text-text-secondary/70 leading-relaxed line-clamp-3 font-medium">
                                        {item.summary}
                                    </p>
                                )}

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/30">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/5 border border-secondary/10 text-[9px] font-black text-secondary uppercase tracking-wider">
                                        <TrendingUp className="w-3 h-3" />
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        LIRE <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                        <Filter className="w-12 h-12 text-text-secondary mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Aucune actualité trouvée dans cette catégorie</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsHub;
