import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional
import json
import hashlib
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache
_cache = {}
_CACHE_TIMEOUT = 60  # 60 seconds


def _get_from_cache(key: str) -> Optional[dict]:
    """Get data from cache if not expired"""
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < _CACHE_TIMEOUT:
            logger.debug(f"Cache hit for key: {key}")
            return data
        else:
            del _cache[key]
    return None


def _set_to_cache(key: str, data: dict):
    """Store data in cache with timestamp"""
    _cache[key] = (data, time.time())


def get_moroccan_stock_price(symbol: str) -> Optional[Dict]:
    """
    Get the current price for a Moroccan stock.
    Robust version with multiple fallbacks.
    """
    symbol_upper = symbol.upper()
    logger.info(f"[MoroccoPrice] Fetching price for {symbol_upper}...")
    
    cache_key = f"stock_{symbol_upper}"
    
    cached_result = _get_from_cache(cache_key)
    if cached_result:
        logger.info(f"[MoroccoPrice] Cache hit for {symbol_upper}")
        return cached_result
    
    # 1. Tentative avec yfinance
    try:
        import yfinance as yf
        ticker_symbol = symbol_upper if '.CS' in symbol_upper else f"{symbol_upper}.CS"
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="2d")
        
        if not hist.empty and len(hist) >= 1:
            price = round(hist['Close'].iloc[-1], 2)
            change_24h = 0
            if len(hist) >= 2:
                prev_close = hist['Close'].iloc[-2]
                change_24h = round(((price - prev_close) / prev_close) * 100, 2)
            
            result = {
                'symbol': symbol_upper,
                'price': price,
                'change_24h': change_24h,
                'timestamp': datetime.now().isoformat(),
                'source': 'yfinance'
            }
            logger.info(f"[MoroccoPrice] Success (yfinance) for {symbol_upper}")
            _set_to_cache(cache_key, result)
            return result
    except Exception as e:
        logger.error(f"[MoroccoPrice] yfinance failed for {symbol_upper}: {str(e)}")

    # 2. Fallback Mock de Sécurité
    try:
        base_prices = {
            'IAM.CS': 112.50,
            'ATW.CS': 485.00,
            'BCP.CS': 295.00,
            'MNG.CS': 2450.00,
            'AFMA.CS': 1450.00,
            'BOA.CS': 190.0,
            'CIM.CS': 1800.0,
            'BCI.CS': 290.0,
            'CFG.CS': 165.0
        }
        price = base_prices.get(symbol_upper, 150.0)
        price += random.uniform(-0.5, 0.5)
        change_24h = round(random.uniform(-1.5, 1.5), 2)
        
        result = {
            'symbol': symbol_upper,
            'price': round(price, 2),
            'change_24h': change_24h,
            'timestamp': datetime.now().isoformat(),
            'source': 'FALLBACK'
        }
        _set_to_cache(cache_key, result)
        return result
    except Exception as e:
        logger.error(f"[MoroccoPrice] Fallback failure: {str(e)}")
        return {
            'symbol': symbol_upper,
            'price': 150.0,
            'change_24h': 0.0,
            'timestamp': datetime.now().isoformat(),
            'source': 'CRITICAL'
        }
