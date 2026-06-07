"""
cache.py — простий in-memory TTL-кеш для важких COT-ендпоінтів.

COT-дані оновлюються раз на тиждень, тож немає сенсу ходити в БД на кожне
завантаження сторінки. Кешуємо результат на короткий час, а після оновлення
даних воркером кеш скидається явно (clear_cache).
"""

import time

_store = {}


def cached(key, ttl_seconds, producer):
    """Повертає закешоване значення за ключем, або обчислює його через producer()."""
    now = time.time()
    hit = _store.get(key)
    if hit is not None and (now - hit[0]) < ttl_seconds:
        return hit[1]
    value = producer()
    _store[key] = (now, value)
    return value


def clear_cache():
    """Скидає весь кеш (викликати після оновлення даних воркером)."""
    _store.clear()
