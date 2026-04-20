export interface Specialist {
  /** Unique ID (kebab-case) */
  id: string
  /** Display name shown to user */
  name: string
  /** One-line description */
  description: string
  /** Keywords that trigger this specialist (lowercase) */
  keywords: string[]
  /** Domain categories for RAG filtering */
  ragCategories: string[]
  /** Expert prompt injected before the base system prompt */
  prompt: string
}
