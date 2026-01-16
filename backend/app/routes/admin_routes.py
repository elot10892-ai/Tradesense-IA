from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models import User, Challenge, Payment
from datetime import datetime
import uuid

# Créer le blueprint pour l'administration
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def admin_required(fn):
    """
    Décorateur pour exiger que l'utilisateur ait le rôle d'administrateur
    """
    from functools import wraps
    from flask import jsonify
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from app.models import User
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Vérifier que le JWT est présent
        verify_jwt_in_request()
        
        # Obtenir l'identité de l'utilisateur
        current_user_id = get_jwt_identity()
        
        # Récupérer l'utilisateur depuis la base de données
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user or (user.role != 'admin' and user.role != 'superadmin'):
            return jsonify({'error': 'Accès réservé aux administrateurs'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


@admin_bp.route('/', methods=['GET'])
def admin_health():
    return {'status': 'admin ok'}


def superadmin_required(fn):
    """
    Décorateur pour exiger que l'utilisateur ait le rôle de super administrateur
    """
    from functools import wraps
    from flask import jsonify
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from app.models import User
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Vérifier que le JWT est présent
        verify_jwt_in_request()
        
        # Obtenir l'identité de l'utilisateur
        current_user_id = get_jwt_identity()
        
        # Récupérer l'utilisateur depuis la base de données
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user or user.role != 'superadmin':
            return jsonify({'error': 'Accès réservé aux super administrateurs'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """
    Obtenir tous les utilisateurs avec leurs challenges
    - Return: tous les users avec leurs challenges
    """
    try:
        # Récupérer tous les utilisateurs, triés par les plus récents
        users = User.query.order_by(User.created_at.desc()).all()
        
        users_data = []
        for user in users:
            challenges = Challenge.query.filter_by(user_id=user.id).all()
            
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'balance': user.balance,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active,
                'challenges': [challenge.to_dict() for challenge in challenges]
            }
            users_data.append(user_data)
        
        return jsonify({
            'users': users_data,
            'count': len(users_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des utilisateurs: {str(e)}'}), 500


@admin_bp.route('/challenge/<challenge_id>/status', methods=['PATCH'])
@admin_required
def update_challenge_status(challenge_id):
    """
    Mettre à jour le statut d'un challenge manuellement
    - Input: {status: 'passed'|'failed'}
    - Update challenge manuellement
    - Return: challenge updated
    """
    try:
        data = request.get_json()
        
        # Valider les champs requis
        if not data or 'status' not in data:
            return jsonify({'error': 'Le champ status est requis'}), 400
        
        new_status = data['status']
        
        # Valider le nouveau statut
        valid_statuses = ['active', 'passed', 'failed']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Status invalide. Options valides: {valid_statuses}'}), 400
        
        # Récupérer le challenge
        challenge = Challenge.query.filter_by(id=challenge_id).first()
        if not challenge:
            return jsonify({'error': 'Challenge non trouvé'}), 404
        
        # Mettre à jour le statut
        challenge.status = new_status
        challenge.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Statut du challenge mis à jour avec succès',
            'challenge': challenge.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la mise à jour du statut du challenge: {str(e)}'}), 500


@admin_bp.route('/challenges', methods=['GET'])
@admin_required
def get_all_challenges():
    """
    Obtenir tous les challenges avec les informations utilisateur
    - Return: tous les challenges avec leurs utilisateurs
    """
    try:
        # Récupérer tous les challenges, triés par les plus récents
        challenges = Challenge.query.order_by(Challenge.created_at.desc()).all()
        
        challenges_data = []
        for challenge in challenges:
            user = User.query.filter_by(id=challenge.user_id).first()
            
            challenge_data = challenge.to_dict()
            challenge_data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
            challenges_data.append(challenge_data)
        
        return jsonify({
            'challenges': challenges_data,
            'count': len(challenges_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des challenges: {str(e)}'}), 500


@admin_bp.route('/challenge/<challenge_id>/pass', methods=['PUT'])
@admin_required
def pass_challenge(challenge_id):
    """
    Marquer un challenge comme réussi (passed)
    - Update challenge status to 'passed'
    - Return: challenge updated
    """
    try:
        # Récupérer le challenge
        challenge = Challenge.query.filter_by(id=challenge_id).first()
        if not challenge:
            return jsonify({'error': 'Challenge non trouvé'}), 404
        
        # Mettre à jour le statut
        challenge.status = 'passed'
        challenge.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge marqué comme réussi',
            'challenge': challenge.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la validation du challenge: {str(e)}'}), 500


@admin_bp.route('/challenge/<challenge_id>/fail', methods=['PUT'])
@admin_required
def fail_challenge(challenge_id):
    """
    Marquer un challenge comme échoué (failed)
    - Update challenge status to 'failed'
    - Return: challenge updated
    """
    try:
        # Récupérer le challenge
        challenge = Challenge.query.filter_by(id=challenge_id).first()
        if not challenge:
            return jsonify({'error': 'Challenge non trouvé'}), 404
        
        # Mettre à jour le statut
        challenge.status = 'failed'
        challenge.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge marqué comme échoué',
            'challenge': challenge.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors du marquage d\'échec du challenge: {str(e)}'}), 500


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    """
    Obtenir les métriques d'administration
    - Return: métriques (total users, active challenges, total revenue)
    """
    try:
        # Calculer les métriques
        total_users = db.session.query(func.count(User.id)).scalar()
        active_challenges = db.session.query(func.count(Challenge.id)).filter(
            Challenge.status == 'active'
        ).scalar()
        
        # Calculer le revenu total (somme des paiements complétés)
        total_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == 'completed'
        ).scalar() or 0.0
        
        # Autres métriques utiles
        passed_challenges = db.session.query(func.count(Challenge.id)).filter(
            Challenge.status == 'passed'
        ).scalar()
        
        failed_challenges = db.session.query(func.count(Challenge.id)).filter(
            Challenge.status == 'failed'
        ).scalar()
        
        completed_payments = db.session.query(func.count(Payment.id)).filter(
            Payment.status == 'completed'
        ).scalar()
        
        return jsonify({
            'metrics': {
                'total_users': total_users,
                'active_challenges': active_challenges,
                'passed_challenges': passed_challenges,
                'failed_challenges': failed_challenges,
                'total_revenue': float(total_revenue),
                'completed_payments': completed_payments
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des métriques: {str(e)}'}), 500


@admin_bp.route('/user/<user_id>', methods=['DELETE'])
@superadmin_required
def delete_user(user_id):
    """
    Supprimer un utilisateur (superadmin seulement)
    - Suppression cascade
    """
    try:
        # Récupérer l'utilisateur
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Supprimer l'utilisateur (suppression en cascade des challenges, trades, payments, etc.)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': f'Utilisateur {user.username} supprimé avec succès'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la suppression de l\'utilisateur: {str(e)}'}), 500


@admin_bp.route('/paypal/config', methods=['GET'])
@admin_required
def get_paypal_config():
    """
    Obtenir la configuration PayPal actuelle
    """
    try:
        from app.models import SystemSetting
        
        client_id = SystemSetting.get('paypal_client_id', '')
        # Ne jamais renvoyer le secret complet au frontend, juste un indicateur s'il est configuré
        secret = SystemSetting.get('paypal_client_secret', '')
        mode = SystemSetting.get('paypal_mode', 'sandbox')
        
        return jsonify({
            'client_id': client_id,
            'has_secret': bool(secret),
            'mode': mode
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération de la config PayPal: {str(e)}'}), 500


@admin_bp.route('/paypal/config', methods=['PATCH'])
@admin_required
def update_paypal_config():
    """
    Mettre à jour la configuration PayPal
    """
    try:
        from app.models import SystemSetting
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Données manquantes'}), 400
            
        if 'client_id' in data:
            SystemSetting.set('paypal_client_id', data['client_id'], 'PayPal Client ID')
            
        if 'client_secret' in data and data['client_secret']:
            # Ne mettre à jour que si un nouveau secret est fourni
            SystemSetting.set('paypal_client_secret', data['client_secret'], 'PayPal Client Secret')
            
        if 'mode' in data:
            if data['mode'] not in ['sandbox', 'live']:
                return jsonify({'error': 'Mode invalide'}), 400
            SystemSetting.set('paypal_mode', data['mode'], 'PayPal Mode (sandbox/live)')
            
        db.session.commit()
        
        return jsonify({'message': 'Configuration PayPal mise à jour avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la mise à jour de la config PayPal: {str(e)}'}), 500
