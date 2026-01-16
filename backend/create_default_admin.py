"""
Script pour créer un compte administrateur par défaut
Crée un compte admin@tradesense.com avec le mot de passe Admin123!
"""
from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

def create_default_admin():
    """Créer un compte admin par défaut"""
    app = create_app()
    
    with app.app_context():
        # Vérifier si l'admin existe déjà
        existing_admin = User.query.filter_by(email='admin@tradesense.com').first()
        
        if existing_admin:
            print("⚠️  Un compte admin existe déjà!")
            print(f"   Email: {existing_admin.email}")
            print(f"   Username: {existing_admin.username}")
            print(f"   Rôle: {existing_admin.role}")
            
            # Mettre à jour le rôle si nécessaire
            if existing_admin.role != 'admin':
                existing_admin.role = 'admin'
                db.session.commit()
                print(f"   ✅ Rôle mis à jour vers 'admin'")
            
            print(f"\n🔐 Identifiants de connexion:")
            print(f"   Email: admin@tradesense.com")
            print(f"   Mot de passe: Admin123!")
            print(f"\n🔗 Accès: http://localhost:5173/admin")
            return
        
        # Créer le nouveau compte admin
        admin_user = User(
            username='Admin',
            email='admin@tradesense.com',
            password_hash=generate_password_hash('Admin123!'),
            role='admin',
            balance=0.0,
            is_active=True
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("✅ Compte administrateur créé avec succès!")
        print(f"\n👤 Informations du compte:")
        print(f"   Username: Admin")
        print(f"   Email: admin@tradesense.com")
        print(f"   Rôle: admin")
        print(f"\n🔐 Identifiants de connexion:")
        print(f"   Email: admin@tradesense.com")
        print(f"   Mot de passe: Admin123!")
        print(f"\n📋 Instructions:")
        print(f"   1. Allez sur: http://localhost:5173/login")
        print(f"   2. Connectez-vous avec les identifiants ci-dessus")
        print(f"   3. Accédez au panel admin: http://localhost:5173/admin")
        print(f"\n🎉 Vous êtes prêt à gérer TradeSense!")

if __name__ == "__main__":
    create_default_admin()
