"""Marketplace search and purchase methods for the RobloxForge SDK."""

from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from .client import Client


class Template:
    def __init__(self, data: dict):
        self.id: str = data["id"]
        self.title: str = data["title"]
        self.description: str = data.get("description", "")
        self.category: str = data["category"]
        self.price_cents: int = data["priceCents"]
        self.thumbnail_url: Optional[str] = data.get("thumbnailUrl")
        self.downloads: int = data.get("downloads", 0)
        self.average_rating: float = data.get("averageRating", 0.0)

    @property
    def price_usd(self) -> str:
        return f"${self.price_cents / 100:.2f}"

    def __repr__(self):
        return f"<Template id={self.id} title={self.title!r} price={self.price_usd}>"


class MarketplaceClient:
    def __init__(self, client: "Client"):
        self._client = client

    def search(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        sort_by: str = "popular",
        page: int = 1,
        limit: int = 20,
    ) -> List[Template]:
        """
        Search templates on the marketplace.

        Args:
            query: Search text
            category: Filter by category
            sort_by: Sort order (newest, popular, rating, price_asc, price_desc)
            page: Page number
            limit: Results per page (max 50)

        Returns:
            List of Template objects
        """
        params = []
        if query:
            params.append(f"q={query}")
        if category:
            params.append(f"category={category}")
        params.append(f"sort={sort_by}")
        params.append(f"page={page}")
        params.append(f"limit={limit}")

        qs = "&".join(params)
        data = self._client.request("GET", f"/api/marketplace/search?{qs}")
        return [Template(t) for t in data.get("templates", [])]

    def get(self, template_id: str) -> Template:
        """Get a single template by ID."""
        data = self._client.request("GET", f"/api/marketplace/templates/{template_id}")
        return Template(data)

    def purchase(self, template_id: str) -> dict:
        """
        Purchase a template.

        Returns:
            dict with purchaseId and downloadUrl
        """
        return self._client.request(
            "POST", f"/api/marketplace/templates/{template_id}/purchase"
        )
