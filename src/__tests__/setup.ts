import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Suppress console noise in tests
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
