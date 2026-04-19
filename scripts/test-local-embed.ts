import { embedLocal } from './lib/embed-local'

console.log('Testing local embed...')
const start = Date.now()
const v = await embedLocal('how to make a tycoon game in roblox studio')
const elapsed = Date.now() - start
console.log(`Dims: ${v.length} | Time: ${elapsed}ms`)
console.log(`First 5: ${v.slice(0, 5).map(n => n.toFixed(4)).join(', ')}`)
console.log(v.length === 768 ? '✅ 768d — matches pgvector column!' : `❌ Wrong dims: ${v.length}`)
