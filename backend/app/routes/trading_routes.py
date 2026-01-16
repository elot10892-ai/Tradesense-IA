from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Challenge, Trade, User, ChallengeStatus
from app.utils.market_data import get_stock_quote
from app.services.killer_service import evaluate_killer_rules
from app.services.bvc_scraper import get_moroccan_stock_price
from datetime import datetime

# Create blueprint
trading_bp = Blueprint('trading', __name__, url_prefix='/api/trading')


@trading_bp.route('/', methods=['GET'])
def trading_health():
    return {'status': 'trading ok'}


@trading_bp.route('/markets', methods=['GET'])
@jwt_required()
def get_markets():
    """
    Obtenir la liste exhaustive des symboles disponibles
    """
    try:
        markets = [
            # Commodities & Forex (International)
            {'symbol': 'XAUUSD', 'name': 'Gold (XAU/USD)', 'type': 'commodity', 'exchange': 'FOREX'},
            {'symbol': 'EURUSD=X', 'name': 'EUR/USD', 'type': 'forex', 'exchange': 'FOREX'},
            {'symbol': 'GBPUSD=X', 'name': 'GBP/USD', 'type': 'forex', 'exchange': 'FOREX'},
            {'symbol': 'USDJPY=X', 'name': 'USD/JPY', 'type': 'forex', 'exchange': 'FOREX'},
            
            # US Stocks (International)
            {'symbol': 'AAPL', 'name': 'Apple Inc.', 'type': 'stock', 'exchange': 'NASDAQ'},
            {'symbol': 'TSLA', 'name': 'Tesla Inc.', 'type': 'stock', 'exchange': 'NASDAQ'},
            {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'type': 'stock', 'exchange': 'NASDAQ'},
            {'symbol': 'NVDA', 'name': 'NVIDIA Corp', 'type': 'stock', 'exchange': 'NASDAQ'},
            
            # Cryptocurrencies (International)
            {'symbol': 'BTC-USD', 'name': 'Bitcoin USD', 'type': 'crypto', 'exchange': 'CRYPTO'},
            {'symbol': 'ETH-USD', 'name': 'Ethereum USD', 'type': 'crypto', 'exchange': 'CRYPTO'},
            {'symbol': 'SOL-USD', 'name': 'Solana USD', 'type': 'crypto', 'exchange': 'CRYPTO'},
            
            # Morocco Markets (Casablanca Stock Exchange)
            {'symbol': 'IAM.CS', 'name': 'Maroc Telecom', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'ATW.CS', 'name': 'Attijariwafa Bank', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'BCP.CS', 'name': 'Banque Centrale Populaire', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'MNG.CS', 'name': 'Managem SA', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'BCI.CS', 'name': 'BCP (Banque Populaire)', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'CIM.CS', 'name': 'Ciments du Maroc', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'AFMA.CS', 'name': 'AFMA SA', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
            {'symbol': 'BOA.CS', 'name': 'Bank Of Africa', 'type': 'stock', 'exchange': 'Casablanca Stock Exchange'},
        ]
        
        return jsonify({
            'markets': markets,
            'count': len(markets)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@trading_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute_trade():
    """
    Exécuter un ordre de trading
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        challenge_id = data.get('challenge_id')
        symbol = data.get('symbol')
        trade_type = data.get('type', '').upper()
        quantity = data.get('quantity')
        
        if not all([challenge_id, symbol, trade_type, quantity]):
            return jsonify({'error': 'Tous les champs sont requis'}), 400
            
        try:
            quantity = int(quantity)
        except:
            return jsonify({'error': 'La quantité doit être un entier'}), 400
        
        challenge = Challenge.query.filter_by(id=challenge_id, user_id=current_user_id).first()
        if not challenge:
            return jsonify({'error': 'Challenge non trouvé'}), 404
            
        # Vérification du statut pour limiter le trading aux challenges actifs
        if challenge.status != ChallengeStatus.ACTIVE.value:
            return jsonify({
                'error': f'Challenge {challenge.status} — trading désactivé',
                'status': challenge.status
            }), 400
            
        # Get Price
        if symbol.endswith('.CS'):
            quote = get_moroccan_stock_price(symbol)
        else:
            quote = get_stock_quote(symbol)
            
        if not quote or not quote.get('price'):
            return jsonify({'error': 'Prix non disponible'}), 400
            
        trade = Trade(
            challenge_id=challenge_id,
            user_id=current_user_id,
            symbol=symbol,
            trade_type=trade_type,
            quantity=quantity,
            entry_price=quote['price']
        )
        
        db.session.add(trade)
        db.session.commit()
        
        return jsonify({
            'trade': trade.to_dict(),
            'challenge': challenge.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@trading_bp.route('/history', methods=['GET'])
@jwt_required()
def get_trade_history():
    """
    Obtenir l'historique complet de tous les trades de l'utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"[Trading] Fetching full trade history for user: {current_user_id}")
        
        # On récupère tous les trades liés à l'utilisateur
        trades = Trade.query.filter((Trade.user_id == current_user_id)).order_by(Trade.timestamp.desc()).all()
        
        # Si certains trades n'ont pas de user_id (anciens), on peut les récupérer via les challenges
        if not trades:
            trades = Trade.query.join(Challenge).filter(Challenge.user_id == current_user_id).order_by(Trade.timestamp.desc()).all()

        # Obtenir les prix actuels pour les trades ouverts dans l'historique
        current_prices = {}
        unique_symbols = {t.symbol for t in trades if not t.is_closed}
        
        for symbol in unique_symbols:
            if symbol.endswith('.CS'):
                quote = get_moroccan_stock_price(symbol)
            else:
                quote = get_stock_quote(symbol)
            
            if quote:
                current_prices[symbol] = quote.get('price')

        print(f"[Trading] Found {len(trades)} historical trades. Unique open symbols: {len(unique_symbols)}")
        
        return jsonify({
            'trades': [t.to_dict(current_price=current_prices.get(t.symbol)) for t in trades],
            'count': len(trades)
        }), 200
    except Exception as e:
        print(f"[Trading ERROR] History fetch failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trading_bp.route('/challenge/<challenge_id>/trades', methods=['GET'])
@jwt_required()
def get_challenge_trades(challenge_id):
    try:
        current_user_id = get_jwt_identity()
        print(f"[Trading] Fetching trades for challenge {challenge_id} and user {current_user_id}")
        
        challenge = Challenge.query.filter_by(id=challenge_id, user_id=current_user_id).first()
        if not challenge:
            print(f"[Trading WARNING] Challenge {challenge_id} not found or unauthorized for user {current_user_id}")
            return jsonify({'error': 'Non autorisé'}), 404
            
        # Évaluation automatique des règles Killer lors du fetch
        evaluate_killer_rules(challenge_id)
            
        trades = Trade.query.filter_by(challenge_id=challenge_id).order_by(Trade.timestamp.desc()).all()
        
        # Obtenir les prix actuels pour les trades ouverts
        current_prices = {}
        unique_symbols = {t.symbol for t in trades if not t.is_closed}
        
        for symbol in unique_symbols:
            if symbol.endswith('.CS'):
                quote = get_moroccan_stock_price(symbol)
            else:
                quote = get_stock_quote(symbol)
            
            if quote:
                current_prices[symbol] = quote.get('price')
        
        print(f"[Trading] Returning {len(trades)} trades for challenge {challenge_id}")
        
        return jsonify({
            'trades': [t.to_dict(current_price=current_prices.get(t.symbol)) for t in trades]
        }), 200
    except Exception as e:
        print(f"[Trading ERROR] Challenge trades fetch failed: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trading_bp.route('/challenge/<challenge_id>/status', methods=['GET'])
@jwt_required()
def get_challenge_status(challenge_id):
    try:
        current_user_id = get_jwt_identity()
        challenge = Challenge.query.filter_by(id=challenge_id, user_id=current_user_id).first()
        if not challenge:
            return jsonify({'error': 'Non trouvé'}), 404
            
        # Optionnel: recalculer l'équité pour mettre à jour le statut en temps réel
        open_trades = Trade.query.filter_by(challenge_id=challenge_id, is_closed=False).all()
        total_unrealized_pnl = 0
        for t in open_trades:
            if t.symbol.endswith('.CS'):
                quote = get_moroccan_stock_price(t.symbol)
            else:
                quote = get_stock_quote(t.symbol)
            if quote and quote.get('price'):
                total_unrealized_pnl += t.calculate_unrealized_pnl(quote['price'])
        
        current_equity = challenge.current_balance + total_unrealized_pnl
        
        # Appel de la fonction centrale Killer
        evaluate_killer_rules(challenge_id)
        
        db.session.commit()
            
        return jsonify({
            'challenge': challenge.to_dict(),
            'equity': current_equity,
            'profit_loss': {
                'total_pnl': current_equity - challenge.initial_balance,
                'profit_percentage': ((current_equity - challenge.initial_balance) / challenge.initial_balance) * 100 if challenge.initial_balance else 0
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@trading_bp.route('/challenge/<challenge_id>/sync', methods=['POST'])
@jwt_required()
def sync_challenge(challenge_id):
    """Force synchronization and status update"""
    return get_challenge_status(challenge_id)


@trading_bp.route('/close-trade/<trade_id>', methods=['PUT'])
@jwt_required()
def close_trade(trade_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        exit_price = data.get('exit_price')
        
        trade = Trade.query.join(Challenge).filter(Trade.id == trade_id, Challenge.user_id == current_user_id).first()
        if not trade:
            return jsonify({'error': 'Trade non trouvé'}), 404
            
        challenge = trade.challenge
        trade.close_trade(exit_price, challenge)
        
        # Évaluer les règles killer après clôture de trade
        evaluate_killer_rules(challenge.id)
        
        db.session.commit()
        
        return jsonify({
            'trade': trade.to_dict(),
            'challenge': challenge.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500