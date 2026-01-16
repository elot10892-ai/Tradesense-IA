import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, TrendingUp, User, Globe, ArrowUpRight, Award, Crown } from 'lucide-react';
import api from '../api/axios';

const RankBadge = ({ rank }) => {
    if (rank === 1) return <span className="text-2xl" title="1st Place">🥇</span>;
    if (rank === 2) return <span className="text-2xl" title="2nd Place">🥈</span>;
    if (rank === 3) return <span className="text-2xl" title="3rd Place">🥉</span>;
    return <span className="w-8 h-8 flex items-center justify-center rounded-full bg-background-input text-text-secondary font-black text-xs border border-border">#{rank}</span>;
};

const TopTraderCard = ({ trader, rank }) => {
    const { t } = useTranslation();
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;

    const getColors = () => {
        if (isFirst) return 'border-yellow-500/50 bg-gradient-to-b from-yellow-500/20 via-yellow-500/5 to-transparent shadow-[0_0_30px_rgba(234,179,8,0.15)]';
        if (isSecond) return 'border-gray-400/50 bg-gradient-to-b from-gray-400/20 via-gray-400/5 to-transparent shadow-[0_0_30px_rgba(156,163,175,0.15)]';
        return 'border-orange-700/50 bg-gradient-to-b from-orange-700/20 via-orange-700/5 to-transparent shadow-[0_0_30px_rgba(194,65,12,0.15)]';
    };

    const getIconColor = () => {
        if (isFirst) return 'text-yellow-500';
        if (isSecond) return 'text-gray-400';
        return 'text-orange-600';
    };

    return (
        <div className={`relative flex flex-col items-center p-8 rounded-[2rem] border-2 ${getColors()} ${isFirst ? 'md:order-2 md:scale-110 z-10' : isSecond ? 'md:order-1' : 'md:order-3'} transition-all duration-500 hover:translate-y-[-8px]`}>
            <div className="absolute -top-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-2xl overflow-hidden`}>
                    <div className={`w-full h-full flex items-center justify-center ${isFirst ? 'bg-yellow-500/10' : isSecond ? 'bg-gray-400/10' : 'bg-orange-700/10'}`}>
                        {isFirst ? <Crown className="w-10 h-10 text-yellow-500" /> : <Award className={`w-10 h-10 ${getIconColor()}`} />}
                    </div>
                </div>
                <div className={`-mt-6 px-4 py-2 rounded-full font-black text-lg shadow-lg flex items-center gap-2 ${isFirst ? 'bg-yellow-500 text-black' : isSecond ? 'bg-gray-400 text-black' : 'bg-orange-600 text-white'}`}>
                    {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                    <span className="text-xs uppercase tracking-tighter">{t('leaderboard.rank')} {rank}</span>
                </div>
            </div>

            <div className="mt-12 text-center w-full">
                <h3 className="font-black text-xl text-text-primary mb-1 uppercase tracking-tight truncate w-full px-2">{trader.username}</h3>
                <div className="flex items-center justify-center gap-2 text-xs text-text-secondary mb-6 font-bold uppercase tracking-widest">
                    <Globe className="w-3 h-3 text-primary" />
                    <span>{trader.country || t('leaderboard.global')}</span>
                </div>

                <div className="bg-background-input/40 backdrop-blur-md rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-text-secondary mb-1 font-black uppercase tracking-widest">
                        <TrendingUp className="w-3 h-3" /> {t('leaderboard.profit_month')}
                    </div>
                    <div className="text-3xl font-black text-success flex items-center justify-center">
                        +{trader.profit}%
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/30">
                        <div className="text-[10px] text-text-secondary mb-1 font-black uppercase tracking-widest">
                            {t('leaderboard.payout')}
                        </div>
                        <div className="text-lg font-mono font-black text-text-primary">
                            ${trader.payout?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeaderboardRow = ({ trader, rank }) => {
    const { t } = useTranslation();
    return (
        <div className="group flex items-center justify-between p-5 bg-background-card/40 border border-border rounded-2xl hover:border-primary/50 hover:bg-background-input/20 transition-all duration-300">
            <div className="flex items-center gap-6">
                <div className="w-10 flex justify-center shrink-0">
                    <RankBadge rank={rank} />
                </div>
                <div className="w-12 h-12 rounded-xl bg-background-input border border-border flex items-center justify-center text-text-secondary group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                    <User className="w-6 h-6 group-hover:text-primary transition-colors" />
                </div>
                <div>
                    <div className="font-black text-text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{trader.username}</div>
                    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3 h-3 text-primary/70" /> {trader.country || t('leaderboard.global')}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-10">
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] text-text-secondary font-black uppercase tracking-[0.2em] mb-0.5">{t('dashboard.profit')}</div>
                    <div className="font-black text-success flex items-center gap-1 justify-end">
                        +{trader.profit}%
                        <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>
                <div className="text-right min-w-[120px]">
                    <div className="text-[9px] text-text-secondary font-black uppercase tracking-[0.2em] mb-0.5">{t('leaderboard.payout')}</div>
                    <div className="font-mono font-black text-text-primary leading-none">
                        ${trader.payout?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = () => {
    const { t, i18n } = useTranslation();
    const [traders, setTraders] = useState([]);
    const [loading, setLoading] = useState(true);

    const isRtl = i18n.language === 'ar';

    const fetchLeaderboard = async () => {
        try {
            const response = await api.get('/api/leaderboard/top');
            const data = Array.isArray(response.data) ? response.data : response.data.top_traders || [];
            setTraders(data);
        } catch (error) {
            console.error("Error fetching leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`w-full animate-fade-in py-8 font-primary ${isRtl ? 'rtl' : 'ltr'}`}>
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <Trophy className="w-8 h-8 text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">HALL OF FAME</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-2 uppercase tracking-tighter">
                            {t('leaderboard.title')}
                        </h1>
                        <p className="text-text-secondary font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                            {t('leaderboard.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchLeaderboard(); }}
                        className="px-6 py-3 bg-background-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary transition-all flex items-center gap-2"
                    >
                        {t('leaderboard.refresh_board')}
                    </button>
                </div>

                {loading && traders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-32 gap-4">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{t('common.loading')}</p>
                    </div>
                ) : (
                    <>
                        {traders.length === 0 ? (
                            <div className="bg-background-card border border-border rounded-[2rem] p-20 text-center">
                                <div className="w-20 h-20 bg-background-input rounded-full flex items-center justify-center mx-auto mb-6 text-text-secondary border border-border">
                                    <Award className="w-10 h-10 opacity-20" />
                                </div>
                                <h2 className="text-xl font-black text-text-primary uppercase mb-2">{t('leaderboard.no_competitors')}</h2>
                                <p className="text-text-secondary text-sm font-bold uppercase tracking-widest">{t('leaderboard.be_first')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 mb-20 items-end max-w-5xl mx-auto pt-10">
                                    {traders.length > 1 && <TopTraderCard trader={traders[1]} rank={2} />}
                                    {traders.length > 0 && <TopTraderCard trader={traders[0]} rank={1} />}
                                    {traders.length > 2 && <TopTraderCard trader={traders[2]} rank={3} />}
                                </div>

                                {traders.length > 3 && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem] -m-1 blur-3xl opacity-20 pointer-events-none"></div>
                                        <div className="bg-background-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-2xl relative">
                                            <div className="flex items-center justify-between mb-8 px-4">
                                                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-text-primary flex items-center gap-3">
                                                    <TrendingUp className="w-5 h-5 text-primary" />
                                                    {t('leaderboard.rest_top_10')}
                                                </h2>
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{traders.length - 3} {t('landing.stats.traders')}</span>
                                            </div>

                                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                {traders.slice(3).map((trader, index) => (
                                                    <LeaderboardRow key={trader.username || index} trader={trader} rank={index + 4} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                <div className="mt-20 p-8 border border-border/50 rounded-[2rem] bg-background-input/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
                            <Medal className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-text-primary uppercase tracking-tight">{t('leaderboard.updated_realtime')}</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{t('leaderboard.closed_trades_only')}</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right rtl:text-left">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{t('leaderboard.next_reset')}</p>
                        <p className="text-xs font-mono font-bold text-primary italic">{t('leaderboard.end_month')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
