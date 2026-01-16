from app import db
from app.models import TradingAccount, Trade, Asset, Challenge
import uuid
from datetime import datetime


def create_trading_account(user_id, initial_balance=10000.0, leverage=1.0, risk_level='medium'):
    """
    Créer un nouveau compte de trading pour un utilisateur
    
    Args:
        user_id (str): ID de l'utilisateur propriétaire du compte
        initial_balance (float): Solde initial du compte
        leverage (float): Niveau de levier pour le compte
        risk_level (str): Niveau de risque ('low', 'medium', 'high')
    
    Returns:
        TradingAccount or None: Le compte de trading nouvellement créé, ou None en cas d'erreur
    """
    try:
        # Générer un numéro de compte unique
        account_number = f"ACC{str(uuid.uuid4().int)[:10].upper()}"
        
        # Créer le compte de trading
        account = TradingAccount(
            account_number=account_number,
            balance=initial_balance,
            equity=initial_balance,
            leverage=leverage,
            risk_level=risk_level,
            user_id=user_id
        )
        
        # Ajouter à la base de données
        db.session.add(account)
        db.session.commit()
        
        return account
    except Exception:
        db.session.rollback()
        return None


def get_trading_accounts(user_id):
    """
    Obtenir tous les comptes de trading d'un utilisateur
    
    Args:
        user_id (str): ID de l'utilisateur
    
    Returns:
        list: Liste des comptes de trading de l'utilisateur
    """
    return TradingAccount.query.filter_by(user_id=user_id).all()


def place_trade(user_id, trading_account_id, symbol, trade_type, quantity, entry_price, 
                stop_loss=None, take_profit=None):
    """
    Placer une nouvelle transaction de trading
    
    Args:
        user_id (str): ID de l'utilisateur effectuant la transaction
        trading_account_id (str): ID du compte de trading utilisé
        symbol (str): Symbole de l'actif (ex: AAPL, EURUSD)
        trade_type (str): Type de transaction ('buy' ou 'sell')
        quantity (int): Quantité d'actifs à trader
        entry_price (float): Prix d'entrée de la transaction
        stop_loss (float, optional): Prix de stop loss
        take_profit (float, optional): Prix de take profit
    
    Returns:
        Trade or None: La transaction nouvellement créée, ou None en cas d'erreur
    """
    try:
        # Vérifier que l'utilisateur possède le compte de trading
        account = TradingAccount.query.filter_by(
            id=trading_account_id, 
            user_id=user_id
        ).first()
        
        if not account:
            return None  # L'utilisateur ne possède pas ce compte ou le compte n'existe pas
        
        # Rechercher l'actif s'il existe, sinon créer un actif générique
        asset = Asset.query.filter_by(symbol=symbol.upper()).first()
        if not asset:
            # Créer un actif générique si non trouvé
            asset = Asset(
                symbol=symbol.upper(),
                name=f"{symbol.upper()} Asset",
                asset_type='stock',  # Valeur par défaut
                exchange='Generic'
            )
            db.session.add(asset)
            db.session.flush()  # Pour obtenir l'ID sans commiter
        
        # Créer la transaction
        trade = Trade(
            trade_type=trade_type.lower(),
            symbol=symbol.upper(),
            quantity=quantity,
            entry_price=entry_price,
            user_id=user_id,
            trading_account_id=trading_account_id,
            asset_id=asset.id,
            stop_loss=stop_loss,
            take_profit=take_profit
        )
        
        # Ajouter à la base de données
        db.session.add(trade)
        db.session.commit()
        
        return trade
    except Exception:
        db.session.rollback()
        return None


