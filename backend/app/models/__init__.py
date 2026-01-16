# Models for original trading platform
from .trading_account import TradingAccount
from .asset import Asset
from .original_trade import Trade as OriginalTrade

# Models for TradeSense
from .user import User
from .challenge import Challenge, ChallengeStatus, PlanType
from .trade import TsTrade as Trade
from .leaderboard import Leaderboard
from .payment import Payment
from .system_setting import SystemSetting
from .community import CommunityPost, CommunityLike
from .masterclass import MasterClass

# Exporter tous les modèles pour qu'ils soient facilement accessibles
from .payment import PaymentStatus, PaymentMethod
__all__ = ['User', 'Challenge', 'Trade', 'Leaderboard', 'Payment', 'TradingAccount', 'Asset', 'OriginalTrade', 'PaymentStatus', 'PaymentMethod', 'SystemSetting', 'CommunityPost', 'CommunityLike', 'MasterClass']