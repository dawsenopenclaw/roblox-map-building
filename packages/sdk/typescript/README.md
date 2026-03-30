# @forjegames/sdk

Official TypeScript/JavaScript SDK for the [ForjeGames](https://forjegames.com) API.

## Installation

```bash
npm install @forjegames/sdk
```

## Quick Start

```typescript
import { ForjeGames, terrainPlugin, assetsPlugin, marketplacePlugin } from '@forjegames/sdk'

const rf = new ForjeGames({ apiKey: 'rf_sk_your_key' })

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

Generate keys at [forjegames.com/settings/api-keys](https://forjegames.com/settings/api-keys).

## Documentation

Full API reference at [forjegames.com/docs](https://forjegames.com/docs).
