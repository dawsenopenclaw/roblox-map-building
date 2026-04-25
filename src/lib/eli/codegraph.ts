/**
 * CodeGraph — Build Knowledge Graph
 *
 * Maps relationships between architectural components, materials, and
 * patterns so the AI can learn what goes well together. When someone
 * builds a "medieval castle", the graph knows: castle → (needs towers,
 * drawbridge, courtyard), towers → (Brick/Cobblestone, crenellations,
 * torches), drawbridge → (WedgePart, HingeConstraint, chains).
 *
 * Used by the build prompt to inject relevant component suggestions
 * and by the auditor to validate completeness.
 */

import 'server-only'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  type: 'category' | 'component' | 'material' | 'technique' | 'detail'
  /** Average quality score when this node appears in successful builds */
  avgScore: number
  /** How often this node appears in builds */
  frequency: number
}

export interface GraphEdge {
  from: string
  to: string
  relation: 'requires' | 'suggests' | 'pairs_with' | 'uses_material' | 'uses_technique'
  weight: number // 0-1, how strong the relationship is
}

export interface CodeGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  version: number
}

// ─── Bootstrap Knowledge ────────────────────────────────────────────────────
// Seed the graph with architectural knowledge so it works from day one.

const BOOTSTRAP_NODES: GraphNode[] = [
  // Categories
  { id: 'house', label: 'House', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'castle', label: 'Castle', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'modern', label: 'Modern Building', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'medieval', label: 'Medieval', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'cottage', label: 'Cottage', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'mansion', label: 'Mansion', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'shop', label: 'Shop/Store', type: 'category', avgScore: 0, frequency: 0 },
  { id: 'cabin', label: 'Cabin', type: 'category', avgScore: 0, frequency: 0 },

  // Components (the building blocks of quality)
  { id: 'foundation', label: 'Foundation', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'baseboard', label: 'Baseboard Trim', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'crown_trim', label: 'Crown Trim', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'corner_post', label: 'Corner Posts', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'window_frame', label: 'Window Frame (4-piece)', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'window_mullion', label: 'Window Mullion', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'window_sill', label: 'Window Sill', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'door_panel', label: 'Door Panel (recessed)', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'door_frame', label: 'Door Frame', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'door_overhang', label: 'Door Overhang/Awning', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'door_knob', label: 'Door Knob', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'front_steps', label: 'Front Steps', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'gable_roof', label: 'Gable Roof', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'flat_roof', label: 'Flat Roof w/ Parapet', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'roof_ridge', label: 'Roof Ridge Beam', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'roof_fascia', label: 'Roof Fascia Board', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'chimney', label: 'Chimney + Cap + Pot', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'porch', label: 'Porch w/ Columns', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'balcony', label: 'Balcony w/ Railing', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'pathway', label: 'Pathway to Door', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'tree', label: 'Tree (Cyl+Ball)', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'lamp_post', label: 'Lamp Post w/ Light', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'fence', label: 'Fence/Hedge', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'interior_furniture', label: 'Interior Furniture', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'bookshelf', label: 'Bookshelf', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'ceiling_light', label: 'Ceiling Light', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'shutters', label: 'Window Shutters', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'flower_box', label: 'Flower Box', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'tower', label: 'Tower', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'drawbridge', label: 'Drawbridge', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'courtyard', label: 'Courtyard', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'glass_wall', label: 'Floor-to-Ceiling Glass', type: 'component', avgScore: 0, frequency: 0 },
  { id: 'garage', label: 'Garage', type: 'component', avgScore: 0, frequency: 0 },

  // Materials
  { id: 'mat_brick', label: 'Brick', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_wood', label: 'Wood/WoodPlanks', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_concrete', label: 'Concrete', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_slate', label: 'Slate', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_glass', label: 'Glass', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_cobblestone', label: 'Cobblestone', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_granite', label: 'Granite', type: 'material', avgScore: 0, frequency: 0 },
  { id: 'mat_metal', label: 'Metal', type: 'material', avgScore: 0, frequency: 0 },

  // Techniques
  { id: 'tech_vc', label: 'Color Variation (vc())', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_terrain', label: 'Terrain Ground', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_lighting', label: 'AAA Lighting Stack', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_particles', label: 'Particle Effects', type: 'technique', avgScore: 0, frequency: 0 },
  { id: 'tech_interactive', label: 'ProximityPrompt/Click', type: 'technique', avgScore: 0, frequency: 0 },

  // Detail parts (the things that make builds NOT look like boxes)
  { id: 'detail_trim', label: 'Trim Details', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_overhang', label: 'Roof Overhang', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_landscaping', label: 'Landscaping', type: 'detail', avgScore: 0, frequency: 0 },
  { id: 'detail_silhouette', label: 'Silhouette Breaking', type: 'detail', avgScore: 0, frequency: 0 },
]

const BOOTSTRAP_EDGES: GraphEdge[] = [
  // House requires these core components
  { from: 'house', to: 'foundation', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'baseboard', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'crown_trim', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'corner_post', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'window_frame', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'window_sill', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'window_mullion', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'door_frame', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'door_panel', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'door_knob', relation: 'requires', weight: 0.8 },
  { from: 'house', to: 'door_overhang', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'front_steps', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'gable_roof', relation: 'requires', weight: 0.9 },
  { from: 'house', to: 'roof_ridge', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'roof_fascia', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'chimney', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'pathway', relation: 'suggests', weight: 0.7 },
  { from: 'house', to: 'tree', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'lamp_post', relation: 'suggests', weight: 0.5 },
  { from: 'house', to: 'interior_furniture', relation: 'suggests', weight: 0.6 },
  { from: 'house', to: 'ceiling_light', relation: 'requires', weight: 0.8 },

  // Cottage specifics
  { from: 'cottage', to: 'house', relation: 'requires', weight: 1.0 },
  { from: 'cottage', to: 'chimney', relation: 'requires', weight: 0.9 },
  { from: 'cottage', to: 'flower_box', relation: 'suggests', weight: 0.7 },
  { from: 'cottage', to: 'shutters', relation: 'suggests', weight: 0.7 },
  { from: 'cottage', to: 'porch', relation: 'suggests', weight: 0.6 },

  // Castle
  { from: 'castle', to: 'tower', relation: 'requires', weight: 0.9 },
  { from: 'castle', to: 'courtyard', relation: 'suggests', weight: 0.7 },
  { from: 'castle', to: 'drawbridge', relation: 'suggests', weight: 0.6 },
  { from: 'castle', to: 'foundation', relation: 'requires', weight: 0.9 },

  // Modern
  { from: 'modern', to: 'glass_wall', relation: 'suggests', weight: 0.8 },
  { from: 'modern', to: 'flat_roof', relation: 'suggests', weight: 0.7 },
  { from: 'modern', to: 'garage', relation: 'suggests', weight: 0.6 },
  { from: 'modern', to: 'foundation', relation: 'requires', weight: 0.9 },

  // Mansion
  { from: 'mansion', to: 'house', relation: 'requires', weight: 1.0 },
  { from: 'mansion', to: 'balcony', relation: 'suggests', weight: 0.8 },
  { from: 'mansion', to: 'porch', relation: 'requires', weight: 0.8 },
  { from: 'mansion', to: 'garage', relation: 'suggests', weight: 0.7 },

  // Material relationships
  { from: 'house', to: 'mat_brick', relation: 'uses_material', weight: 0.8 },
  { from: 'house', to: 'mat_wood', relation: 'uses_material', weight: 0.9 },
  { from: 'house', to: 'mat_concrete', relation: 'uses_material', weight: 0.7 },
  { from: 'house', to: 'mat_glass', relation: 'uses_material', weight: 0.8 },
  { from: 'house', to: 'mat_slate', relation: 'uses_material', weight: 0.7 },
  { from: 'castle', to: 'mat_cobblestone', relation: 'uses_material', weight: 0.9 },
  { from: 'castle', to: 'mat_granite', relation: 'uses_material', weight: 0.7 },
  { from: 'medieval', to: 'mat_cobblestone', relation: 'uses_material', weight: 0.9 },
  { from: 'modern', to: 'mat_concrete', relation: 'uses_material', weight: 0.9 },
  { from: 'modern', to: 'mat_glass', relation: 'uses_material', weight: 0.9 },

  // Technique associations
  { from: 'house', to: 'tech_vc', relation: 'uses_technique', weight: 0.9 },
  { from: 'house', to: 'tech_lighting', relation: 'uses_technique', weight: 0.8 },
  { from: 'house', to: 'tech_terrain', relation: 'uses_technique', weight: 0.7 },

  // Detail relationships
  { from: 'baseboard', to: 'detail_trim', relation: 'pairs_with', weight: 0.9 },
  { from: 'crown_trim', to: 'detail_trim', relation: 'pairs_with', weight: 0.9 },
  { from: 'corner_post', to: 'detail_trim', relation: 'pairs_with', weight: 0.8 },
  { from: 'roof_fascia', to: 'detail_overhang', relation: 'pairs_with', weight: 0.9 },
  { from: 'pathway', to: 'detail_landscaping', relation: 'pairs_with', weight: 0.8 },
  { from: 'tree', to: 'detail_landscaping', relation: 'pairs_with', weight: 0.8 },
  { from: 'chimney', to: 'detail_silhouette', relation: 'pairs_with', weight: 0.7 },
  { from: 'balcony', to: 'detail_silhouette', relation: 'pairs_with', weight: 0.8 },
  { from: 'porch', to: 'detail_silhouette', relation: 'pairs_with', weight: 0.7 },
]

// ─── Graph instance (singleton) ─────────────────────────────────────────────

let graph: CodeGraph | null = null

export function getCodeGraph(): CodeGraph {
  if (graph) return graph

  const nodes = new Map<string, GraphNode>()
  for (const node of BOOTSTRAP_NODES) {
    nodes.set(node.id, { ...node })
  }

  graph = {
    nodes,
    edges: [...BOOTSTRAP_EDGES],
    version: 1,
  }

  return graph
}

// ─── Query helpers ──────────────────────────────────────────────────────────

/**
 * Get all components that a category requires or suggests.
 * Returns them sorted by weight (highest first).
 */
export function getComponentsForCategory(category: string): Array<{ node: GraphNode; relation: string; weight: number }> {
  const g = getCodeGraph()
  const results: Array<{ node: GraphNode; relation: string; weight: number }> = []

  for (const edge of g.edges) {
    if (edge.from === category && (edge.relation === 'requires' || edge.relation === 'suggests')) {
      const target = g.nodes.get(edge.to)
      if (target && (target.type === 'component' || target.type === 'detail')) {
        results.push({ node: target, relation: edge.relation, weight: edge.weight })
      }
    }
  }

  // If category inherits from another (e.g. cottage → house), include parent's components
  for (const edge of g.edges) {
    if (edge.from === category && edge.relation === 'requires') {
      const target = g.nodes.get(edge.to)
      if (target?.type === 'category') {
        const parentComponents = getComponentsForCategory(edge.to)
        for (const pc of parentComponents) {
          if (!results.some(r => r.node.id === pc.node.id)) {
            results.push({ ...pc, weight: pc.weight * edge.weight })
          }
        }
      }
    }
  }

  return results.sort((a, b) => b.weight - a.weight)
}

/**
 * Get materials that pair well with a category.
 */
export function getMaterialsForCategory(category: string): string[] {
  const g = getCodeGraph()
  return g.edges
    .filter(e => e.from === category && e.relation === 'uses_material')
    .sort((a, b) => b.weight - a.weight)
    .map(e => g.nodes.get(e.to)?.label ?? '')
    .filter(Boolean)
}

/**
 * Format the graph's knowledge as a prompt injection for a specific build request.
 * This tells the AI exactly what components and materials to include.
 */
export function formatGraphPrompt(userPrompt: string): string {
  const lower = userPrompt.toLowerCase()

  // Detect category from user prompt
  let category: string | null = null
  if (/\b(cottage|cozy|rustic)\b/.test(lower)) category = 'cottage'
  else if (/\b(mansion|luxury|villa|estate)\b/.test(lower)) category = 'mansion'
  else if (/\b(castle|fortress|keep|citadel)\b/.test(lower)) category = 'castle'
  else if (/\b(modern|contemporary|minimalist)\b/.test(lower)) category = 'modern'
  else if (/\b(medieval|timber|half.?timber)\b/.test(lower)) category = 'medieval'
  else if (/\b(cabin|lodge|log)\b/.test(lower)) category = 'cabin'
  else if (/\b(shop|store|boutique|market)\b/.test(lower)) category = 'shop'
  else if (/\b(house|home|building|residence)\b/.test(lower)) category = 'house'

  if (!category) return ''

  const components = getComponentsForCategory(category)
  const materials = getMaterialsForCategory(category)

  if (components.length === 0) return ''

  const required = components.filter(c => c.relation === 'requires').map(c => c.node.label)
  const suggested = components.filter(c => c.relation === 'suggests').map(c => c.node.label)

  let prompt = `\n[CODEGRAPH] Build type: ${category.toUpperCase()}`
  if (required.length) prompt += `\nREQUIRED components: ${required.join(', ')}`
  if (suggested.length) prompt += `\nSUGGESTED components (add as many as possible): ${suggested.join(', ')}`
  if (materials.length) prompt += `\nBest materials: ${materials.join(', ')}`

  return prompt
}

// ─── Learning: update graph from build outcomes ─────────────────────────────

/**
 * Record a successful build pattern into the graph.
 * Increases frequency and score for components that appeared in high-quality builds.
 */
export function recordBuildSuccess(
  category: string,
  detectedComponents: string[],
  score: number,
): void {
  const g = getCodeGraph()

  // Update category node
  const catNode = g.nodes.get(category)
  if (catNode) {
    catNode.frequency++
    catNode.avgScore = (catNode.avgScore * (catNode.frequency - 1) + score) / catNode.frequency
  }

  // Update component nodes
  for (const comp of detectedComponents) {
    const node = g.nodes.get(comp)
    if (node) {
      node.frequency++
      node.avgScore = (node.avgScore * (node.frequency - 1) + score) / node.frequency
    }
  }
}

/**
 * Detect which graph components appear in a piece of Luau code.
 * Used to update the graph after successful builds.
 */
export function detectComponentsInCode(code: string): string[] {
  const lower = code.toLowerCase()
  const found: string[] = []

  const detectors: Array<[string, RegExp]> = [
    ['foundation', /foundation/],
    ['baseboard', /baseboard/],
    ['crown_trim', /crown|molding/],
    ['corner_post', /corner.*(?:post|pillar|column)/],
    ['window_frame', /win.*frame|frame.*win/],
    ['window_mullion', /mullion|cross.*bar/],
    ['window_sill', /sill/],
    ['door_panel', /door.*panel/],
    ['door_frame', /door.*frame|frame.*door/],
    ['door_overhang', /awning|overhang|canopy/],
    ['door_knob', /knob|handle/],
    ['front_steps', /step|stair/],
    ['gable_roof', /wedgepart|W\(/i],
    ['roof_ridge', /ridge/],
    ['roof_fascia', /fascia/],
    ['chimney', /chimney/],
    ['porch', /porch|veranda/],
    ['balcony', /balcony|railing/],
    ['pathway', /path|walkway|sidewalk/],
    ['tree', /trunk.*canopy|tree/],
    ['lamp_post', /lamp.*post|streetlight|lamppost/],
    ['fence', /fence|hedge/],
    ['interior_furniture', /table|chair|couch|bed|desk/],
    ['bookshelf', /bookshelf|shelf/],
    ['ceiling_light', /pointlight|spotlight/i],
    ['shutters', /shutter/],
    ['flower_box', /flower.*box|planter/],
    ['glass_wall', /glass.*wall|floor.*ceiling.*glass/],
    ['garage', /garage/],
  ]

  for (const [id, regex] of detectors) {
    if (regex.test(lower)) found.push(id)
  }

  return found
}
