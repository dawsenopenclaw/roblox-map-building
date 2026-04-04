// Notification preferences — stubs (notification infrastructure not yet configured)
export async function getEnabledChannels(..._args: unknown[]) { return [] }
export async function isChannelEnabled(..._args: unknown[]) { return false }
export async function updatePreference(..._args: unknown[]) { /* no-op */ }
export async function getUserPreferences(..._args: unknown[]) { return {} }
export async function bulkUpdatePreferences(..._args: unknown[]) { /* no-op */ }
export async function updatePhone(..._args: unknown[]) { /* no-op */ }
export const DEFAULT_PREFERENCES = {}
