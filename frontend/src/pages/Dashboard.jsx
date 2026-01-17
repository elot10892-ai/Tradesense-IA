import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Wallet, Activity, ArrowUp, ArrowDown, Target, LayoutDashboard, Clock, RefreshCw, AlertCircle, Loader2, Globe, Flag, Newspaper, MessageSquare, GraduationCap, Trophy, Coins, Menu, X } from 'lucide-react';
import { FiLogOut } from 'react-icons/fi';
import api from '../api/axios';

// Components
import PriceChart from '../components/trading/PriceChart';
import OrderPanel from '../components/trading/OrderPanel';
import LiveTicker from '../components/common/LiveTicker';
import NewsHub from '../components/dashboard/NewsHub';
import CommunityZone from '../components/dashboard/CommunityZone';
import MasterClass from '../components/dashboard/MasterClass';
import Pricing from './Pricing';
import Leaderboard from './Leaderboard';
import SignalsPanel from '../components/trading/SignalsPanel';

const StatsCard = ({ title, value, subtext, icon: Icon, colorClass = "text-primary" }) => (
    <div className="bg-background-card p-4 rounded-xl border border-border shadow-sm transition-all hover:border-secondary">
        <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm font-medium">{title}</span>
            <div className={`p-2 rounded-lg bg-background-input/50 ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-text-secondary mt-1 font-medium">{subtext}</div>}
    </div>
);

const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    const configs = {
        'active': { label: t('status.active'), bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: 'bg-blue-500' },
        'passed': { label: t('status.passed'), bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', dot: 'bg-success' },
        'failed': { label: t('status.failed'), bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', dot: 'bg-danger' },
    };

    const config = configs[status] || configs.active;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.border} border shadow-lg animate-pulse-slow`}>
            <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.text}`}>
                Challenge {config.label}
            </span>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout, refreshProfile, loading: authLoading } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const isRtl = i18n.language === 'ar';

    // Data states
    const [markets, setMarkets] = useState([]);
    const [selectedMarketType, setSelectedMarketType] = useState('INTERNATIONAL');
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [challenge, setChallenge] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('CHALLENGE');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchSymbol, setSearchSymbol] = useState('');
    const [activeView, setActiveView] = useState('TRADING');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchData = async () => {
        if (authLoading || !user) return;

        try {
            setError(null);
            const currentChallenge = user.activeChallenge;
            if (!currentChallenge) {
                setLoading(false);
                return;
            }
            setChallenge(currentChallenge);

            const tradesUrl = viewMode === 'HISTORY'
                ? '/api/trading/history'
                : `/api/trading/challenge/${currentChallenge.id}/trades`;

            const [marketsRes, tradesRes, statusRes] = await Promise.all([
                api.get('/api/trading/markets').catch(e => ({ data: { markets: [] } })),
                api.get(tradesUrl).catch(e => ({ data: { trades: [] } })),
                api.get(`/api/trading/challenge/${currentChallenge.id}/status`).catch(e => ({ data: { challenge: currentChallenge } }))
            ]);

            const marketsList = marketsRes.data.markets || [];
            const fetchedTrades = tradesRes.data.trades || [];
            const updatedChallenge = statusRes.data.challenge;

            if (updatedChallenge) setChallenge(updatedChallenge);
            setMarkets(marketsList);
            setTrades(fetchedTrades);

            if (marketsList.length > 0 && !selectedSymbol) {
                const initial = marketsList.find(m => m.exchange !== 'Casablanca Stock Exchange')?.symbol || marketsList[0].symbol;
                setSelectedSymbol(initial);
            }
        } catch (err) {
            console.error("[Dashboard] Error:", err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 5000);
        return () => clearInterval(interval);
    }, [user, authLoading, selectedSymbol, viewMode]);

    const handleSync = async () => {
        if (!challenge) return;
        setLoading(true);
        try {
            const res = await api.post(`/api/trading/challenge/${challenge.id}/sync`);
            if (res.data.challenge) setChallenge(res.data.challenge);
            await fetchData();
        } catch (err) {
            console.error("[Dashboard] Sync failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderExecuted = (newTrade, updatedChallenge) => {
        setTrades(prev => [newTrade, ...prev]);
        if (updatedChallenge) setChallenge(updatedChallenge);
        fetchData();
    };

    const handleCloseTrade = async (trade) => {
        try {
            const currentPrice = trade.current_price;
            if (!currentPrice) {
                alert(t('common.error'));
                return;
            }
            await api.put(`/api/trading/close-trade/${trade.id}`, { exit_price: currentPrice });
            fetchData();
            refreshProfile();
        } catch (err) {
            console.error("[Dashboard] Error closing trade:", err);
            alert(t('common.error'));
        }
    };

    const handleMarketSwitch = (type) => {
        setSelectedMarketType(type);
        const filtered = markets.filter(m => {
            const isMaroc = m.exchange === 'Casablanca Stock Exchange' || m.symbol.endsWith('.CS');
            return type === 'MAROC' ? isMaroc : !isMaroc;
        });
        if (filtered.length > 0) setSelectedSymbol(filtered[0].symbol);
    };

    if (authLoading || loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center bg-background gap-4 ${isRtl ? 'rtl' : 'ltr'}`}>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">{t('trading.loading')}</p>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center ${isRtl ? 'rtl' : 'ltr'}`}>
                <div className="bg-background-card p-10 rounded-2xl border border-border max-w-md shadow-2xl">
                    <AlertCircle className="w-16 h-16 text-warning mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tight">{t('dashboard.no_active_challenge') || 'Aucun Challenge Actif'}</h1>
                    <p className="text-text-secondary mb-8 leading-relaxed text-sm">{t('dashboard.no_challenge_desc') || 'Prêt à prouver vos talents de trader ? Commencez par choisir un challenge professionnel.'}</p>
                    <button
                        onClick={() => navigate('/checkout')}
                        className="w-full py-4 bg-primary text-black font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-green"
                    >
                        {t('dashboard.start_experience') || 'COMMENCER L\'EXPÉRIENCE'}
                    </button>
                </div>
            </div>
        );
    }

    const filteredMarkets = markets.filter(m => {
        const isMaroc = m.exchange === 'Casablanca Stock Exchange' || m.symbol.endsWith('.CS');
        return selectedMarketType === 'MAROC' ? isMaroc : !isMaroc;
    });

    const totalUnrealizedPnL = trades.reduce((sum, trade) => sum + (trade.is_closed ? 0 : (trade.unrealized_pnl || 0)), 0);
    const equity = challenge.current_balance + totalUnrealizedPnL;
    const profit = equity - challenge.initial_balance;
    const profitPct = (profit / challenge.initial_balance) * 100;

    const displayedTrades = trades.filter(trade => {
        const matchesStatus = filterStatus === 'ALL' ? true : filterStatus === 'OPEN' ? !trade.is_closed : trade.is_closed;
        const matchesSearch = trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className={`min-h-screen bg-background flex flex-col lg:flex-row animate-fade-in overflow-hidden font-primary ${isRtl ? 'rtl' : 'ltr'}`}>
            <aside className={`bg-background-card border-b lg:border-b-0 ${isRtl ? 'lg:border-l' : 'lg:border-r'} border-border flex flex-col lg:h-screen sticky top-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'w-full lg:w-64' : 'w-full lg:w-20'}`}>
                {/* Header Section */}
                <div className={`flex items-center justify-between border-b border-border transition-all duration-300 ${isSidebarOpen ? 'p-6' : 'p-4 lg:justify-center'}`}>
                    <div onClick={() => setActiveView('TRADING')} className={`items-center gap-3 cursor-pointer group transition-all duration-300 ${isSidebarOpen ? 'flex' : 'hidden'}`}>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                            <LayoutDashboard className="text-black w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-text-primary tracking-tighter uppercase whitespace-nowrap">
                            TradeSense <span className="text-primary italic">AI</span>
                        </span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 hover:bg-background-input rounded-xl transition-all text-text-secondary hover:text-primary lg:flex hidden ${!isSidebarOpen && 'mx-auto'}`}>
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-text-secondary">
                        <Menu className="w-7 h-7" />
                    </button>
                </div>

                {/* Main Navigation Section - Scrollable and takes remaining space */}
                <nav className={`flex-1 flex flex-row lg:flex-col gap-1 p-3 lg:px-3 lg:py-4 overflow-x-auto lg:overflow-y-auto no-scrollbar ${!isSidebarOpen && 'lg:items-center'}`}>
                    {[
                        { id: 'TRADING', label: t('navbar.dashboard'), icon: Activity, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
                        { id: 'PRICING', label: t('navbar.pricing'), icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                        { id: 'LEADERBOARD', label: t('navbar.leaderboard'), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
                        { id: 'NEWS', label: t('trading.hub_news') || 'Actualités', icon: Newspaper, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
                        { id: 'COMMUNITY', label: t('trading.community') || 'Communauté', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { id: 'MASTERCLASS', label: t('trading.masterclass') || 'MasterClass', icon: GraduationCap, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
                            className={`flex items-center gap-3 lg:gap-4 px-4 py-2.5 rounded-xl transition-all font-black text-xs lg:text-sm shrink-0 group relative border border-transparent ${activeView === item.id
                                ? `${item.bg} ${item.color} ${item.border} shadow-sm`
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-input'
                                } ${!isSidebarOpen && 'lg:w-12 lg:h-12 lg:justify-center lg:px-0'}`}
                            title={!isSidebarOpen ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeView === item.id ? item.color : 'text-text-secondary group-hover:scale-110'}`} />
                            {isSidebarOpen && <span className="uppercase tracking-widest text-[11px] font-black whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Bottom Section - Pinned to bottom with mt-auto */}
                <div className={`mt-auto p-4 border-t border-border flex flex-col gap-1.5 transition-all duration-300 ${!isSidebarOpen && 'lg:items-center lg:px-0'}`}>
                    {/* User Info - Completely hidden when closed to save space */}
                    {isSidebarOpen && (
                        <div className="bg-background-input/50 rounded-xl p-3 flex items-center gap-3 border border-border animate-fade-in mb-1">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/20 text-[10px] shrink-0">
                                {user?.username?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-text-primary uppercase truncate">{user?.username}</p>
                                <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest truncate">{t('trading.trader_pro') || 'Trader Pro'}</p>
                            </div>
                        </div>
                    )}

                    {/* Logout Button - Matches Nav Buttons Style Exactly */}
                    <button
                        onClick={logout}
                        className={`flex items-center gap-3 lg:gap-4 px-4 py-2.5 rounded-xl transition-all font-black text-xs lg:text-sm text-danger hover:bg-danger/10 group relative border border-transparent ${!isSidebarOpen && 'lg:w-12 lg:h-12 lg:justify-center lg:px-0'}`}
                        title={!isSidebarOpen ? t('navbar.logout') : ''}
                    >
                        <FiLogOut className={`w-5 h-5 shrink-0 transition-all duration-300 text-danger group-hover:scale-110`} />
                        {isSidebarOpen && (
                            <span className="uppercase tracking-widest text-[11px] font-black whitespace-nowrap">
                                {t('navbar.logout')}
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            <div className="flex-1 overflow-y-auto max-h-screen custom-scrollbar bg-background">
                <main className="p-6 md:p-10">
                    <div className="max-w-[1700px] mx-auto">
                        {activeView === 'TRADING' && (
                            <div className="space-y-8">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-4">
                                            <h1 className="text-3xl font-black text-text-primary tracking-tighter uppercase">{t('trading.trading_desk')}</h1>
                                            <StatusBadge status={challenge.status} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                                            <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{t('trading.connected_feed')}</span>
                                        </div>
                                    </div>
                                    <div className="flex bg-background-card/80 p-1.5 rounded-2xl border border-border w-full lg:w-auto shadow-sm">
                                        <button onClick={() => handleMarketSwitch('INTERNATIONAL')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all ${selectedMarketType === 'INTERNATIONAL' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-secondary hover:text-text-primary'}`}>
                                            <Globe className="w-4 h-4" /> {t('trading.international')}
                                        </button>
                                        <button onClick={() => handleMarketSwitch('MAROC')} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all ${selectedMarketType === 'MAROC' ? 'bg-[#c1272d] text-white shadow-lg shadow-[#c1272d]/20' : 'text-text-secondary hover:text-text-primary'}`}>
                                            <Flag className="w-4 h-4" /> {t('trading.morocco')}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                    <StatsCard title={t('dashboard.equity')} value={`$${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext="Equity Live" icon={Wallet} />
                                    <StatsCard title={t('dashboard.profit')} value={`${profit >= 0 ? '+' : '-'}$${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtext={`${profitPct.toFixed(2)}%`} icon={Activity} colorClass={profit >= 0 ? "text-success" : "text-danger"} />
                                    <StatsCard title={t('dashboard.daily_loss')} value={`${Math.max(0, ((challenge.daily_start_balance - equity) / challenge.daily_start_balance) * 100).toFixed(2)}%`} subtext={`${t('dashboard.target')}: ${challenge.max_daily_loss_pct}%`} icon={ArrowDown} colorClass="text-danger" />
                                    <StatsCard title={t('dashboard.target')} value={`${Math.min(100, Math.max(0, (profitPct / 10) * 100)).toFixed(0)}%`} subtext={`${t('dashboard.target')}: $${(challenge.initial_balance * 1.1).toLocaleString()}`} icon={Target} colorClass="text-warning" />
                                </div>

                                <div className="rounded-2xl border border-border overflow-hidden shadow-2xl">
                                    <LiveTicker />
                                </div>

                                <div className="space-y-10">
                                    {/* Row 1: Graphique | Instrument */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                                        <div className="lg:col-span-9">
                                            <div className="bg-background-card rounded-2xl border border-border p-1 overflow-hidden shadow-2xl h-full">
                                                <div className="p-5 border-b border-border flex justify-between items-center bg-background-input/30">
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-black text-text-primary text-xl tracking-tight">{selectedSymbol}</span>
                                                        {selectedMarketType === 'MAROC' && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded border border-red-500/20 uppercase">BVC</span>}
                                                    </div>
                                                    <button onClick={handleSync} className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[11px] font-black transition-all uppercase border border-primary/20">
                                                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                                        {t('dashboard.sync')}
                                                    </button>
                                                </div>
                                                <div className="h-[550px]">
                                                    {selectedSymbol && <PriceChart symbol={selectedSymbol} />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-3">
                                            <OrderPanel symbol={selectedSymbol} setSymbol={setSelectedSymbol} challenge={challenge} onOrderExecuted={handleOrderExecuted} availableSymbols={filteredMarkets} />
                                        </div>
                                    </div>

                                    {/* Row 2: Grand Livre | Signaux IA */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                                        <div className="lg:col-span-9" id="grand-livre">
                                            <div className="bg-background-card rounded-2xl border border-border overflow-hidden shadow-xl">
                                                <div className="p-6 border-b border-border bg-background-input/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                                <Clock className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <span className="font-black text-[11px] uppercase tracking-[0.2em] text-text-secondary">{t('trading.ledger')}</span>
                                                        </div>
                                                        <div className="flex bg-background-input p-1.5 rounded-xl border border-border shadow-sm">
                                                            <button onClick={() => setViewMode('CHALLENGE')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'CHALLENGE' ? 'bg-primary text-black shadow-md' : 'text-text-secondary hover:text-text-primary'}`}>{t('trading.challenge')}</button>
                                                            <button onClick={() => setViewMode('HISTORY')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'HISTORY' ? 'bg-primary text-black shadow-md' : 'text-text-secondary hover:text-text-primary'}`}>{t('trading.history')}</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                                        <input type="text" placeholder={t('trading.filter_symbol')} value={searchSymbol} onChange={(e) => setSearchSymbol(e.target.value)} className="bg-background-input border border-border rounded-xl px-4 py-2 text-[11px] text-text-primary outline-none focus:ring-1 focus:ring-primary w-full md:w-40" />
                                                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-background-input border border-border rounded-xl px-3 py-2 text-[11px] text-text-primary outline-none focus:ring-1 focus:ring-primary">
                                                            <option value="ALL">{t('trading.all')}</option>
                                                            <option value="OPEN">{t('trading.open')}</option>
                                                            <option value="CLOSED">{t('trading.closed')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                                                    <table className="w-full text-left rtl:text-right">
                                                        <thead className="bg-background-input/50 text-text-secondary text-[10px] uppercase font-black tracking-[0.2em] sticky top-0 z-10">
                                                            <tr>
                                                                <th className="p-6">{t('trading.instrument')}</th>
                                                                <th className="p-6 text-center">{t('trading.type')}</th>
                                                                <th className="p-6">{t('trading.entry')}</th>
                                                                <th className="p-6">{t('trading.volume')}</th>
                                                                <th className="p-6 text-right rtl:text-left">{t('trading.pnl')} ($)</th>
                                                                <th className="p-6 text-center">% PnL</th>
                                                                <th className="p-6 text-right rtl:text-left">{t('dashboard.target')}</th>
                                                                {viewMode === 'CHALLENGE' && <th className="p-6 text-center">{t('admin.actions')}</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm text-text-secondary divide-y divide-border/50">
                                                            {displayedTrades.length === 0 ? (
                                                                <tr><td colSpan="8" className="p-16 text-center text-text-secondary font-bold italic opacity-60">{t('trading.no_positions')}</td></tr>
                                                            ) : (
                                                                displayedTrades.map(trade => (
                                                                    <tr key={trade.id} className="hover:bg-primary/5 transition-all group">
                                                                        <td className="p-6">
                                                                            <div className="font-black text-text-primary group-hover:text-primary transition-colors text-base">{trade.symbol}</div>
                                                                            <div className="text-[10px] text-text-secondary font-mono mt-1">{new Date(trade.timestamp).toLocaleString()}</div>
                                                                        </td>
                                                                        <td className="p-6 text-center">
                                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all duration-300 ${trade.trade_type === 'BUY'
                                                                                ? 'bg-success/20 text-success shadow-[0_0_12px_rgba(14,203,129,0.15)]'
                                                                                : 'bg-danger/20 text-danger shadow-[0_0_12px_rgba(246,70,93,0.15)]'}`}>
                                                                                <Activity className="w-3 h-3" />
                                                                                {trade.trade_type === 'BUY' ? t('trading.buy') : t('trading.sell')}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-6 font-mono text-text-secondary text-sm">${trade.entry_price?.toFixed(2)}</td>
                                                                        <td className="p-6">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-black text-text-primary">{trade.quantity}</span>
                                                                                <span className="text-[9px] text-text-secondary uppercase font-black tracking-tighter opacity-70">{trade.symbol.includes('.CS') ? 'Actions' : 'Lots'}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className={`p-6 text-right rtl:text-left font-black font-mono text-xs md:text-sm`}>
                                                                            <div className="flex flex-col items-end rtl:items-start">
                                                                                {(() => {
                                                                                    const currentPrice = trade.current_price || trade.entry_price;
                                                                                    const isBuy = trade.trade_type === 'BUY';
                                                                                    const pnlValue = trade.is_closed ? trade.profit_loss : (isBuy ? (currentPrice - trade.entry_price) * trade.quantity : (trade.entry_price - currentPrice) * trade.quantity);
                                                                                    const isPositive = pnlValue >= 0;
                                                                                    return (
                                                                                        <span className={isPositive ? 'text-success' : 'text-danger'}>
                                                                                            {isPositive ? '+' : '-'}${Math.abs(pnlValue).toFixed(2)}
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                                {!trade.is_closed && <span className="text-[9px] text-primary animate-pulse uppercase font-black tracking-widest">{t('trading.live_feed')}</span>}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-6 text-center font-mono">
                                                                            {(() => {
                                                                                const currentPrice = trade.current_price || trade.entry_price;
                                                                                const pnlPct = ((trade.trade_type === 'BUY' ? (currentPrice - trade.entry_price) : (trade.entry_price - currentPrice)) / trade.entry_price) * 100;
                                                                                const isPositive = pnlPct >= 0;
                                                                                return (
                                                                                    <span className={`text-[11px] font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                                                                                        {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                                                                                    </span>
                                                                                );
                                                                            })()}
                                                                        </td>
                                                                        <td className="p-6 text-right rtl:text-left font-mono">
                                                                            {(() => {
                                                                                const targetPrice = trade.trade_type === 'BUY' ? trade.entry_price * 1.10 : trade.entry_price * 0.90;
                                                                                return (
                                                                                    <div className="flex flex-col items-end rtl:items-start">
                                                                                        <span className="text-text-primary text-xs font-bold">${targetPrice.toFixed(2)}</span>
                                                                                        <span className="text-[8px] text-text-secondary uppercase font-black tracking-widest opacity-60">Target +10%</span>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </td>
                                                                        {viewMode === 'CHALLENGE' && (
                                                                            <td className="p-6 text-center">
                                                                                {!trade.is_closed ? (
                                                                                    <button
                                                                                        onClick={() => handleCloseTrade(trade)}
                                                                                        className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 rounded-lg text-[10px] font-black transition-all uppercase shadow-md hover:shadow-danger/20 group/btn"
                                                                                    >
                                                                                        <X className="w-3.5 h-3.5 transition-transform group-hover/btn:rotate-180" />
                                                                                        {t('trading.close')}
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className="text-[10px] text-text-secondary font-black uppercase italic opacity-50">{t('trading.closed')}</span>
                                                                                )}
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-3">
                                            <div className="flex flex-col h-full gap-4">
                                                <SignalsPanel />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeView === 'PRICING' && <Pricing />}
                        {activeView === 'LEADERBOARD' && <Leaderboard />}
                        {activeView === 'NEWS' && <NewsHub />}
                        {activeView === 'COMMUNITY' && <CommunityZone />}
                        {activeView === 'MASTERCLASS' && <MasterClass />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
