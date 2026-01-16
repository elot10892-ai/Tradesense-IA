from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.masterclass import MasterClass
from app.models.user import User

masterclass_bp = Blueprint('masterclass', __name__, url_prefix='/api')

@masterclass_bp.route('/masterclasses', methods=['GET'])
def get_masterclasses():
    """Récupérer toutes les masterclasses avec filtrage optionnel par niveau"""
    try:
        level = request.args.get('level')
        if level and level != 'Tous':
            classes = MasterClass.query.filter_by(level=level).order_by(MasterClass.created_at.desc()).all()
        else:
            classes = MasterClass.query.order_by(MasterClass.created_at.desc()).all()
            
        return jsonify([c.to_dict() for c in classes]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@masterclass_bp.route('/admin/masterclasses', methods=['POST'])
@jwt_required()
def create_masterclass():
    """Créer une nouvelle masterclass (admin uniquement)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({"error": "Accès refusé"}), 403
            
        data = request.get_json()
        required_fields = ['title', 'description', 'level', 'category', 'duration']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Le champ {field} est requis"}), 400
                
        new_class = MasterClass(
            title=data.get('title'),
            description=data.get('description'),
            level=data.get('level'),
            category=data.get('category'),
            duration=data.get('duration'),
            video_url=data.get('video_url', ''),
            video_type=data.get('video_type', 'placeholder')
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        return jsonify(new_class.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@masterclass_bp.route('/admin/masterclasses/<id>', methods=['DELETE'])
@jwt_required()
def delete_masterclass(id):
    """Supprimer une masterclass (admin uniquement)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({"error": "Accès refusé"}), 403
            
        master_class = MasterClass.query.get(id)
        if not master_class:
            return jsonify({"error": "Masterclass non trouvée"}), 404
            
        db.session.delete(master_class)
        db.session.commit()
        
        return jsonify({"message": "Masterclass supprimée avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
