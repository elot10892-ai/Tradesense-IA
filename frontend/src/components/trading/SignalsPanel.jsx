import { useTranslation } from 'react-i18next';
import { Zap, Loader2, ArrowUpRight, ArrowDownRight, Minus, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const SignalsPanel = () => {
    const { t } = useTranslation();
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSignals = async () => {
        try {
            const response = await api.get('/api/ai/signals');
            setSignals(response.data.signals);
        } catch (err) {
            console.error('[SignalsPanel] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSignals();
        const interval = setInterval(fetchSignals, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTimeAgo = (timestamp) => {
        const diff = Math.floor((new Date() - new Date(timestamp)) / 1000 / 60);
        if (diff < 1) return t('signals.just_now') || 'À l\'instant';
        return `${diff}m`;
    };

    return (
        <div className="bg-background-card border border-border rounded-2xl flex flex-col w-full h-fit max-h-[600px] shadow-2xl overflow-hidden transition-all duration-300 transform group hover:border-primary/20">
            {/* Header */}
            <div className="p-4 border-b border-border bg-background-input/30 flex items-center justify-between shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shadow-inner">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-black text-sm text-text-primary uppercase tracking-tighter leading-none">Signaux IA</h3>
                        <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">Temps Réel</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 border border-success/20 rounded-full text-[9px] text-success font-black uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    LIVE
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {loading && signals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 grayscale opacity-50">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-[9px] text-text-secondary uppercase font-black tracking-[0.3em] animate-pulse">{t('signals.analyzing')}</span>
                    </div>
                ) : signals.length > 0 ? (
                    signals.map((signal, index) => {
                        const isBuy = signal.signal === 'BUY';
                        const isSell = signal.signal === 'SELL';

                        // Styles dynamiques
                        const containerClass = isBuy
                            ? 'bg-gradient-to-r from-success/5 to-transparent border-success/20 hover:border-success/40'
                            : isSell
                                ? 'bg-gradient-to-r from-danger/5 to-transparent border-danger/20 hover:border-danger/40'
                                : 'bg-background-input/50 border-border hover:border-text-secondary/30';

                        const textClass = isBuy ? 'text-success' : isSell ? 'text-danger' : 'text-text-secondary';
                        const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Minus;

                        return (
                            <div key={index} className={`relative p-3 rounded-xl border transition-all duration-300 group hover:shadow-lg hover:scale-[1.01] shrink-0 ${containerClass}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-text-primary text-sm tracking-tight">{signal.symbol}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-current ${textClass} bg-background/50`}>
                                                {isBuy ? 'ACHAT' : isSell ? 'VENTE' : 'NEUTRE'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-text-secondary opacity-70">
                                            <Clock className="w-3 h-3" />
                                            <span>il y a {formatTimeAgo(signal.timestamp)}</span>
                                        </div>
                                    </div>

                                    <div className={`p-1.5 rounded-lg border bg-background/50 ${isBuy ? 'border-success/20 text-success' : isSell ? 'border-danger/20 text-danger' : 'border-border text-text-secondary'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-border/10 pt-2 mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">Prix</span>
                                        <span className="font-mono text-xs font-bold text-text-primary">
                                            {signal.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">Confiance</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-12 h-1 bg-background-input rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${isBuy ? 'bg-success' : isSell ? 'bg-danger' : 'bg-text-secondary'}`}
                                                    style={{ width: `${signal.confidence}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-black ${textClass}`}>{signal.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                        <div className="p-3 bg-background-input rounded-full">
                            <Zap className="w-6 h-6 text-text-secondary" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Aucun signal actif</p>
                            <p className="text-[9px] text-text-secondary mt-1">L'IA analyse le marché...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalsPanel;
