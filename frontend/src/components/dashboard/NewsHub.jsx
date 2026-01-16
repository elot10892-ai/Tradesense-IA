
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

const NewsHub = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const response = await api.get('/api/news');
            // Backend returns a list of news items
            setNews(response.data.slice(0, 5));
            setError(null);
        } catch (err) {
            console.error('[NewsHub] Error fetching news:', err);
            setError('Impossible de charger les actualités.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
        // Refresh news every 5 minutes
        const interval = setInterval(() => fetchNews(), 300000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-background-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Chargement du flux...</span>
            </div>
        );
    }

    if (error && news.length === 0) {
        return (
            <div className="bg-background-card rounded-2xl border border-border p-6 flex flex-col items-center text-center gap-3">
                <AlertTriangle className="w-8 h-8 text-danger" />
                <p className="text-xs text-text-secondary font-medium">{error}</p>
                <button
                    onClick={() => fetchNews(true)}
                    className="mt-2 text-[10px] font-black text-primary uppercase hover:underline"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-secondary/10 rounded-xl border border-secondary/20">
                    <Newspaper className="text-secondary w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">Hub d’Actualités</h1>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Dernières nouvelles financières</p>
                </div>
                <button
                    onClick={() => fetchNews(true)}
                    disabled={refreshing}
                    className="ml-auto p-3 bg-background-card border border-border rounded-xl hover:border-secondary transition-all group"
                >
                    <RefreshCw className={`w-5 h-5 text-text-secondary group-hover:text-secondary ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {news.map((item, index) => (
                    <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-background-card rounded-2xl border border-border overflow-hidden hover:border-secondary transition-all group flex flex-col shadow-lg"
                    >
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <h3 className="font-black text-text-primary leading-tight group-hover:text-secondary transition-colors">
                                    {item.title}
                                </h3>
                                <ExternalLink className="w-4 h-4 text-text-secondary group-hover:text-secondary shrink-0 transition-colors" />
                            </div>
                            {item.summary && (
                                <p className="text-sm text-text-secondary mb-6 line-clamp-3 leading-relaxed italic">
                                    "{item.summary}"
                                </p>
                            )}
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                                    {new URL(item.url).hostname.replace('www.', '')}
                                </span>
                                <div className="p-2 bg-secondary/10 rounded-lg text-secondary group-hover:bg-secondary group-hover:text-black transition-all">
                                    <Newspaper className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {news.length === 0 && !loading && (
                <div className="p-12 text-center bg-background-card rounded-2xl border border-border border-dashed">
                    <p className="text-sm text-text-secondary font-bold uppercase italic">Aucune actualité disponible pour le moment</p>
                </div>
            )}
        </div>
    );
};

export default NewsHub;
