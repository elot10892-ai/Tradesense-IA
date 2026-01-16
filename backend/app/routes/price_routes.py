from flask import request, jsonify, Blueprint
from app.services.price_service import get_live_prices, get_single_price
from app.utils.market_data import get_stock_quote, get_historical_data
from app.services.bvc_scraper import get_moroccan_stock_price
import logging
from flask_jwt_extended import jwt_required

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer le blueprint pour les prix en temps réel
price_bp = Blueprint('price', __name__, url_prefix='/api/trading')

@price_bp.route('/prices/live', methods=['GET'])
def get_live_prices_endpoint():
    try:
        symbols_param = request.args.get('symbols')
        symbols = None
        if symbols_param:
            symbols = [s.strip().upper() for s in symbols_param.split(',')]
        
        prices = get_live_prices(symbols)
        valid_prices = {symbol: data for symbol, data in prices.items() if data is not None}
        
        return jsonify({
            'timestamp': get_current_timestamp(),
            'prices': valid_prices,
            'total_symbols': len(valid_prices)
        }), 200
    except Exception as e:
        logger.error(f"Live prices error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@price_bp.route('/price/<symbol>', methods=['GET'])
def get_single_price_endpoint(symbol):
    try:
        symbol_upper = symbol.upper()
        logger.info(f"[PriceRoute] Fetching price for {symbol_upper}")
        
        price_data = get_single_price(symbol_upper)
        if price_data is None:
            logger.warning(f"[PriceRoute] Symbol {symbol_upper} not found")
            return jsonify({'error': f'Symbol {symbol_upper} not found'}), 404
        
        # Merge source field to response
        change = price_data.get('change_24h') or price_data.get('change_percent', 0.0)
        
        response_data = {
            'symbol': symbol_upper,
            'price': price_data.get('price'),
            'change_24h': change,
            'timestamp': price_data.get('timestamp') or get_current_timestamp()
        }
        
        logger.info(f"[PriceRoute] Returning data for {symbol_upper}")
        return jsonify(response_data), 200
    except Exception as e:
        logger.error(f"[PriceRoute] Error for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@price_bp.route('/prices/history', methods=['GET'])
def get_historical_prices_endpoint():
    try:
        symbol = request.args.get('symbol', 'XAUUSD').upper()
        period = request.args.get('period', '1mo') # Default to 1mo for chart
        
        data = get_historical_data(symbol, period)
        if data is None:
            logger.warning(f"No history data for {symbol}")
            return jsonify({'error': 'History data not available'}), 404
            
        return jsonify({
            'symbol': symbol,
            'period': period,
            'data': data
        }), 200
    except Exception as e:
        logger.error(f"History data error for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_current_timestamp():
    from datetime import datetime
    return datetime.now().isoformat()