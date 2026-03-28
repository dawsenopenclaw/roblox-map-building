# robloxforge

Official Python SDK for the [RobloxForge](https://robloxforge.com) API.

## Installation

```bash
pip install robloxforge
```

## Quick Start

```python
import robloxforge

rf = robloxforge.Client(api_key="rf_sk_your_key")

# Generate terrain
build = rf.terrain.generate(
    prompt="Dense jungle with rivers and ancient ruins",
    style="realistic",
    size=2048,
)
print(f"Build queued: {build.build_id}")

# Wait for completion
result = rf.terrain.wait_for_build(build.build_id)
print(f"Download: {result.download_url}")

# Search marketplace
templates = rf.marketplace.search(query="tycoon", category="GAME_TEMPLATE")
for t in templates:
    print(t.title, t.price_usd)
```

## API Keys

Generate keys at [robloxforge.com/settings/api-keys](https://robloxforge.com/settings/api-keys).

## Documentation

Full API reference at [robloxforge.com/docs](https://robloxforge.com/docs).
