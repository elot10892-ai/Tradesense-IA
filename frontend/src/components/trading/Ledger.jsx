import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, RefreshCw, Target, ArrowUp, ArrowDown, X, Filter, Search, History, Trophy } from 'lucide-react';

const Ledger = ({ trades, viewMode, setViewMode, onCloseTrade }) => {
    const { t } = useTranslation();
    const [searchSymbol, setSearchSymbol] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const displayedTrades = trades.filter(trade => {
        const matchesStatus = filterStatus === 'ALL' ? true : filterStatus === 'OPEN' ? !trade.is_closed : trade.is_closed;
        const matchesSearch = trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const formatPnL = (value) => {
        const isPositive = value >= 0;
        return (
            <span className={`font-mono font-bold text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{value.toFixed(2)}
            </span>
        );
    };

    return (
        <div className="bg-background-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col h-full transition-all hover:border-primary/20 group">
            {/* Header Section */}
            <div className="p-4 border-b border-border bg-background-input/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/20 shadow-inner group-hover:shadow-primary/20 transition-all duration-500">
                        <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-text-primary leading-none mb-1">{t('trading.ledger') || 'Grand Livre'}</h3>
                        <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest opacity-60">Historique & Positions</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* View Switcher */}
                    <div className="flex bg-background-input/50 p-1 rounded-lg border border-border/50 shadow-inner">
                        <button
                            onClick={() => setViewMode('CHALLENGE')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all duration-300 ${viewMode === 'CHALLENGE' ? 'bg-primary text-black shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                        >
                            <Trophy className="w-3 h-3" />
                            {t('trading.challenge')}
                        </button>
                        <button
                            onClick={() => setViewMode('HISTORY')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all duration-300 ${viewMode === 'HISTORY' ? 'bg-primary text-black shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                        >
                            <History className="w-3 h-3" />
                            {t('trading.history')}
                        </button>
                    </div>

                    {/* Integrated Search & Filter */}
                    <div className="flex items-center gap-2 bg-background-input/30 p-1 rounded-lg border border-border/50">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('trading.filter_symbol') || 'Filtrer symbole...'}
                                value={searchSymbol}
                                onChange={(e) => setSearchSymbol(e.target.value)}
                                className="w-24 sm:w-32 bg-transparent border-none text-[10px] font-bold text-text-primary placeholder:text-text-secondary/50 focus:ring-0 pl-7 py-1"
                            />
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-secondary" />
                        </div>
                        <div className="w-[1px] h-4 bg-border/50"></div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-text-primary focus:ring-0 cursor-pointer py-1 pr-8"
                        >
                            <option value="ALL" className="bg-background-card">{t('trading.all') || 'TOUT'}</option>
                            <option value="OPEN" className="bg-background-card">{t('trading.open') || 'OUVERT'}</option>
                            <option value="CLOSED" className="bg-background-card">{t('trading.closed') || 'FERMÉ'}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar scroll-smooth">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr className="bg-background-input/60 backdrop-blur-md border-b border-border">
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('trading.instrument')}</th>
                            <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('trading.type')}</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('trading.entry')}</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('trading.volume')}</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('trading.pnl')} ($)</th>
                            <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-widest text-text-secondary">% PnL</th>
                            <th className="py-3 px-4 text-right text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('dashboard.target')}</th>
                            {viewMode === 'CHALLENGE' && <th className="py-3 px-4 text-center text-[9px] font-black uppercase tracking-widest text-text-secondary">{t('admin.actions')}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {displayedTrades.length === 0 ? (
                            <tr>
                                <td colSpan={viewMode === 'CHALLENGE' ? 8 : 7} className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                                        <div className="p-4 rounded-full bg-background-input">
                                            <RefreshCw className="w-8 h-8 text-text-secondary" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">{t('trading.no_positions')}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayedTrades.map(trade => {
                                // PnL Calculation Logic
                                const currentPrice = trade.current_price || trade.entry_price;
                                const isBuy = trade.trade_type === 'BUY';
                                const pnlValue = trade.is_closed
                                    ? (trade.profit_loss || 0)
                                    : (isBuy ? (currentPrice - trade.entry_price) * trade.quantity : (trade.entry_price - currentPrice) * trade.quantity);
                                const pnlPct = trade.entry_price
                                    ? (pnlValue / (trade.entry_price * trade.quantity)) * 100 // ROI formula roughly
                                    : 0;
                                // Correct ROI based on user formula: PnL / (Entry * Qty) ? 
                                // Actually Dashboard used: ((current - entry) / entry) * 100 which is price move %. 
                                // Proper PnL% usually involves leverage but here let's stick to simple price move % for consistency with previous Dashboard code
                                const movePct = trade.entry_price ? ((isBuy ? currentPrice - trade.entry_price : trade.entry_price - currentPrice) / trade.entry_price) * 100 : 0;

                                const targetPrice = isBuy ? trade.entry_price * 1.10 : trade.entry_price * 0.90;

                                return (
                                    <tr key={trade.id} className="group hover:bg-background-input/30 transition-colors duration-200 border-l-2 border-l-transparent hover:border-l-primary">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg border ${isBuy ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                                    {isBuy ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-rose-500" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-text-primary group-hover:text-primary transition-colors tracking-tight">{trade.symbol}</span>
                                                    <span className="text-[9px] text-text-secondary font-mono opacity-60">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${isBuy ? 'text-emerald-400 bg-emerald-400/5' : 'text-rose-400 bg-rose-400/5'}`}>
                                                {isBuy ? 'ACHAT' : 'VENTE'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-mono text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                                                {trade.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-xs text-text-primary">{trade.quantity}</span>
                                                <span className="text-[8px] text-text-secondary font-bold uppercase tracking-widest opacity-50">{trade.symbol.includes('.CS') ? 'Act.' : 'Lots'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex flex-col items-end">
                                                {formatPnL(pnlValue)}
                                                {!trade.is_closed && <span className="text-[8px] text-primary animate-pulse font-black uppercase tracking-widest mt-0.5">LIVE</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`font-mono text-xs font-bold ${movePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {movePct > 0 ? '+' : ''}{movePct.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Target className="w-3 h-3 text-text-secondary" />
                                                <span className="font-mono text-xs text-text-secondary">{targetPrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        {viewMode === 'CHALLENGE' && (
                                            <td className="py-3 px-4 text-center">
                                                {!trade.is_closed ? (
                                                    <button
                                                        onClick={() => onCloseTrade(trade)}
                                                        className="p-1.5 bg-background-input hover:bg-rose-500 text-text-secondary hover:text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-rose-500/40 group/close"
                                                        title={t('trading.close')}
                                                    >
                                                        <X className="w-3.5 h-3.5 transition-transform group-hover/close:rotate-90" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider opacity-40">Fermé</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Ledger;
