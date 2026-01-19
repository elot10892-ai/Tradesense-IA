import { useTranslation } from 'react-i18next';
import { Zap, Loader2, ArrowUpRight, ArrowDownRight, Minus, Clock } from 'lucide-react';
import { useAISignals } from '../../hooks/useAISignals';
const SignalsPanel = () => {
    const { t } = useTranslation();
    const { signals, loading } = useAISignals();

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        // Si la date est invalide
        if (isNaN(date.getTime())) return t('signals.just_now') || 'À l\'instant';

        const diff = Math.floor((new Date() - date) / 1000 / 60);
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
                        <span className="text-[9px] text-text-secondary uppercase font-black tracking-[0.3em] animate-pulse">{t('signals.analyzing') || 'ANALYSE EN COURS...'}</span>
                    </div>
                ) : signals.length > 0 ? (
                    signals.map((signal, index) => {
                        const isBuy = signal.signal === 'BUY';
                        const isSell = signal.signal === 'SELL';
                        const isStrong = signal.confidence > 80;

                        // Styles dynamiques
                        const containerClass = isBuy
                            ? `bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40 ${isStrong ? 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''}`
                            : isSell
                                ? `bg-gradient-to-r from-rose-500/10 to-transparent border-rose-500/20 hover:border-rose-500/40 ${isStrong ? 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' : ''}`
                                : 'bg-background-input/30 border-slate-700/50 hover:border-slate-600';

                        const textClass = isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-slate-400';
                        const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Minus;
                        const barColor = isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-slate-500';

                        return (
                            <div key={`${signal.symbol}-${index}`} className={`relative p-3.5 rounded-xl border transition-all duration-300 group hover:scale-[1.02] shrink-0 ${containerClass}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-100 text-sm tracking-tight">{signal.symbol}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-current ${textClass} bg-background/20 backdrop-blur-sm`}>
                                                {isBuy ? 'ACHAT' : isSell ? 'VENTE' : 'HOLD'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                            <Clock className="w-3 h-3" />
                                            <span>il y a {formatTimeAgo(signal.timestamp)}</span>
                                        </div>
                                    </div>

                                    <div className={`p-1.5 rounded-lg border bg-background/40 backdrop-blur-md ${isBuy ? 'border-emerald-500/20 text-emerald-400' : isSell ? 'border-rose-500/20 text-rose-400' : 'border-slate-600/30 text-slate-400'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Justification IA - Style Citation Premium */}
                                <div className={`mb-3 pl-3 pr-2 py-2 rounded-r-lg border-l-2 bg-background/30 ${isBuy ? 'border-emerald-500/50' : isSell ? 'border-rose-500/50' : 'border-slate-500/50'}`}>
                                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                        {signal.justification}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between pt-2 border-t border-slate-700/30">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Prix</span>
                                        <span className="font-mono text-xs font-bold text-slate-200">
                                            ${signal.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end w-1/2">
                                        <div className="flex justify-between w-full mb-1">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Confiance</span>
                                            <span className={`text-[10px] font-black ${textClass}`}>{signal.confidence}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${isStrong ? 'animate-pulse' : ''}`}
                                                style={{ width: `${signal.confidence}%` }}
                                            />
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
