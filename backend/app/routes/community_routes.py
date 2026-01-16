from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity,  get_jwt
from app import db
from app.models.community import CommunityPost, CommunityLike
from app.models.user import User

community_bp = Blueprint('community', __name__, url_prefix='/api/community')

@community_bp.route('/posts', methods=['GET'])
def get_posts():
    """Récupérer tous les posts (plus récents d'abord)"""
    try:
        # Check if user is logged in to show if they liked the post
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                from flask_jwt_extended import decode_token
                token = auth_header.split(" ")[1]
                decoded = decode_token(token)
                current_user_id = decoded['sub']
            except:
                pass

        posts = CommunityPost.query.order_by(CommunityPost.created_at.desc()).all()
        return jsonify([post.to_dict(current_user_id) for post in posts]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@community_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    """Créer une nouvelle publication"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({"error": "Le contenu est requis"}), 400
            
        new_post = CommunityPost(
            user_id=user_id,
            content=data.get('content')
        )
        
        db.session.add(new_post)
        db.session.commit()
        
        return jsonify(new_post.to_dict(user_id)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@community_bp.route('/posts/<post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    """Liker ou unliker une publication"""
    try:
        user_id = get_jwt_identity()
        
        # Vérifier si le post existe
        post = CommunityPost.query.get(post_id)
        if not post:
            return jsonify({"error": "Publication non trouvée"}), 404
            
        # Vérifier si le like existe déjà
        like = CommunityLike.query.filter_by(post_id=post_id, user_id=user_id).first()
        
        if like:
            # Unliker
            db.session.delete(like)
            message = "Like retiré"
            is_liked = False
        else:
            # Liker
            new_like = CommunityLike(post_id=post_id, user_id=user_id)
            db.session.add(new_like)
            message = "Publication likée"
            is_liked = True
            
        db.session.commit()
        
        # Retourner le nouveau compte de likes
        likes_count = CommunityLike.query.filter_by(post_id=post_id).count()
        
        return jsonify({
            "message": message,
            "likes_count": likes_count,
            "is_liked": is_liked
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
