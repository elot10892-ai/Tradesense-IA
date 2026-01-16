import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, Heart, Send, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const CommunityZone = () => {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setError(null);
            const response = await api.get('/api/community/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('Impossible de charger les publications');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!content.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            const response = await api.post('/api/community/posts', { content });
            setPosts([response.data, ...posts]);
            setContent('');
        } catch (error) {
            console.error('Error creating post:', error);
            if (error.response?.status === 401) {
                setError('Veuillez vous connecter pour publier');
            } else {
                setError('Erreur lors de la publication');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            const response = await api.post(`/api/community/posts/${postId}/like`);
            const { likes_count, is_liked } = response.data;

            setPosts(posts.map(post =>
                post.id === postId
                    ? { ...post, likes_count, is_liked }
                    : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
            if (error.response?.status === 401) {
                alert('Veuillez vous connecter pour liker une publication');
            }
        }
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return "...";
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMins < 1) return "À l'instant";
        if (diffInMins < 60) return `Il y a ${diffInMins} min`;
        if (diffInHours < 24) return `Il y a ${diffInHours} h`;
        if (diffInDays === 1) return "Hier";
        return `Il y a ${diffInDays} j`;
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-12 px-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-success/10 rounded-xl border border-success/20">
                    <MessageSquare className="text-success w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase tracking-tighter">Zone Communautaire</h1>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Échangez avec la communauté TradeSense</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger animate-shake mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-xs uppercase font-black hover:underline">Fermer</button>
                </div>
            )}

            {/* Post Form */}
            <div className="bg-background-card p-6 rounded-2xl border border-border shadow-sm mb-8 transition-all hover:border-success/30">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-background-input flex items-center justify-center border border-border shrink-0 shadow-inner">
                        <User className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Partagez vos analyses ou posez une question..."
                            className="w-full bg-background-input border border-border rounded-xl p-4 text-sm text-text-primary outline-none focus:border-success transition-all resize-none h-24 shadow-sm"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handlePublish}
                                disabled={submitting || !content.trim()}
                                className={`px-6 py-2 bg-success text-white font-black rounded-xl text-xs uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-success/30 active:translate-y-[0px] transition-all shadow-lg shadow-success/20 flex items-center gap-2 ${submitting || !content.trim() ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Publication...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3 h-3" />
                                        Publier
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-success" />
                        <p className="font-black uppercase text-[10px] tracking-widest opacity-50">Chargement du flux social...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-background-card rounded-2xl border border-border border-dashed">
                        <MessageSquare className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
                        <p className="text-text-secondary font-bold uppercase text-xs tracking-widest">Aucune publication pour le moment</p>
                        <p className="text-text-secondary text-[10px] mt-2 font-bold opacity-50">Soyez le premier à partager une analyse !</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="bg-background-card p-6 rounded-2xl border border-border shadow-sm hover:border-secondary transition-all group animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-background-input flex items-center justify-center border border-border group-hover:border-secondary/50 transition-colors shadow-inner">
                                    <User className="w-5 h-5 text-text-secondary" />
                                </div>
                                <div>
                                    <div className="font-bold text-text-primary flex items-center gap-2">
                                        @{post.username}
                                        {post.role === 'admin' && <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] rounded-full font-black uppercase tracking-tighter">Admin</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-text-secondary font-bold uppercase opacity-60">
                                        <Clock className="w-3 h-3" />
                                        {formatRelativeTime(post.created_at)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-text-primary leading-relaxed mb-6 whitespace-pre-wrap text-sm font-medium">
                                {post.content}
                            </p>
                            <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`flex items-center gap-2 transition-all hover:scale-110 active:scale-90 ${post.is_liked ? 'text-danger' : 'text-text-secondary hover:text-danger'}`}
                                >
                                    <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-black">{post.likes_count}</span>
                                </button>
                                <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors cursor-not-allowed opacity-30">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-xs font-black">Répondre</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommunityZone;
