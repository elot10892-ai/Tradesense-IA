import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Package, TrendingUp, TrendingDown, Info, ShieldCheck, AlertCircle } from 'lucide-react';
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
        // canTrade est vrai si Maroc ou si prix dispos
        if (!challenge || !symbol || !canTrade) return;

        setIsProcessing(true);
        setError(null);

        try {
            const payload = {
                challenge_id: challenge.id,
                symbol: symbol,
                type: type,
                quantity: Math.max(1, parseInt(quantity) || 1),
                // On passe le prix actuel s'il existe, sinon le backend prendra la main
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
        <div className="bg-background-card border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase text-text-secondary tracking-[0.2em]">{t('trading.instrument')}</h3>
                </div>
                {isMorocco && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/20 rounded-lg text-[9px] text-success font-black tracking-widest uppercase">
                        <ShieldCheck className="w-3 h-3" /> MAROC ACTIF
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* Symbol Selection */}
                <div>
                    <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">{t('trading.instrument')}</label>
                    <select
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="w-full bg-background-input border border-border rounded-xl p-4 text-text-primary font-bold outline-none focus:border-primary transition-all cursor-pointer appearance-none shadow-inner"
                    >
                        {availableSymbols.map(s => (
                            <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Price Display */}
                <div className="bg-background-input/50 border border-border p-5 rounded-xl flex flex-col gap-1 group hover:border-primary/20 transition-all">
                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{t('trading.current')}</span>
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-mono font-black ${displayPrice ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {priceFormatted}
                        </span>
                        {displayPrice && isMorocco && <span className="text-[10px] text-text-secondary font-bold">MAD</span>}
                    </div>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">{t('trading.volume')}</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-background-input border border-border rounded-xl p-4 text-text-primary font-mono font-bold outline-none focus:border-primary transition-all text-center text-xl shadow-inner"
                    />
                </div>


                {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[10px] font-bold animate-shake">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Alerte Challenge désactivée (Logique Killer) */}
                {challenge && challenge.status !== 'active' && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${challenge.status === 'failed'
                            ? 'bg-danger/10 border-danger/30 text-danger'
                            : 'bg-success/10 border-success/30 text-success'
                        }`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {challenge.status === 'failed' ? 'Challenge Échoué' : 'Challenge Réussi'}
                            </span>
                            <span className="text-[11px] font-medium leading-relaxed">
                                {challenge.status === 'failed'
                                    ? 'Limite de perte atteinte. Challenge échoué.'
                                    : 'Objectif de profit atteint. Challenge validé.'
                                }
                            </span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                        onClick={() => handleExecute('SELL')}
                        disabled={isProcessing || !canTrade}
                        className="group flex flex-col items-center justify-center p-5 bg-background-input border border-danger/30 text-danger rounded-2xl font-black transition-all hover:bg-danger hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <TrendingDown className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('trading.sell')}</span>
                    </button>
                    <button
                        onClick={() => handleExecute('BUY')}
                        disabled={isProcessing || !canTrade}
                        className="group flex flex-col items-center justify-center p-5 bg-background-input border border-success/30 text-success rounded-2xl font-black transition-all hover:bg-success hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase tracking-widest font-black">{t('trading.buy')}</span>
                    </button>
                </div>
            </div>


            {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-30 space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em]">Exécution...</span>
                </div>
            )}
        </div>
    );
};

export default OrderPanel;
