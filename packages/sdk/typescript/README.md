# @robloxforge/sdk

Official TypeScript/JavaScript SDK for the [RobloxForge](https://robloxforge.com) API.

## Installation

```bash
npm install @robloxforge/sdk
```

## Quick Start

```typescript
import { RobloxForge, terrainPlugin, assetsPlugin, marketplacePlugin } from '@robloxforge/sdk'

const rf = new RobloxForge({ apiKey: 'rf_sk_your_key' })

// Generate terrain
const terrain = terrainPlugin(rf)
const build = await terrain.generate({
  prompt: 'Dense jungle with rivers and ancient ruins',
  style: 'realistic',
  size: 2048,
})

// Wait for build to complete
const result = await terrain.waitForBuild(build.buildId)
console.log('Download:', result.downloadUrl)

// Search marketplace
const market = marketplacePlugin(rf)
const templates = await market.search({ query: 'tycoon', category: 'GAME_TEMPLATE' })
```

## API Keys

Generate keys at [robloxforge.com/settings/api-keys](https://robloxforge.com/settings/api-keys).

## Documentation

Full API reference at [robloxforge.com/docs](https://robloxforge.com/docs).
