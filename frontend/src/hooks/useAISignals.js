import { useState, useEffect } from 'react';
import api from '../api/axios';

const SYMBOLS = ['IAM.CS', 'BTCUSD'];

export const useAISignals = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAISignals = async () => {
            try {
                // Now fetching strictly from the AI backend as requested
                const response = await api.get('/api/ai/signals');

                if (response.data && response.data.signals) {
                    setSignals(response.data.signals);
                }
            } catch (err) {
                console.error("[useAISignals] Error fetching from backend:", err);
            } finally {
                setLoading(false);
            }
        };

        // Immediate first fetch
        fetchAISignals();

        // Refresh every 5 seconds (Real-time)
        const interval = setInterval(fetchAISignals, 5000);
        return () => clearInterval(interval);
    }, []);

    return { signals, loading };
};
