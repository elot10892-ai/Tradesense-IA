from app import create_app
from flask import jsonify

# Point d'entrée principal de l'application Flask
app = create_app()


@app.route('/')
def home():
    """
    Route racine pour afficher les endpoints disponibles
    """
    return jsonify({
        'message': 'Bienvenue sur l API TradeSense',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth',
            'trading': '/api/trading',
            'user': '/api/user',
            'payment': '/api/payment',
            'leaderboard': '/api/leaderboard',
            'admin': '/api/admin'
        },
        'live_prices': '/api/trading/prices/live'
    }), 200


if __name__ == '__main__':
    app.run(debug=True)