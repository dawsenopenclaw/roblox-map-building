import '@testing-library/jest-dom'
import { vi } from 'vitest'

// server-only throws when imported outside of a Next.js server context.
// In vitest (happy-dom environment) we mock it to a no-op so server-side
// modules like env.ts can be imported without crashing.
vi.mock('server-only', () => ({}))

// Suppress console noise in tests
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
