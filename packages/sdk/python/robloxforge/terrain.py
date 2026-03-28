"""Terrain generation methods for the RobloxForge SDK."""

import time
from typing import TYPE_CHECKING, Optional, Literal

if TYPE_CHECKING:
    from .client import Client


class TerrainBuild:
    def __init__(self, data: dict):
        self.build_id: str = data["buildId"]
        self.status: str = data["status"]
        self.estimated_seconds: int = data.get("estimatedSeconds", 60)
        self.download_url: Optional[str] = data.get("downloadUrl")
        self.tokens_used: Optional[int] = data.get("tokensUsed")

    def __repr__(self):
        return f"<TerrainBuild id={self.build_id} status={self.status}>"


class TerrainClient:
    def __init__(self, client: "Client"):
        self._client = client

    def generate(
        self,
        prompt: str,
        style: Literal["realistic", "cartoon", "lowpoly"] = "realistic",
        size: int = 1024,
        seed: Optional[int] = None,
    ) -> TerrainBuild:
        """
        Generate a Roblox terrain map from a text prompt.

        Args:
            prompt: Natural language description of the terrain
            style: Art style (realistic, cartoon, lowpoly)
            size: Map size in studs (512-4096)
            seed: Optional random seed for reproducibility

        Returns:
            TerrainBuild with build ID and initial status
        """
        payload = {"prompt": prompt, "style": style, "size": size}
        if seed is not None:
            payload["seed"] = seed

        data = self._client.request("POST", "/api/ai/generate/terrain", payload)
        return TerrainBuild(data)

    def get(self, build_id: str) -> TerrainBuild:
        """Get status of an existing terrain build."""
        data = self._client.request("GET", f"/api/ai/generate/terrain/{build_id}")
        return TerrainBuild(data)

    def wait_for_build(
        self,
        build_id: str,
        poll_interval: float = 2.0,
        timeout: float = 120.0,
    ) -> TerrainBuild:
        """
        Poll until a build completes or fails.

        Args:
            build_id: Build ID from generate()
            poll_interval: Seconds between polls (default 2.0)
            timeout: Max wait time in seconds (default 120.0)

        Returns:
            Completed or failed TerrainBuild

        Raises:
            TimeoutError: If build doesn't complete within timeout
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            build = self.get(build_id)
            if build.status in ("complete", "failed"):
                return build
            time.sleep(poll_interval)
        raise TimeoutError(f"Build {build_id} timed out after {timeout}s")
