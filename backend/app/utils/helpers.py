import re
from datetime import datetime
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User


def validate_email(email):
    """
    Valider un format d'adresse email
    
    Args:
        email (str): Adresse email à valider
    
    Returns:
        bool: True si le format est valide, False sinon
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Valider la force d'un mot de passe
    
    Args:
        password (str): Mot de passe à valider
    
    Returns:
        bool: True si le mot de passe est suffisamment fort, False sinon
    """
    # Vérifier que le mot de passe a au moins 8 caractères
    if len(password) < 8:
        return False
    
    # Vérifier qu'il contient au moins une majuscule
    if not re.search(r'[A-Z]', password):
        return False
    
    # Vérifier qu'il contient au moins une minuscule
    if not re.search(r'[a-z]', password):
        return False
    
    # Vérifier qu'il contient au moins un chiffre
    if not re.search(r'\d', password):
        return False
    
    # Vérifier qu'il contient au moins un caractère spécial
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    
    return True


def format_currency(amount, currency='USD'):
    """
    Formater un montant en devise
    
    Args:
        amount (float): Montant à formater
        currency (str): Code de la devise
    
    Returns:
        str: Montant formaté avec symbole de devise
    """
    if currency == 'USD':
        return f"${amount:,.2f}"
    elif currency == 'EUR':
        return f"€{amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


def format_percentage(value):
    """
    Formater une valeur en pourcentage
    
    Args:
        value (float): Valeur à formater (ex: 0.05 pour 5%)
    
    Returns:
        str: Valeur formatée en pourcentage
    """
    return f"{value * 100:.2f}%"


def get_current_timestamp():
    """
    Obtenir le timestamp actuel au format ISO
    
    Returns:
        str: Timestamp actuel au format ISO
    """
    return datetime.utcnow().isoformat()


def admin_required(fn):
    """
    Décorateur pour exiger que l'utilisateur ait le rôle d'administrateur
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Vérifier que le JWT est présent
        verify_jwt_in_request()
        
        # Obtenir l'identité de l'utilisateur
        current_user_id = get_jwt_identity()
        
        # Récupérer l'utilisateur depuis la base de données
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès réservé aux administrateurs'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def calculate_risk_metrics(balance, risk_percentage=0.02):
    """
    Calculer les métriques de risque basées sur le solde du compte
    
    Args:
        balance (float): Solde du compte
        risk_percentage (float): Pourcentage de risque par transaction (par défaut 2%)
    
    Returns:
        dict: Métriques de risque calculées
    """
    max_risk_per_trade = balance * risk_percentage
    
    return {
        'balance': balance,
        'risk_percentage': risk_percentage,
        'max_risk_per_trade': max_risk_per_trade,
        'recommended_max_position_size': max_risk_per_trade  # Simplifié
    }


def sanitize_input(input_string, max_length=100):
    """
    Nettoyer et valider une chaîne d'entrée
    
    Args:
        input_string (str): Chaîne à nettoyer
        max_length (int): Longueur maximale autorisée
    
    Returns:
        str or None: Chaîne nettoyée ou None si invalide
    """
    if not input_string:
        return None
    
    # Convertir en chaîne si ce n'est pas déjà le cas
    input_string = str(input_string)
    
    # Supprimer les espaces blancs en début et fin
    input_string = input_string.strip()
    
    # Vérifier la longueur
    if len(input_string) > max_length:
        return None
    
    # Échapper les caractères potentiellement dangereux
    # (Dans une vraie application, utilisez une bibliothèque spécialisée)
    input_string = input_string.replace('<', '&lt;').replace('>', '&gt;')
    
    return input_string