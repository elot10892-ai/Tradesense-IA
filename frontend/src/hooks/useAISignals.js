import { useState, useEffect } from 'react';
import api from '../api/axios';

const SYMBOLS = ['XAUUSD', 'EURUSD', 'BTCUSD'];

export const useAISignals = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndCalculate = async () => {
            try {
                // On récupère les prix en temps réel pour nos 3 instruments
                // Le backend gère le mapping (ex: XAUUSD -> GC=F)
                const response = await api.get('/api/trading/prices/live', {
                    params: { symbols: SYMBOLS.join(',') }
                });

                const prices = response.data.prices || {};

                // On transforme les prix bruts en signaux enrichis
                const newSignals = SYMBOLS.map(symbol => {
                    const data = prices[symbol];
                    if (!data) return null;

                    const price = data.price;
                    const change = data.change_percent || data.change_24h || 0; // Supporte les deux formats

                    // Logique de Signal IA (Basée sur Momentum & Tendance)
                    let signalType = 'NEUTRAL';
                    let confidence = 50; // Base neutre
                    let justification = 'Marché en consolidation, attente de direction.';

                    // Seuils de volatilité ajustés par instrument
                    const volatilityThreshold = symbol === 'BTCUSD' ? 1.5 : 0.3;

                    if (change > volatilityThreshold) {
                        signalType = 'BUY';
                        // Plus la hausse est forte, plus la confiance est élevée (max 98%)
                        confidence = Math.min(98, 65 + (Math.abs(change) / volatilityThreshold) * 15);
                        justification = `Forte dynamique haussière (+${change.toFixed(2)}%). Momentum acheteur confirmé.`;
                    } else if (change < -volatilityThreshold) {
                        signalType = 'SELL';
                        confidence = Math.min(98, 65 + (Math.abs(change) / volatilityThreshold) * 15);
                        justification = `Pression vendeuse intense (${change.toFixed(2)}%). Cassure de support probable.`;
                    } else if (change > 0) {
                        // Hausse légère
                        signalType = 'BUY'; // Weak Buy
                        confidence = 55 + (change * 10);
                        justification = 'Tendance légèrement positive. Potentiel de hausse modéré.';
                    } else if (change < 0) {
                        // Baisse légère
                        signalType = 'SELL'; // Weak Sell
                        confidence = 55 + (Math.abs(change) * 10);
                        justification = 'Tendance légèrement négative. Prise de bénéfices en cours.';
                    }

                    return {
                        symbol,
                        signal: signalType,
                        price: price,
                        confidence: Math.round(confidence),
                        change: change,
                        timestamp: data.timestamp || new Date().toISOString(),
                        justification
                    };
                }).filter(Boolean); // Retire les null si un symbole a échoué

                setSignals(newSignals);
            } catch (err) {
                console.error("[useAISignals] Erreur:", err);
            } finally {
                setLoading(false);
            }
        };

        // Premier appel immédiat
        fetchAndCalculate();

        // Rafraîchissement toutes les 5 secondes (Temps réel)
        const interval = setInterval(fetchAndCalculate, 5000);
        return () => clearInterval(interval);
    }, []);

    return { signals, loading };
};