def close_trade(trade_id, user_id, exit_price):
    """
    Clôturer une transaction existante
    
    Args:
        trade_id (str): ID de la transaction à clôturer
        user_id (str): ID de l'utilisateur propriétaire de la transaction
        exit_price (float): Prix de sortie de la transaction
    
    Returns:
        Trade or None: La transaction mise à jour, ou None si non trouvée ou erreur
    """
    try:
        # Récupérer la transaction
        trade = Trade.query.filter_by(id=trade_id, user_id=user_id).first()
        
        if not trade or trade.status != 'open':
            return None  # Transaction non trouvée ou déjà fermée
        
        # Mettre à jour la transaction
        trade.exit_price = exit_price
        trade.exit_time = datetime.utcnow()
        trade.status = 'closed'
        
        # Calculer le profit/perte
        trade.calculate_pnl()
        
        # Mettre à jour le solde du compte de trading
        account = TradingAccount.query.get(trade.trading_account_id)
        if account:
            account.balance += trade.pnl
            account.equity = account.balance  # Simplifié - dans une vraie app, equity serait plus complexe
            
            # Mettre à jour l'équité du compte
            db.session.add(account)
        
        # Sauvegarder les modifications
        db.session.add(trade)
        db.session.commit()
        
        return trade
    except Exception:
        db.session.rollback()
        return None


def get_account_balance(account_id, user_id):
    """
    Obtenir les informations de solde d'un compte de trading
    
    Args:
        account_id (str): ID du compte de trading
        user_id (str): ID de l'utilisateur propriétaire du compte
    
    Returns:
        dict or None: Informations sur le solde du compte, ou None si non trouvé
    """
    account = TradingAccount.query.filter_by(id=account_id, user_id=user_id).first()
    
    if not account:
        return None
    
    # Calculer des statistiques supplémentaires basées sur les transactions
    open_trades = Trade.query.filter_by(
        trading_account_id=account_id,
        status='open'
    ).all()
    
    # Calculer la valeur des positions ouvertes
    unrealized_pnl = 0
    # Note: Dans une implémentation réelle, nous aurions besoin des prix actuels du marché
    # pour calculer les P&L non réalisés
    
    return {
        'account_id': account.id,
        'account_number': account.account_number,
        'balance': account.balance,
        'equity': account.equity,
        'leverage': account.leverage,
        'risk_level': account.risk_level,
        'status': account.status,
        'open_positions_count': len(open_trades),
        'unrealized_pnl': unrealized_pnl
    }


def get_user_trades(user_id, account_id=None):
    """
    Obtenir toutes les transactions d'un utilisateur, optionnellement filtrées par compte
    
    Args:
        user_id (str): ID de l'utilisateur
        account_id (str, optional): ID du compte de trading pour filtrer
    
    Returns:
        list: Liste des transactions de l'utilisateur
    """
    query = Trade.query.filter_by(user_id=user_id)
    
    if account_id:
        query = query.filter_by(trading_account_id=account_id)
    
    # Trier par date d'entrée (les plus récentes en premier)
    return query.order_by(Trade.entry_time.desc()).all()


def check_challenge_rules(challenge, trade=None, current_pnl=0):
    """
    Vérifier les règles du challenge ("killer rules")
    
    Args:
        challenge (Challenge): Objet challenge à vérifier
        trade (Trade, optional): Transaction en cours (si applicable)
        current_pnl (float): P&L actuel pour la journée (si applicable)
    
    Returns:
        dict: Résultat de la vérification avec détails
    """
    result = {
        'challenge_ok': True,
        'violations': [],
        'updated_status': challenge.status
    }
    
    # Vérifier la perte totale maximale
    if not challenge.check_total_loss_limit():
        result['challenge_ok'] = False
        result['violations'].append(f'Perte totale maximale dépassée: {challenge.max_total_loss_pct}%')
        result['updated_status'] = 'failed'
    
    # Vérifier l'objectif de profit
    if challenge.check_profit_target() and challenge.status != 'failed':
        result['updated_status'] = 'passed'
    
    # Vérifier la perte quotidienne maximale (si on a le P&L quotidien)
    if current_pnl != 0 and not challenge.check_daily_loss_limit(current_pnl):
        result['challenge_ok'] = False
        result['violations'].append(f'Perte quotidienne maximale dépassée: {challenge.max_daily_loss_pct}%')
    
    # Si des violations sont détectées, mettre à jour le statut du challenge
    if not result['challenge_ok'] and result['updated_status'] == 'failed':
        challenge.status = 'failed'
    elif challenge.check_profit_target() and challenge.status != 'failed':
        challenge.status = 'passed'
    
    return result