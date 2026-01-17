import { useRef, useEffect, useState, useMemo } from 'react';
import { createChart, ColorType, CandlestickSeries, AreaSeries, LineSeries, CrosshairMode } from 'lightweight-charts';
import { Activity, Loader2, RefreshCw, BarChart3, TrendingUp, Layers } from 'lucide-react';
import api from '../../api/axios';

// --- Utilitaires de Calcul d'Indicateurs ---
const calculateSMA = (data, count) => {
    const avg = (data) => data.reduce((a, b) => a + b, 0) / data.length;
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < count - 1) continue;
        const val = avg(data.slice(i - count + 1, i + 1).map(d => d.close));
        result.push({ time: data[i].time, value: val });
    }
    return result;
};

const calculateEMA = (data, count) => {
    const k = 2 / (count + 1);
    const result = [];
    let ema = data[0].close;
    for (let i = 0; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
        if (i >= count - 1) {
            result.push({ time: data[i].time, value: ema });
        }
    }
    return result;
};

const PriceChart = ({ symbol = 'XAUUSD' }) => {
    // Refs pour le moteur du graphique
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const mainSeriesRef = useRef(null);
    const smaSeriesRef = useRef(null);
    const emaSeriesRef = useRef(null);
    const tooltipRef = useRef(null);

    // États
    const [timeframe, setTimeframe] = useState('1mo'); // 1d, 1wk, 1mo, 3mo, 1y
    const [chartType, setChartType] = useState('candlestick');
    const [showIndicators, setShowIndicators] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false); // Pour l'animation Fade-In

    // Données brutes et calculées
    const [marketData, setMarketData] = useState([]);
    const [indicators, setIndicators] = useState({ sma: [], ema: [] });

    // Configuration Thème
    const isLight = document.documentElement.classList.contains('light');
    const colors = useMemo(() => ({
        bg: isLight ? '#ffffff' : '#111827',
        text: isLight ? '#374151' : '#9ca3af',
        grid: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(31, 41, 55, 0.4)',
        up: '#10b981', down: '#ef4444',
        areaLine: '#3b82f6', areaTop: 'rgba(59, 130, 246, 0.4)', areaBottom: 'rgba(59, 130, 246, 0.0)',
        sma: '#f59e0b', ema: '#06b6d4',
        tooltipBg: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 24, 39, 0.9)',
        tooltipBorder: isLight ? '#e5e7eb' : '#374151',
    }), [isLight]);

    // 1. Initialisation du Graphique
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: colors.bg },
                textColor: colors.text,
                fontSize: 11,
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
            width: chartContainerRef.current.clientWidth,
            height: 480,
            timeScale: { borderColor: colors.grid, timeVisible: true, secondsVisible: false },
            rightPriceScale: { borderColor: colors.grid, scaleMargins: { top: 0.1, bottom: 0.1 } },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { labelBackgroundColor: colors.text },
                horzLine: { labelBackgroundColor: colors.text },
            },
            handleScale: { paddingRight: 10 },
        });

        chartRef.current = chart;

        // Gestion Tooltip
        chart.subscribeCrosshairMove(param => {
            if (!tooltipRef.current || !param.time || !param.point) {
                if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
                return;
            }

            const data = param.seriesData.get(mainSeriesRef.current);
            const sma = smaSeriesRef.current ? param.seriesData.get(smaSeriesRef.current) : null;
            const ema = emaSeriesRef.current ? param.seriesData.get(emaSeriesRef.current) : null;

            if (data) {
                const price = typeof data.value !== 'undefined' ? data.value : data.close;
                const dateStr = new Date(param.time * 1000).toLocaleString();
                const volumeStr = data.volume ? (data.volume > 1000000 ? `${(data.volume / 1000000).toFixed(2)}M` : data.volume.toLocaleString()) : 'N/A';

                let content = `
                    <div class="font-bold text-[10px] text-primary mb-2 border-b border-border/50 pb-1">${dateStr}</div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        <span class="text-text-secondary">Open</span> <span class="font-mono text-text-primary text-right">${data.open?.toFixed(2) || '-'}</span>
                        <span class="text-text-secondary">High</span> <span class="font-mono text-text-primary text-right">${data.high?.toFixed(2) || '-'}</span>
                        <span class="text-text-secondary">Low</span> <span class="font-mono text-text-primary text-right">${data.low?.toFixed(2) || '-'}</span>
                        <span class="text-text-secondary">Close</span> <span class="font-bold font-mono text-text-primary text-right">${data.close?.toFixed(2) || price.toFixed(2)}</span>
                        ${data.volume ? `<span class="text-text-secondary">Vol</span> <span class="font-mono text-text-primary text-right">${volumeStr}</span>` : ''}
                `;

                if (sma || ema) {
                    content += `<div class="col-span-2 h-px bg-border/50 my-1"></div>`;
                    if (sma) content += `<span class="text-warning">SMA(20)</span> <span class="font-mono text-text-primary text-right">${sma.value.toFixed(2)}</span>`;
                    if (ema) content += `<span class="text-info">EMA(9)</span> <span class="font-mono text-text-primary text-right">${ema.value.toFixed(2)}</span>`;
                }

                content += `</div>`;

                tooltipRef.current.innerHTML = content;
                tooltipRef.current.style.opacity = '1';

                // Smart Positioning
                const tooltipWidth = 150;
                const tooltipHeight = 160;
                let left = param.point.x + 15;
                let top = param.point.y + 15;

                if (left + tooltipWidth > chartContainerRef.current.clientWidth) left = param.point.x - tooltipWidth - 15;
                if (top + tooltipHeight > chartContainerRef.current.clientHeight) top = param.point.y - tooltipHeight - 15;

                tooltipRef.current.style.left = `${left}px`;
                tooltipRef.current.style.top = `${top}px`;
            }
        });

        // Resize Observer
        const resizeObserver = new ResizeObserver(() => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [colors]);

    // 2. Fetch Data & Calculate Indicators
    const fetchData = async () => {
        if (!chartRef.current) return;
        setLoading(true);
        setError(null);
        // On ne cache pas le graphique précédent pendant le loading pour éviter le clignotement
        // -> L'overlay se mettra par dessus

        try {
            // Mappe les timeframes frontend vers l'API backend/yfinance
            const periodMap = { '1d': '1d', '1wk': '5d', '1mo': '1mo', '3mo': '3mo', '1y': '1y', 'ytd': 'ytd' };
            const apiPeriod = periodMap[timeframe] || '1mo';

            const res = await api.get(`/api/trading/prices/history?symbol=${encodeURIComponent(symbol)}&period=${apiPeriod}`);
            const raw = res.data?.data || [];

            if (raw.length === 0) throw new Error("Aucune donnée disponible");

            // Format Data
            const formatted = raw
                .map(d => ({
                    time: Math.floor(new Date(d.date).getTime() / 1000),
                    open: parseFloat(d.open),
                    high: parseFloat(d.high),
                    low: parseFloat(d.low),
                    close: parseFloat(d.close),
                    value: parseFloat(d.close), // Pour Line chart
                    volume: d.volume ? parseFloat(d.volume) : undefined
                }))
                .filter(d => !isNaN(d.time))
                .sort((a, b) => a.time - b.time);

            // Dédoublonnage
            const unique = [];
            const seen = new Set();
            for (const d of formatted) {
                if (!seen.has(d.time)) { unique.push(d); seen.add(d.time); }
            }

            setMarketData(unique);

            // Calcul Indicateurs
            setIndicators({
                sma: calculateSMA(unique, 20),
                ema: calculateEMA(unique, 9)
            });
            setIsVisible(true);

        } catch (err) {
            console.error(err);
            setError("Impossible de charger les données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [symbol, timeframe]);

    // 3. Mise à jour des Séries (Main + Indicateurs)
    useEffect(() => {
        if (!chartRef.current || marketData.length === 0) return;

        // Gestion Série Principale
        if (mainSeriesRef.current) {
            chartRef.current.removeSeries(mainSeriesRef.current);
            mainSeriesRef.current = null;
        }

        if (chartType === 'candlestick') {
            mainSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
                upColor: colors.up, downColor: colors.down,
                borderVisible: false, wickUpColor: colors.up, wickDownColor: colors.down
            });
        } else {
            mainSeriesRef.current = chartRef.current.addSeries(AreaSeries, {
                lineColor: colors.areaLine, topColor: colors.areaTop, bottomColor: colors.areaBottom, lineWidth: 2
            });
        }
        mainSeriesRef.current.setData(marketData);

        // Gestion Indicateurs
        if (smaSeriesRef.current) {
            chartRef.current.removeSeries(smaSeriesRef.current);
            smaSeriesRef.current = null;
        }
        if (emaSeriesRef.current) {
            chartRef.current.removeSeries(emaSeriesRef.current);
            emaSeriesRef.current = null;
        }

        if (showIndicators) {
            smaSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: colors.sma, lineWidth: 1, title: 'SMA 20' });
            smaSeriesRef.current.setData(indicators.sma);

            emaSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: colors.ema, lineWidth: 1, title: 'EMA 9' });
            emaSeriesRef.current.setData(indicators.ema);
        }

    }, [marketData, chartType, showIndicators, colors]);


    return (
        <div className="relative w-full bg-background-input rounded-3xl border border-border overflow-hidden shadow-2xl transition-all group">

            {/* Toolbar UI */}
            <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap justify-between items-start pointer-events-none gap-2">
                {/* Symbol Info */}
                <div className="flex flex-col gap-1 pointer-events-auto bg-background-card/80 backdrop-blur-md p-2 rounded-xl border border-border/50 shadow-sm transition-transform hover:scale-105">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-warning animate-spin' : error ? 'bg-danger' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-text-primary font-black tracking-tighter uppercase text-sm">{symbol}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Timeframes */}
                    <div className="flex bg-background-card/80 backdrop-blur-md rounded-xl border border-border/50 p-1 gap-1 shadow-sm">
                        {['1d', '1wk', '1mo', '3mo'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all uppercase ${timeframe === tf ? 'bg-primary text-black shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type & Indicators */}
                    <div className="flex bg-background-card/80 backdrop-blur-md rounded-xl border border-border/50 p-1 gap-1 shadow-sm">
                        <button
                            onClick={() => setChartType(prev => prev === 'candlestick' ? 'area' : 'candlestick')}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary transition-all hover:bg-white/5"
                            title={chartType === 'candlestick' ? "Vue Ligne" : "Vue Bougies"}
                        >
                            {chartType === 'candlestick' ? <TrendingUp size={16} /> : <BarChart3 size={16} />}
                        </button>
                        <button
                            onClick={() => setShowIndicators(!showIndicators)}
                            className={`p-1.5 rounded-lg transition-all hover:bg-white/5 ${showIndicators ? 'text-primary' : 'text-text-secondary hover:text-primary'}`}
                            title="Indicateurs SMA/EMA"
                        >
                            <Layers size={16} />
                        </button>
                    </div>

                    <button onClick={fetchData} className="p-2 bg-background-card/80 backdrop-blur-md border border-border/50 rounded-xl text-text-secondary hover:text-primary transition-all active:rotate-180 hover:bg-white/5 shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Custom Tooltip */}
            <div
                ref={tooltipRef}
                className="absolute z-50 pointer-events-none transition-opacity duration-100 bg-background-card/95 backdrop-blur-xl border border-border p-3 rounded-xl shadow-xl min-w-[140px]"
                style={{ opacity: 0 }}
            />

            {/* Loading/Error States */}
            {loading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30 transition-opacity duration-300">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <div className="bg-danger/10 backdrop-blur-md border border-danger/20 p-4 rounded-xl flex items-center gap-3">
                        <Activity className="text-danger w-5 h-5" />
                        <span className="text-danger font-bold text-xs">{error}</span>
                    </div>
                </div>
            )}

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none overflow-hidden">
                <span className="text-[12rem] font-black text-text-primary tracking-tighter uppercase whitespace-nowrap transform -rotate-12">
                    {symbol.split('=')[0]}
                </span>
            </div>

            {/* Chart Container */}
            <div
                ref={chartContainerRef}
                className={`w-full h-[500px] transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

export default PriceChart;
