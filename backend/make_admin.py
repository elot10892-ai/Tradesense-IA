"""
Script pour promouvoir un utilisateur en administrateur
Usage: python make_admin.py <email_ou_username>
"""
import sys
from app import create_app, db
from app.models import User

def make_admin(identifier):
    """Promouvoir un utilisateur en admin"""
    app = create_app()
    
    with app.app_context():
        # Chercher l'utilisateur par email ou username
        user = User.query.filter(
            (User.email == identifier) | (User.username == identifier)
        ).first()
        
        if not user:
            print(f"❌ Utilisateur '{identifier}' non trouvé")
            print("\n📋 Utilisateurs disponibles:")
            all_users = User.query.all()
            for u in all_users:
                print(f"  - {u.username} ({u.email}) - Rôle: {u.role}")
            return False
        
        # Mettre à jour le rôle
        old_role = user.role
        user.role = 'admin'
        db.session.commit()
        
        print(f"✅ Utilisateur '{user.username}' promu avec succès!")
        print(f"   Email: {user.email}")
        print(f"   Ancien rôle: {old_role}")
        print(f"   Nouveau rôle: {user.role}")
        print(f"\n🔗 Vous pouvez maintenant accéder à: http://localhost:5173/admin")
        return True

def make_superadmin(identifier):
    """Promouvoir un utilisateur en superadmin"""
    app = create_app()
    
    with app.app_context():
        user = User.query.filter(
            (User.email == identifier) | (User.username == identifier)
        ).first()
        
        if not user:
            print(f"❌ Utilisateur '{identifier}' non trouvé")
            return False
        
        old_role = user.role
        user.role = 'superadmin'
        db.session.commit()
        
        print(f"✅ Utilisateur '{user.username}' promu en SUPERADMIN!")
        print(f"   Email: {user.email}")
        print(f"   Ancien rôle: {old_role}")
        print(f"   Nouveau rôle: {user.role}")
        return True

def list_users():
    """Lister tous les utilisateurs"""
    app = create_app()
    
    with app.app_context():
        users = User.query.all()
        print("\n📋 Liste des utilisateurs:")
        print("-" * 70)
        for user in users:
            role_emoji = "👑" if user.role == 'superadmin' else "🔑" if user.role == 'admin' else "👤"
            print(f"{role_emoji} {user.username:20} | {user.email:30} | {user.role}")
        print("-" * 70)
        print(f"Total: {len(users)} utilisateur(s)\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python make_admin.py <email_ou_username>        # Promouvoir en admin")
        print("  python make_admin.py <email_ou_username> super  # Promouvoir en superadmin")
        print("  python make_admin.py list                       # Lister tous les utilisateurs")
        print("\nExemples:")
        print("  python make_admin.py john@example.com")
        print("  python make_admin.py admin@admin.com super")
        print("  python make_admin.py list")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "list":
        list_users()
    else:
        identifier = command
        is_super = len(sys.argv) > 2 and sys.argv[2] == "super"
        
        if is_super:
            make_superadmin(identifier)
        else:
            make_admin(identifier)
