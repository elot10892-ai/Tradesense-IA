from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User, Challenge
from app.utils.helpers import validate_email, validate_password
from werkzeug.security import generate_password_hash
from datetime import datetime
import re

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/', methods=['GET'])
def auth_health():
    return {'status': 'auth ok'}


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Enregistrer un nouvel utilisateur
    - Input: {username, email, password}
    - Validation: email unique, password min 8 chars
    - Hash password avec werkzeug.security
    - Return: JWT token + user info
    """
    try:
        data = request.get_json()
        
        # Valider les champs requis
        if not data or 'username' not in data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Les champs username, email et password sont requis'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Valider le format de l'email
        if not validate_email(email):
            return jsonify({'error': 'Format d\'email invalide'}), 400
        
        # Vérifier la force du mot de passe
        if len(password) < 8:
            return jsonify({'error': 'Le mot de passe doit contenir au moins 8 caractères'}), 400
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({'error': 'Nom d\'utilisateur ou email déjà utilisé'}), 409
        
        # Créer un nouvel utilisateur
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Créer un token JWT
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de l\'inscription: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authentifier un utilisateur
    - Input: {email, password}
    - Vérification credentials
    - Return: JWT token + user info
    """
    try:
        data = request.get_json()
        
        # Valider les champs requis
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Les champs email et password sont requis'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Trouver l'utilisateur par email
        user = User.query.filter_by(email=email).first()
        
        # Vérifier les identifiants
        if not user or not user.check_password(password):
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Compte désactivé'}), 401
        
        # Mettre à jour la dernière connexion
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Créer un token JWT
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la connexion: {str(e)}'}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """
    Obtenir le profil de l'utilisateur connecté avec ses challenges actifs
    - Return: user complet + challenges actifs
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Debugging: List ALL challenges for this user to identify status issues
        all_challenges = Challenge.query.filter_by(user_id=current_user_id).all()
        print(f"DEBUG: Profile lookup for user {current_user_id}")
        print(f"DEBUG: Total challenges in DB for this user: {len(all_challenges)}")
        for i, c in enumerate(all_challenges):
            print(f"DEBUG: Challenge {i}: ID={c.id}, Status='{c.status}', Plan='{c.plan_type}'")

        # Récupérer les challenges actifs de l'utilisateur
        active_challenges = [c for c in all_challenges if c.status == 'active']
        
        # Sort by creation date descending
        active_challenges.sort(key=lambda x: x.created_at, reverse=True)
        
        print(f"DEBUG: Found {len(active_challenges)} active challenges for user {current_user_id}")
        
        response_data = {
            'user': user.to_dict(),
            'active_challenges': [challenge.to_dict() for challenge in active_challenges],
            'active_challenge': active_challenges[0].to_dict() if active_challenges else None
        }
        
        print(f"DEBUG: Returning active_challenge with ID: {response_data['active_challenge']['id'] if response_data['active_challenge'] else 'NONE'}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération du profil: {str(e)}'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Déconnexion de l'utilisateur
    - Invalidation token (optionnel, frontend gère)
    """
    try:
        # Note: Avec JWT, la déconnexion côté serveur nécessite une gestion de blacklist
        # Pour cette implémentation, on retourne simplement un message confirmant la déconnexion
        # Le frontend se chargera de supprimer le token localement
        return jsonify({'message': 'Déconnexion réussie'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la déconnexion: {str(e)}'}), 500