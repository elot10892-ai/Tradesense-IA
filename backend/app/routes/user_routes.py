from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

# Create blueprint
user_bp = Blueprint('user', __name__, url_prefix='/api/user')


@user_bp.route('/', methods=['GET'])
def user_health():
    return {'status': 'user ok'}


@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Obtenir le profil de l'utilisateur connecté
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Mettre à jour le profil de l'utilisateur connecté
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        
        # Mettre à jour les champs autorisés
        allowed_fields = ['first_name', 'last_name', 'email']
        for field in allowed_fields:
            if field in data:
                if field == 'email':
                    # Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
                    existing_user = User.query.filter_by(email=data[field]).first()
                    if existing_user and existing_user.id != user.id:
                        return jsonify({'error': 'Email déjà utilisé par un autre utilisateur'}), 409
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profil mis à jour avec succès',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """
    Changer le mot de passe de l'utilisateur connecté
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        data = request.get_json()
        
        # Vérifier que l'ancien mot de passe est fourni et correct
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({'error': 'Ancien et nouveau mot de passe requis'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Ancien mot de passe incorrect'}), 401
        
        # Définir le nouveau mot de passe
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'message': 'Mot de passe changé avec succès'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Obtenir les informations d'un utilisateur spécifique (pour les administrateurs)
    """
    try:
        # Pour simplifier, on suppose que tous les utilisateurs peuvent voir les autres utilisateurs
        # Dans une vraie application, il faudrait vérifier les rôles
        user = User.query.filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500