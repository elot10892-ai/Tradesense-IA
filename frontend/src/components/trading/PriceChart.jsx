import { useRef, useEffect, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { Activity, Loader2, RefreshCw, BarChart3, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';

const PriceChart = ({ symbol = 'XAUUSD' }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Détection stricte des symboles marocains
    const isMoroccan = symbol?.toUpperCase().endsWith('.CS');

    useEffect(() => {
        let isMounted = true;
        let chart = null;

        const init = async () => {
            // Toujours réinitialiser l'état lors d'un changement de symbole
            setError(null);

            if (!chartContainerRef.current) return;

            // On autorise maintenant le chargement pour tous les symboles
            if (isMoroccan) {
                console.log(`[PriceChart] Fetching Moroccan chart for ${symbol}...`);
            }

            setLoading(true);

            try {
                // 1. Fetch History (uniquement International)
                console.log(`[PriceChart] Fetching history for ${symbol}...`);
                const response = await api.get(`/api/trading/prices/history?symbol=${symbol}&period=1mo`);
                const historyData = response.data?.data || [];

                if (!isMounted) return;

                // 2. Validate Container
                const container = chartContainerRef.current;
                if (container.clientWidth === 0) {
                    await new Promise(r => setTimeout(r, 100));
                }

                // 3. Create Chart
                const isLight = document.documentElement.classList.contains('light');
                chart = LightweightCharts.createChart(container, {
                    layout: {
                        background: { type: LightweightCharts.ColorType.Solid, color: isLight ? '#ffffff' : '#111827' },
                        textColor: isLight ? '#374151' : '#9ca3af',
                    },
                    grid: {
                        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(31, 41, 55, 0.4)' },
                        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(31, 41, 55, 0.4)' },
                    },
                    width: container.clientWidth || 800,
                    height: 480,
                    timeScale: {
                        borderColor: isLight ? '#e5e7eb' : '#374151',
                        timeVisible: true,
                    },
                });

                // 4. Add Series - Robust method for v4/v5
                let series;
                try {
                    if (chart.addCandlestickSeries) {
                        series = chart.addCandlestickSeries({
                            upColor: '#10b981',
                            downColor: '#ef4444',
                            borderVisible: false,
                            wickUpColor: '#10b981',
                            wickDownColor: '#ef4444',
                        });
                    } else {
                        // modern API for v5
                        series = chart.addSeries(LightweightCharts.CandlestickSeries, {
                            upColor: '#10b981',
                            downColor: '#ef4444',
                            borderVisible: false,
                            wickUpColor: '#10b981',
                            wickDownColor: '#ef4444',
                        });
                    }
                } catch (sErr) {
                    console.error("[PriceChart] Series Creation Error:", sErr);
                    throw new Error("Échec de création de la série financière.");
                }

                // 5. Format Data
                const formatted = historyData.map(d => ({
                    time: Math.floor(new Date(d.date).getTime() / 1000),
                    open: parseFloat(d.open),
                    high: parseFloat(d.high),
                    low: parseFloat(d.low),
                    close: parseFloat(d.close),
                })).filter(d => !isNaN(d.time))
                    .sort((a, b) => a.time - b.time);

                // Dedup
                const unique = [];
                const seen = new Set();
                for (const d of formatted) {
                    if (!seen.has(d.time)) {
                        unique.push(d);
                        seen.add(d.time);
                    }
                }

                series.setData(unique);

                chartRef.current = chart;
                seriesRef.current = series;
                setLoading(false);

                const handleResize = () => {
                    if (chartRef.current && chartContainerRef.current) {
                        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
                    }
                };
                window.addEventListener('resize', handleResize);

                return () => {
                    window.removeEventListener('resize', handleResize);
                    if (chart) chart.remove();
                };
            } catch (err) {
                console.error("[PriceChart] Init Failed:", err);
                if (isMounted) {
                    setError(`Erreur d'affichage: ${err.message}`);
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [symbol, isMoroccan]);


    if (error) {
        return (
            <div className="w-full h-[520px] flex flex-col items-center justify-center bg-background-input border border-border rounded-2xl p-6">
                <Activity className="w-12 h-12 text-danger mb-4 opacity-40" />
                <h3 className="text-text-primary font-bold mb-2 uppercase tracking-widest text-xs">Erreur de Flux</h3>
                <p className="text-text-secondary text-[10px] mb-6 max-w-xs text-center font-mono">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-primary text-black font-black rounded-xl text-[10px] tracking-widest uppercase hover:opacity-90 transition-colors"
                >
                    Réinitialiser le Terminal
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[520px] bg-background-input rounded-2xl border border-border overflow-hidden shadow-2xl">
            {loading && (
                <div className="absolute inset-0 bg-background-card/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 font-black">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <span className="text-[10px] text-primary tracking-[0.3em] uppercase">Syncing {symbol}</span>
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute top-6 right-8 pointer-events-none opacity-10">
                <span className="text-8xl font-black text-text-primary tracking-tighter uppercase">{symbol}</span>
            </div>
        </div>
    );
};

export default PriceChart;
