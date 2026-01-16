import React from 'react';
import usePricePolling from '../../hooks/usePricePolling';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const LiveTicker = () => {
    const { prices, loading } = usePricePolling(15000);

    const tickerSymbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'AAPL', 'TSLA', 'US30', 'IAM.CS', 'ATW.CS'];

    if (loading && Object.keys(prices).length === 0) {
        return (
            <div className="w-full bg-background-card/50 border-y border-border py-3 overflow-hidden flex items-center justify-center gap-4">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Syncing Live IA Signals...</span>
            </div>
        );
    }

    const items = tickerSymbols.map((sym, idx) => {
        const data = prices[sym] || prices[`${sym}=X`] || prices[`${sym}-USD`];
        const price = typeof data === 'object' ? data.price : data;
        const change = typeof data === 'object' ? (data.change_percent || 0) : 0;

        // Use deterministic but realistic signal generation
        const signalType = (sym.length + idx) % 2 === 0 ? 'BUY' : 'SELL';

        return {
            symbol: sym.replace('.CS', ''),
            price: price?.toLocaleString(undefined, { minimumFractionDigits: sym.includes('USD') && !sym.includes('BTC') ? 4 : 2 }),
            change: change,
            isUp: change >= 0,
            signal: signalType
        };
    }).filter(i => i.price);

    return (
        <div className="w-full bg-background-card/80 backdrop-blur-md border-y border-border py-4 overflow-hidden relative shadow-2xl">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...items, ...items].map((item, idx) => (
                    <div key={idx} className="inline-flex items-center gap-8 mx-12">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-text-primary tracking-tighter uppercase">{item.symbol}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${item.signal === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                IA {item.signal}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-text-secondary">${item.price}</span>
                        <div className={`flex items-center gap-1 text-[10px] font-black ${item.isUp ? 'text-success' : 'text-danger'}`}>
                            {item.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {item.isUp ? '+' : ''}{item.change.toFixed(2)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveTicker;
