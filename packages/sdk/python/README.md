# forjegames

Official Python SDK for the [ForjeGames](https://forjegames.com) API.

## Installation

```bash
pip install forjegames
```

## Quick Start

```python
import forjegames

rf = forjegames.Client(api_key="rf_sk_your_key")

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

Generate keys at [forjegames.com/settings/api-keys](https://forjegames.com/settings/api-keys).

## Documentation

Full API reference at [forjegames.com/docs](https://forjegames.com/docs).
