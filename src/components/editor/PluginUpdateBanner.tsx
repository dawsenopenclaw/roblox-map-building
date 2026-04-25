'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PluginUpdateNotifier } from './PluginUpdateNotifier'

/**
 * PluginUpdateBanner — renders the PluginUpdateNotifier and shows a
 * dismissible banner when a new plugin version is published.
 *
 * Mount this in the editor layout. It checks every 2 minutes and shows
 * a gold banner when a new version drops.
 */
export function PluginUpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{
    version: string
    changelog: string
    downloadUrl: string
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const handleUpdate = useCallback(
    (info: { version: string; changelog: string; downloadUrl: string }) => {
      setUpdateInfo(info)
      setDismissed(false)
    },
    []
  )

  return (
    <>
      <PluginUpdateNotifier
        pollIntervalMs={2 * 60 * 1000}
        onUpdateAvailable={handleUpdate}
      />

      <AnimatePresence>
        {updateInfo && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-full mx-4"
          >
            <div className="bg-[#1a1500] border border-[#D4AF37]/40 rounded-xl px-5 py-3 shadow-lg shadow-[#D4AF37]/10 flex items-start gap-3">
              <div className="text-[#D4AF37] text-lg mt-0.5">&#x2B07;</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#D4AF37]">
                  Plugin v{updateInfo.version} available
                </p>
                {updateInfo.changelog && (
                  <p className="text-xs text-[#D4AF37]/70 mt-0.5 truncate">
                    {updateInfo.changelog}
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-1">
                  <a
                    href="/download"
                    className="text-[#D4AF37] underline hover:text-[#FFD166] transition-colors"
                  >
                    Update now
                  </a>
                  {' '}— one click if you&apos;ve installed before.
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none mt-0.5"
                aria-label="Dismiss plugin update notification"
              >
                &times;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
