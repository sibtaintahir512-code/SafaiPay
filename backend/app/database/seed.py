"""Database seeding utility for SafaiPay."""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
try:
    from database.seed import seed_database
except ImportError:
    async def seed_database():
        pass

__all__ = ["seed_database"]
