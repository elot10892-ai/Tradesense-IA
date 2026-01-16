
from flask import Blueprint, jsonify
from app.utils.market_data import get_financial_news

news_bp = Blueprint('news', __name__, url_prefix='/api')

@news_bp.route('/news', methods=['GET'])
def get_news():
    """
    GET /api/news
    Récupère les dernières actualités financières
    """
    try:
        news = get_financial_news()
        return jsonify(news), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
