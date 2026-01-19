from flask import Blueprint, jsonify
from app.utils.market_data import get_historical_data, get_stock_quote
from app.services.bvc_scraper import get_moroccan_stock_price
from datetime import datetime
import pandas as pd
import numpy as np

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

def calculate_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50  # Neutral if not enough data
    
    deltas = np.diff(prices)
    seed = deltas[:period+1]
    up = seed[seed >= 0].sum() / period
    down = -seed[seed < 0].sum() / period
    rs = up / down if down != 0 else 100
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100. / (1. + rs)

    for i in range(period, len(prices)):
        delta = deltas[i - 1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta

        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period

        rs = up / down if down != 0 else 100
        rsi[i] = 100. - 100. / (1. + rs)

    return rsi[-1]

@ai_bp.route('/signals', methods=['GET'])
def get_ai_signals():
    # Restricted to IAM and BTC as requested
    symbols = ['IAM.CS', 'BTCUSD']
    signals = []

    for symbol in symbols:
        try:
            # Use the correct price source based on symbol type
            if symbol.endswith('.CS'):
                # Moroccan stock - use BVC scraper
                quote = get_moroccan_stock_price(symbol)
            else:
                # International - use standard quote
                quote = get_stock_quote(symbol)
            
            if not quote or 'price' not in quote:
                # If market data fails, skip this symbol
                print(f"[AI Signals] No price data for {symbol}, skipping")
                continue

            price = quote['price']
            change = quote.get('change_percent', quote.get('change_24h', 0.0))
            
            # AI Logic based on current live change
            if change > 0.2:
                signal_type = "BUY"
                justification = f"Hausse de {change:+.2f}%. Forte dynamique haussière. Momentum acheteur confirmé."
                confidence = min(98, 70 + (change * 5))
            elif change < -0.2:
                signal_type = "SELL"
                justification = f"Baisse de {change:+.2f}%. Pression vendeuse détectée. Tendance négative."
                confidence = min(98, 70 + (abs(change) * 5))
            else:
                signal_type = "HOLD"
                justification = f"Variation de {change:+.2f}%. Marché stable. Attente de confirmation."
                confidence = 50 + (abs(change) * 10)

            signals.append({
                "symbol": symbol,
                "signal": signal_type,
                "justification": justification,
                "price": float(price),
                "confidence": int(confidence)
            })
            
            print(f"[AI Signals] {symbol}: ${price:.2f} ({change:+.2f}%) -> {signal_type}")

        except Exception as e:
            print(f"[AI Signals] Error generating signal for {symbol}: {str(e)}")
            # No static fallback as requested

    return jsonify({
        "success": True, 
        "signals": signals
    })
