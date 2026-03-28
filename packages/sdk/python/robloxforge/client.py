"""Core HTTP client for the RobloxForge API."""

import json
import urllib.request
import urllib.error
from typing import Any, Optional

from .terrain import TerrainClient
from .assets import AssetsClient
from .marketplace import MarketplaceClient


class RobloxForgeError(Exception):
    """Raised when the API returns an error response."""

    def __init__(self, message: str, status: int = 0):
        super().__init__(message)
        self.status = status


class Client:
    """
    Main entry point for the RobloxForge SDK.

    Args:
        api_key: Your RobloxForge API key (rf_sk_...)
        base_url: Override the API base URL (default: https://api.robloxforge.com)
        timeout: Request timeout in seconds (default: 30)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.robloxforge.com",
        timeout: int = 30,
    ):
        if not api_key:
            raise ValueError("api_key is required")
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

        self.terrain = TerrainClient(self)
        self.assets = AssetsClient(self)
        self.marketplace = MarketplaceClient(self)

    def request(
        self,
        method: str,
        path: str,
        data: Optional[dict] = None,
    ) -> Any:
        """
        Make an authenticated HTTP request to the API.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: API path (e.g., /api/ai/generate/terrain)
            data: Request body (will be JSON-encoded for POST/PUT)

        Returns:
            Parsed JSON response

        Raises:
            RobloxForgeError: On API or HTTP error
        """
        url = f"{self._base_url}{path}"
        body = json.dumps(data).encode("utf-8") if data else None

        req = urllib.request.Request(
            url,
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                "User-Agent": "robloxforge-python/1.0.0",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                msg = err_body.get("error", str(e))
            except Exception:
                msg = str(e)
            raise RobloxForgeError(msg, status=e.code) from e
        except urllib.error.URLError as e:
            raise RobloxForgeError(str(e.reason)) from e
