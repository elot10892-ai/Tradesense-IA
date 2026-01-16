from app import db
from app.models import Challenge, Trade, ChallengeStatus
from app.utils.market_data import get_stock_quote
from app.services.bvc_scraper import get_moroccan_stock_price
from datetime import datetime

def evaluate_killer_rules(challenge_id):
    """
    Évalue les règles 'Killer' pour un challenge donné et met à jour son statut.
    
    Règles à implémenter :
    1. Perte maximale journalière (FAIL) : Si la perte journalière ≥ 5 % du capital initial.
    2. Perte maximale totale (FAIL) : Si l’équité actuelle ≤ -10 % du capital initial.
    3. Objectif de profit (PASS) : Si l’équité actuelle ≥ +10 % du capital initial.
    
    Cette fonction est appelée après chaque clôture de trade, mise à jour du P&L ou changement d'équité.
    """
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        return None
    
    # Si le challenge n'est pas actif, on ne réévalue pas les règles de réussite/échec
    if challenge.status != ChallengeStatus.ACTIVE.value:
        return challenge

    # 1. Calculer l'équité actuelle (Balance + P&L non réalisé)
    open_trades = Trade.query.filter_by(challenge_id=challenge_id, is_closed=False).all()
    total_unrealized_pnl = 0
    
    for t in open_trades:
        # Récupérer le prix actuel pour calculer le P&L non réalisé
        if t.symbol.endswith('.CS'):
            quote = get_moroccan_stock_price(t.symbol)
        else:
            quote = get_stock_quote(t.symbol)
            
        if quote and quote.get('price'):
            total_unrealized_pnl += t.calculate_unrealized_pnl(quote['price'])
    
    current_equity = challenge.current_balance + total_unrealized_pnl
    
    # 2. Vérifier et réinitialiser le solde quotidien si nécessaire
    # challenge.check_and_reset_daily_balance() met à jour daily_start_balance si on a changé de jour
    challenge.check_and_reset_daily_balance()
    
    # 3. Paramètres de calcul
    initial = challenge.initial_balance
    if initial <= 0:
        return challenge # Ne devrait pas arriver
        
    # Calcul des seuils
    max_daily_loss = initial * (challenge.max_daily_loss_pct / 100.0)
    max_total_loss = initial * (challenge.max_total_loss_pct / 100.0)
    profit_target = initial * (challenge.profit_target_pct / 100.0)
    
    # 4. Évaluation des seuils (FAIL d'abord, puis PASS)
    
    # Règle 2 : Perte totale (FAIL)
    # Note : "Si l'équité actuelle <= -10% du capital initial" d'après l'énoncé.
    # Dans le contexte du trading prop firm, cela signifie que la perte totale par rapport à l'initial a atteint 10%.
    # Donc : initial - current_equity >= max_total_loss
    total_loss = initial - current_equity
    
    # Règle 1 : Perte journalière (FAIL)
    # La perte journalière est calculée par rapport au solde de début de journée
    current_daily_loss = challenge.daily_start_balance - current_equity
    
    # Règle 3 : Objectif de profit (PASS)
    current_profit = current_equity - initial
    
    new_status = ChallengeStatus.ACTIVE.value
    failed_reason = None
    
    if total_loss >= max_total_loss:
        new_status = ChallengeStatus.FAILED.value
        failed_reason = "total_loss"
        print(f"[KILLER] Challenge {challenge_id} FAILED (Total Loss: {total_loss} >= {max_total_loss})")
    elif current_daily_loss >= max_daily_loss:
        new_status = ChallengeStatus.FAILED.value
        failed_reason = "daily_loss"
        print(f"[KILLER] Challenge {challenge_id} FAILED (Daily Loss: {current_daily_loss} >= {max_daily_loss})")
    elif current_profit >= profit_target:
        new_status = ChallengeStatus.PASSED.value
        print(f"[KILLER] Challenge {challenge_id} PASSED (Profit: {current_profit} >= {profit_target})")
    
    # 5. Mise à jour si le statut a changé
    if new_status != ChallengeStatus.ACTIVE.value:
        challenge.status = new_status
        challenge.failed_reason = failed_reason
        challenge.completed_at = datetime.utcnow()
        db.session.commit()
        print(f"[KILLER] Status updated to {new_status} for challenge {challenge_id}")
    
    return challenge
