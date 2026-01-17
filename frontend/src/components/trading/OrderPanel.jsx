import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Package, TrendingUp, TrendingDown, Info, ShieldCheck, AlertCircle, BarChart2 } from 'lucide-react';
import api from '../../api/axios';

const OrderPanel = ({ symbol, setSymbol, challenge, onOrderExecuted, availableSymbols = [] }) => {
    const { t } = useTranslation();
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [priceData, setPriceData] = useState(null);

    // Détection du Marché Marocain (.CS)
    const isMorocco = symbol?.toUpperCase().endsWith('.CS');

    // Le prix à afficher
    const displayPrice = priceData?.price;

    // RÈGLE : Pour le Maroc, on peut TOUJOURS cliquer sur acheter/vendre (mode démo).
    // Pour l'international, on attend le prix live.
    // DÉFI : Logique Killer - Trading autorisé uniquement si ACTIVE
    const isChallengeActive = challenge?.status === 'active';
    const canTrade = (isMorocco || !!displayPrice) && isChallengeActive;

    const priceFormatted = displayPrice
        ? displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isMorocco ? 2 : 5 })
        : (isMorocco ? "—" : "Prix non disponible");

    useEffect(() => {
        let isMounted = true;

        const fetchPrice = async () => {
            if (!symbol) return;
            try {
                // On tente de récupérer le prix.
                const response = await api.get(`/api/trading/price/${symbol}`);
                if (isMounted && response.data) {
                    setPriceData(response.data);
                    setError(null);
                } else if (isMounted) {
                    setPriceData(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(`[OrderPanel] Error for ${symbol}:`, err);
                    setPriceData(null);
                }
            }
        };

        fetchPrice();
        // Polling uniquement pour l'International pour économiser le réseau
        const interval = setInterval(fetchPrice, isMorocco ? 20000 : 10000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [symbol, isMorocco]);

    const handleExecute = async (type) => {
        if (!challenge || !symbol || !canTrade) return;

        setIsProcessing(true);
        setError(null);

        try {
            const payload = {
                challenge_id: challenge.id,
                symbol: symbol,
                type: type,
                quantity: Math.max(1, parseInt(quantity) || 1),
                price_executed: displayPrice || null
            };

            const response = await api.post('/api/trading/execute', payload);
            if (onOrderExecuted) {
                onOrderExecuted(response.data.trade, response.data.challenge);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Erreur critique du terminal");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-background-card border border-border rounded-2xl flex flex-col w-full h-fit shadow-2xl overflow-hidden transition-all duration-300 relative hover:border-primary/20">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-background-input/30 flex items-center justify-between shrink-0 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 shadow-inner">
                        <Package className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-black text-sm text-text-primary uppercase tracking-tighter leading-none">{t('trading.instrument')}</h3>
                </div>
                {isMorocco && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 border border-success/20 rounded-full text-[9px] text-success font-black uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <ShieldCheck className="w-3 h-3" /> MAROC
                    </div>
                )}
            </div>

            <div className="p-5 space-y-5">

                {/* Symbol Selection */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">{t('trading.instrument')}</label>
                    <div className="relative group">
                        <select
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className="w-full bg-black/20 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:bg-black/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer appearance-none shadow-sm hover:bg-black/30 hover:border-primary/30"
                        >
                            {availableSymbols.map(s => (
                                <option key={s.symbol} value={s.symbol} className="bg-background-card text-text-primary">
                                    {s.symbol} — {s.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary opacity-50 group-hover:text-primary transition-colors">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Price Display */}
                <div className="bg-gradient-to-br from-background-input to-background-input/40 border border-border p-4 rounded-xl flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="flex flex-col gap-0.5 relative z-10">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{t('trading.current')}</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-mono font-black tracking-tight ${displayPrice ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {priceFormatted}
                            </span>
                        </div>
                    </div>
                    {displayPrice && isMorocco && (
                        <div className="relative z-10 px-2 py-1 bg-background/60 rounded-lg border border-border text-[10px] font-bold text-text-secondary shadow-sm">
                            MAD
                        </div>
                    )}
                    {/* Background Deco */}
                    <BarChart2 className="absolute right-2 -bottom-2 w-16 h-16 text-text-secondary/5 rotate-12 pointer-events-none" />
                </div>

                {/* Volume Input */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">{t('trading.volume')}</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-black/20 border border-border rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-text-primary outline-none focus:bg-black/30 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm hover:bg-black/30 hover:border-primary/30"
                    />
                </div>

                {/* Messages d'erreur & Status Challenge */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold animate-shake">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {challenge && challenge.status !== 'active' && (
                    <div className={`p-3 rounded-xl border flex items-center gap-3 animate-fade-in ${challenge.status === 'failed'
                        ? 'bg-danger/10 border-danger/30 text-danger'
                        : 'bg-success/10 border-success/30 text-success'
                        }`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {challenge.status === 'failed' ? 'Challenge Échoué' : 'Challenge Réussi'}
                        </span>
                    </div>
                )}

                {/* Boutons d'Action Modernes - Dark Style */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                        onClick={() => handleExecute('SELL')}
                        disabled={isProcessing || !canTrade}
                        className="group relative overflow-hidden rounded-xl bg-background-input/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/10 active:scale-[0.98] h-[60px] border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative h-full flex flex-col items-center justify-center gap-0.5 z-10">
                            <TrendingDown className="w-5 h-5 text-red-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-400 transition-colors">{t('trading.sell')}</span>
                        </div>
                    </button>

                    <button
                        onClick={() => handleExecute('BUY')}
                        disabled={isProcessing || !canTrade}
                        className="group relative overflow-hidden rounded-xl bg-background-input/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/10 active:scale-[0.98] h-[60px] border border-green-500/20 hover:border-green-500/50 hover:bg-green-500/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative h-full flex flex-col items-center justify-center gap-0.5 z-10">
                            <TrendingUp className="w-5 h-5 text-green-500 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500 group-hover:text-green-400 transition-colors">{t('trading.buy')}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 space-y-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Exécution...</span>
                </div>
            )}
        </div>
    );
};

export default OrderPanel;
