from app import db
from app.models import User


def authenticate_user(username, password):
    """
    Authentifier un utilisateur en vérifiant son nom d'utilisateur et mot de passe
    
    Args:
        username (str): Le nom d'utilisateur fourni
        password (str): Le mot de passe fourni
    
    Returns:
        User or None: L'objet utilisateur si les identifiants sont corrects, sinon None
    """
    # Trouver l'utilisateur par nom d'utilisateur ou email
    user = User.query.filter((User.username == username) | (User.email == username)).first()
    
    # Vérifier si l'utilisateur existe et si le mot de passe est correct
    if user and user.check_password(password):
        return user
    
    return None


def register_user(username, email, password):
    """
    Enregistrer un nouvel utilisateur dans la base de données
    
    Args:
        username (str): Le nom d'utilisateur choisi
        email (str): L'adresse email de l'utilisateur
        password (str): Le mot de passe de l'utilisateur
    
    Returns:
        User or None: L'objet utilisateur nouvellement créé, ou None si l'utilisateur existe déjà
    """
    # Vérifier si l'utilisateur ou l'email existe déjà
    existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
    
    if existing_user:
        return None  # Indiquer que l'utilisateur existe déjà
    
    # Créer un nouvel utilisateur
    user = User(username=username, email=email)
    user.set_password(password)  # Hacher et définir le mot de passe
    
    # Ajouter à la base de données
    db.session.add(user)
    db.session.commit()
    
    return user