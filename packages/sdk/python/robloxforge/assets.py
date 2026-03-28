"""Asset generation methods for the RobloxForge SDK."""

from typing import TYPE_CHECKING, Optional, Literal

if TYPE_CHECKING:
    from .client import Client


class GeneratedAsset:
    def __init__(self, data: dict):
        self.asset_id: str = data["assetId"]
        self.type: str = data["type"]
        self.name: str = data.get("name", "Untitled")
        self.download_url: Optional[str] = data.get("downloadUrl")
        self.thumbnail_url: Optional[str] = data.get("thumbnailUrl")
        self.status: str = data.get("status", "queued")
        self.tokens_used: Optional[int] = data.get("tokensUsed")

    def __repr__(self):
        return f"<GeneratedAsset id={self.asset_id} type={self.type} status={self.status}>"


class AssetsClient:
    def __init__(self, client: "Client"):
        self._client = client

    def generate(
        self,
        prompt: str,
        asset_type: Literal["mesh", "texture", "sound", "script"] = "mesh",
        style: Optional[str] = None,
    ) -> GeneratedAsset:
        """
        Generate an asset from a text prompt.

        Args:
            prompt: Description of the asset to generate
            asset_type: Type of asset (mesh, texture, sound, script)
            style: Optional style modifier

        Returns:
            GeneratedAsset with asset ID and initial status
        """
        payload: dict = {"prompt": prompt, "type": asset_type}
        if style:
            payload["style"] = style
        data = self._client.request("POST", "/api/ai/generate/asset", payload)
        return GeneratedAsset(data)

    def get(self, asset_id: str) -> GeneratedAsset:
        """Get an existing asset by ID."""
        data = self._client.request("GET", f"/api/ai/generate/asset/{asset_id}")
        return GeneratedAsset(data)
