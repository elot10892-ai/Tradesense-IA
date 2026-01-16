import time
import threading
from typing import Dict, List
from app.utils.market_data import get_stock_quote
from app.services.bvc_scraper import get_moroccan_stock_price
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PriceCache:
    """
    Simple in-memory cache for stock prices with expiration
    """
    def __init__(self, default_ttl: int = 30):  # 30 seconds default TTL
        self._cache = {}
        self._ttl = default_ttl  # Default time-to-live in seconds
        self._lock = threading.Lock()

    def get(self, key: str) -> tuple:
        """
        Get value from cache if not expired
        Returns (value, is_expired) tuple
        """
        with self._lock:
            if key in self._cache:
                value, timestamp, ttl = self._cache[key]
                if time.time() - timestamp < ttl:
                    return value, False  # Not expired
                else:
                    # Remove expired entry
                    del self._cache[key]
            return None, True  # Not found or expired

    def set(self, key: str, value, ttl: int = None):
        """
        Set value in cache with TTL
        """
        with self._lock:
            actual_ttl = ttl if ttl is not None else self._ttl
            self._cache[key] = (value, time.time(), actual_ttl)
            logger.debug(f"Set cache for {key} with TTL {actual_ttl}s")

    def clear(self):
        """
        Clear all cache entries
        """
        with self._lock:
            self._cache.clear()
            logger.info("Price cache cleared")

    def cleanup_expired(self):
        """
        Remove all expired entries
        """
        with self._lock:
            expired_keys = []
            current_time = time.time()
            for key, (value, timestamp, ttl) in self._cache.items():
                if current_time - timestamp >= ttl:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
            
            if expired_keys:
                logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")

# Global price cache instance
price_cache = PriceCache(default_ttl=30)  # 30 seconds TTL


def get_live_prices(symbols: List[str] = None) -> Dict[str, Dict]:
    """
    Get live prices for a list of symbols with caching
    If symbols is None, returns a default set of symbols
    """
    # Default symbols if none provided
    if symbols is None:
        symbols = [
            'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL',  # US stocks
            'SPY', 'QQQ',  # US ETFs
            'BTC-USD', 'ETH-USD',  # Cryptos
            'XAUUSD',  # Gold
            'IAM.CS', 'ATW.CS', 'MNG.CS', 'CFG.CS'  # Moroccan stocks
        ]
    
    prices = {}
    
    for symbol in symbols:
        symbol_upper = symbol.upper()
        cache_key = f"price_{symbol_upper}"
        
        # Check cache first
        cached_result, is_expired = price_cache.get(cache_key)
        if cached_result is not None and not is_expired:
            prices[symbol_upper] = cached_result
            logger.debug(f"Cache hit for {symbol_upper}")
            continue
        
        # Fetch fresh data
        try:
            # Check if it's a Moroccan stock (has .CS suffix)
            if symbol_upper.endswith('.CS'):
                price_data = get_moroccan_stock_price(symbol_upper)
            else:
                price_data = get_stock_quote(symbol_upper)
            
            if price_data:
                # Cache the result
                price_cache.set(cache_key, price_data)
                prices[symbol_upper] = price_data
                logger.debug(f"Fetched and cached data for {symbol_upper}")
            else:
                logger.warning(f"Could not fetch data for {symbol_upper}")
                # Still cache None results to avoid repeated failed requests
                price_cache.set(cache_key, None, ttl=10)  # Shorter TTL for failed requests
                prices[symbol_upper] = None
                
        except Exception as e:
            logger.error(f"Error fetching price for {symbol_upper}: {str(e)}")
            # Cache error result to avoid repeated failed requests
            price_cache.set(cache_key, None, ttl=10)  # Shorter TTL for failed requests
            prices[symbol_upper] = None
    
    return prices


def get_single_price(symbol: str) -> Dict:
    """
    Get live price for a single symbol with caching
    """
    symbol_upper = symbol.upper()
    cache_key = f"price_{symbol_upper}"
    
    # Check cache first
    cached_result, is_expired = price_cache.get(cache_key)
    if cached_result is not None and not is_expired:
        logger.debug(f"Cache hit for {symbol_upper}")
        return cached_result
    
    # Fetch fresh data
    try:
        # Check if it's a Moroccan stock (has .CS suffix)
        if symbol_upper.endswith('.CS'):
            price_data = get_moroccan_stock_price(symbol_upper)
        else:
            price_data = get_stock_quote(symbol_upper)
        
        if price_data:
            # Cache the result
            price_cache.set(cache_key, price_data)
            logger.debug(f"Fetched and cached data for {symbol_upper}")
            return price_data
        else:
            logger.warning(f"Could not fetch data for {symbol_upper}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching price for {symbol_upper}: {str(e)}")
        return None


def refresh_cache_for_symbols(symbols: List[str]):
    """
    Force refresh cache for specific symbols
    """
    for symbol in symbols:
        symbol_upper = symbol.upper()
        cache_key = f"price_{symbol_upper}"
        
        try:
            # Check if it's a Moroccan stock (has .CS suffix)
            if symbol_upper.endswith('.CS'):
                price_data = get_moroccan_stock_price(symbol_upper)
            else:
                price_data = get_stock_quote(symbol_upper)
            
            if price_data:
                # Update cache
                price_cache.set(cache_key, price_data)
                logger.info(f"Refreshed cache for {symbol_upper}")
            else:
                logger.warning(f"Could not refresh data for {symbol_upper}")
                
        except Exception as e:
            logger.error(f"Error refreshing cache for {symbol_upper}: {str(e)}")


def cleanup_expired_cache():
    """
    Clean up expired cache entries
    """
    price_cache.cleanup_expired()


# Background thread to periodically clean up expired cache entries
def _start_cache_cleanup_thread():
    """
    Start a background thread to periodically clean up expired cache entries
    """
    def cleanup_worker():
        while True:
            try:
                time.sleep(60)  # Run cleanup every minute
                cleanup_expired_cache()
            except Exception as e:
                logger.error(f"Error in cache cleanup worker: {str(e)}")
    
    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()
    logger.info("Started cache cleanup background thread")


# Start the background cleanup thread
_start_cache_cleanup_thread()