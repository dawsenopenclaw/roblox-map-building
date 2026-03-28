"""
RobloxForge Python SDK
Official client library for the RobloxForge API.

Usage:
    import robloxforge

    rf = robloxforge.Client(api_key="rf_sk_your_key")
    build = rf.terrain.generate(prompt="Dense jungle with ancient ruins")
"""

from .client import Client
from .terrain import TerrainClient
from .assets import AssetsClient
from .marketplace import MarketplaceClient

__version__ = "1.0.0"
__all__ = ["Client", "TerrainClient", "AssetsClient", "MarketplaceClient"]
