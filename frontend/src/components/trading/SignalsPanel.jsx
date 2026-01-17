import { useTranslation } from 'react-i18next';
import { Zap, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../api/axios';

const SignalsPanel = () => {
    const { t } = useTranslation();
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSignals = async () => {
        try {
            const response = await api.get('/api/ai/signals');
            // Show top 5 signals
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
        if (diff < 1) return t('signals.just_now') || 'just now';
        return `${diff}m ago`;
    };

    return (
        <div className="bg-background-card border border-border rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-background-input/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-black text-sm text-text-primary uppercase tracking-tighter">Signaux IA</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 border border-success/20 rounded-full text-[9px] text-success font-black uppercase tracking-widest animate-pulse">
                    LIVE
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                {loading && signals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 grayscale opacity-50">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-[9px] text-text-secondary uppercase font-black tracking-widest tracking-[0.2em]">{t('signals.analyzing')}</span>
                    </div>
                ) : signals.length > 0 ? (
                    signals.map((signal, index) => (
                        <div key={index} className="p-3 bg-background-input/40 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all group flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-text-primary text-base tracking-tighter group-hover:text-primary transition-colors">{signal.symbol}</span>
                                    <span className="text-[10px] text-text-secondary font-mono opacity-60">• {formatTimeAgo(signal.timestamp)}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${signal.signal === 'BUY' ? 'bg-success/20 text-success' :
                                    signal.signal === 'SELL' ? 'bg-danger/20 text-danger' :
                                        'bg-background-input text-text-secondary'
                                    }`}>
                                    {signal.signal === 'BUY' ? t('signals.buy') :
                                        signal.signal === 'SELL' ? t('signals.sell') :
                                            t('signals.hold') || 'HOLD'}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <div className="font-mono text-xs font-bold text-text-secondary">
                                    @ {signal.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-text-secondary font-black uppercase tracking-widest opacity-60">Confiance</span>
                                    <span className="text-xs font-black text-accent">Conf: {signal.confidence}%</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-[10px] text-text-secondary italic font-black uppercase tracking-widest opacity-40">
                        Aucun signal actif
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalsPanel;
