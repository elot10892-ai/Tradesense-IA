from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, case
from app import db
from app.models import User, Challenge, Trade
from datetime import datetime

leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')

@leaderboard_bp.route('/', methods=['GET'])
def leaderboard_health():
    """Vérification de l'état du service leaderboard"""
    return jsonify({"status": "leaderboard ok"}), 200

@leaderboard_bp.route('/top', methods=['GET'])
def get_top_traders():
    """
    Obtenir les meilleurs traders DU MOIS COURANT basés sur les trades réels fermés.
    Optimisé avec les indexes idx_challenge_user, idx_trade_challenge, idx_trade_user.
    """
    try:
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        # Le mois suivant pour la borne supérieure
        if now.month == 12:
            end_of_month = datetime(now.year + 1, 1, 1)
        else:
            end_of_month = datetime(now.year, now.month + 1, 1)

        # 1. Requête optimisée : 
        # - Jointure User -> Challenge -> Trade (TsTrade)
        # - Filtre Challenges actifs
        # - Filtre Trades fermés ce mois-ci
        # - Groupement par challenge pour avoir le capital initial précis par trade set
        stats_query = db.session.query(
            User.username,
            User.country,
            func.sum(Trade.profit_loss).label('total_profit_val'),
            Challenge.initial_balance
        ).select_from(User)\
         .join(Challenge, User.id == Challenge.user_id)\
         .join(Trade, Challenge.id == Trade.challenge_id)\
         .filter(Challenge.status == 'active')\
         .filter(Trade.is_closed == True)\
         .filter(Trade.timestamp >= start_of_month)\
         .filter(Trade.timestamp < end_of_month)\
         .group_by(User.id, User.username, User.country, Challenge.id, Challenge.initial_balance)

        results = stats_query.all()

        processed_list = []
        for username, country, total_profit_val, initial_balance in results:
            profit_val = float(total_profit_val or 0)
            capital = float(initial_balance or 1.0)
            if capital <= 0: capital = 1.0
            
            profit_pct = (profit_val / capital) * 100
            
            processed_list.append({
                'username': username,
                'country': country if country and country.strip() else "Inconnu",
                'profit': round(profit_pct, 2),
                'profit_val': round(profit_val, 2),
                'payout': round(max(0, profit_val), 2)
            })

        # 2. Tri par profit % décroissant
        processed_list.sort(key=lambda x: x['profit'], reverse=True)

        # 3. Top 10 + Rang
        final_top_10 = []
        for i, trader in enumerate(processed_list[:10]):
            trader['rank'] = i + 1
            final_top_10.append(trader)

        return jsonify(final_top_10), 200

    except Exception as e:
        print(f"[ERROR] Leaderboard API error: {str(e)}")
        return jsonify({"error": "Erreur lors du calcul du classement", "details": str(e)}), 500
