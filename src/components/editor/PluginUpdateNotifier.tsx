'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PluginVersionInfo {
  version: string
  minVersion: string
  changelog: string
  downloadUrl: string
  forceUpdate: boolean
}

interface PluginUpdateNotifierProps {
  /** How often to check for plugin updates (ms). Default: 5 minutes */
  pollIntervalMs?: number
  /** Called when a new plugin version is detected */
  onUpdateAvailable?: (info: PluginVersionInfo) => void
}

/**
 * PluginUpdateNotifier — polls /api/studio/version and fires a callback
 * when a new plugin version is published. Designed to be mounted in the
 * editor so connected users get instant notification that their plugin
 * will auto-update (or needs manual update if auto-update fails).
 *
 * This component renders nothing — it's a pure side-effect hook.
 */
export function PluginUpdateNotifier({
  pollIntervalMs = 5 * 60 * 1000,
  onUpdateAvailable,
}: PluginUpdateNotifierProps) {
  const lastKnownVersion = useRef<string | null>(null)
  const onUpdateRef = useRef(onUpdateAvailable)
  onUpdateRef.current = onUpdateAvailable

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/version', {
        cache: 'no-store',
        headers: { 'X-Source': 'plugin-update-notifier' },
      })
      if (!res.ok) return

      const data: PluginVersionInfo = await res.json()
      if (!data.version) return

      // On first check, just record the version
      if (lastKnownVersion.current === null) {
        lastKnownVersion.current = data.version
        return
      }

      // If version changed since last check, notify
      if (data.version !== lastKnownVersion.current) {
        lastKnownVersion.current = data.version
        onUpdateRef.current?.(data)
      }
    } catch {
      // Silent — network errors are expected during deploys
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkVersion()

    // Poll on interval
    const interval = setInterval(checkVersion, pollIntervalMs)
    return () => clearInterval(interval)
  }, [checkVersion, pollIntervalMs])

  return null
}
