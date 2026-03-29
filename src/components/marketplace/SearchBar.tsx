'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300
const MAX_RECENT = 5
const STORAGE_KEY = 'robloxforge:recent-searches'

const POPULAR_SEARCHES = [
  'medieval castle',
  'obby course',
  'tycoon template',
  'horror map',
  'racing track',
  'roleplay city',
  'battle royale',
  'anime UI kit',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return
  const existing = getRecentSearches().filter((s) => s !== query)
  const updated = [query, ...existing].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}

function removeRecentSearch(query: string) {
  const updated = getRecentSearches().filter((s) => s !== query)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value?: string
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
  autoFocus?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchBar({
  value = '',
  placeholder = 'Search templates, maps, scripts...',
  onSearch,
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isComposingRef = useRef(false)

  // Sync controlled value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search trigger
  const triggerSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearch(q)
      }, DEBOUNCE_MS)
    },
    [onSearch]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setInputValue(q)
    setActiveIndex(-1)
    setIsOpen(true)
    if (!isComposingRef.current) {
      triggerSearch(q)
    }
  }

  function handleFocus() {
    setRecentSearches(getRecentSearches())
    setIsOpen(true)
  }

  function handleClear() {
    setInputValue('')
    setIsOpen(false)
    setActiveIndex(-1)
    onSearch('')
    inputRef.current?.focus()
  }

  function handleSelectSuggestion(suggestion: string) {
    setInputValue(suggestion)
    setIsOpen(false)
    setActiveIndex(-1)
    saveRecentSearch(suggestion)
    setRecentSearches(getRecentSearches())
    // Immediate search, cancel pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSearch(suggestion)
  }

  function handleRemoveRecent(e: React.MouseEvent, suggestion: string) {
    e.stopPropagation()
    removeRecentSearch(suggestion)
    setRecentSearches(getRecentSearches())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = inputValue.trim()
    if (q) {
      saveRecentSearch(q)
      setRecentSearches(getRecentSearches())
    }
    setIsOpen(false)
    onSearch(q)
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return

    const allSuggestions = buildSuggestions()
    const total = allSuggestions.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? total - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && allSuggestions[activeIndex]) {
        e.preventDefault()
        handleSelectSuggestion(allSuggestions[activeIndex].label)
      }
      // else fall through to form submit
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  type SuggestionItem = { label: string; type: 'recent' | 'popular' }

  function buildSuggestions(): SuggestionItem[] {
    const q = inputValue.toLowerCase()
    const recents: SuggestionItem[] = recentSearches
      .filter((s) => !q || s.toLowerCase().includes(q))
      .map((s) => ({ label: s, type: 'recent' as const }))
    const popular: SuggestionItem[] = POPULAR_SEARCHES.filter(
      (s) => !q || s.toLowerCase().includes(q)
    )
      .filter((s) => !recentSearches.includes(s))
      .slice(0, 5)
      .map((s) => ({ label: s, type: 'popular' as const }))
    return [...recents, ...popular]
  }

  const suggestions = buildSuggestions()
  const showDropdown = isOpen && suggestions.length > 0

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <div
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200
            bg-white/5 border-white/10 hover:border-white/20
            focus-within:border-white/30 focus-within:bg-white/8 focus-within:ring-2 focus-within:ring-white/10
          `}
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" aria-hidden="true" />

          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false
              triggerSearch((e.target as HTMLInputElement).value)
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            className="
              flex-1 bg-transparent text-white placeholder:text-white/30
              text-sm outline-none min-w-0
              [&::-webkit-search-cancel-button]:hidden
              [&::-webkit-search-decoration]:hidden
            "
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="
                shrink-0 p-0.5 rounded-full text-white/40 hover:text-white/70
                hover:bg-white/10 transition-colors duration-150
              "
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="
            absolute top-full left-0 right-0 mt-2 z-50
            bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl
            overflow-hidden
          "
        >
          {/* Recent searches section */}
          {suggestions.some((s) => s.type === 'recent') && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-white/30 uppercase tracking-wider">
                Recent
              </div>
              {suggestions
                .filter((s) => s.type === 'recent')
                .map((suggestion, idx) => {
                  const globalIdx = idx
                  return (
                    <SuggestionRow
                      key={`recent-${suggestion.label}`}
                      id={`suggestion-${globalIdx}`}
                      label={suggestion.label}
                      icon={<Clock className="w-3.5 h-3.5 text-white/30" />}
                      isActive={activeIndex === globalIdx}
                      onClick={() => handleSelectSuggestion(suggestion.label)}
                      onRemove={(e) => handleRemoveRecent(e, suggestion.label)}
                      showRemove
                    />
                  )
                })}
            </div>
          )}

          {/* Popular searches section */}
          {suggestions.some((s) => s.type === 'popular') && (
            <div>
              {suggestions.some((s) => s.type === 'recent') && (
                <div className="h-px bg-white/5 mx-3" />
              )}
              <div className="px-3 py-2 text-xs font-medium text-white/30 uppercase tracking-wider">
                Popular
              </div>
              {suggestions
                .filter((s) => s.type === 'popular')
                .map((suggestion) => {
                  const globalIdx = suggestions.indexOf(suggestion)
                  return (
                    <SuggestionRow
                      key={`popular-${suggestion.label}`}
                      id={`suggestion-${globalIdx}`}
                      label={suggestion.label}
                      icon={<TrendingUp className="w-3.5 h-3.5 text-white/30" />}
                      isActive={activeIndex === globalIdx}
                      onClick={() => handleSelectSuggestion(suggestion.label)}
                    />
                  )
                })}
            </div>
          )}

          <div className="h-1" />
        </div>
      )}
    </div>
  )
}

// ─── SuggestionRow ────────────────────────────────────────────────────────────

interface SuggestionRowProps {
  id: string
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  onRemove?: (e: React.MouseEvent) => void
  showRemove?: boolean
}

function SuggestionRow({ id, label, icon, isActive, onClick, onRemove, showRemove }: SuggestionRowProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-100
        ${isActive ? 'bg-white/8' : 'hover:bg-white/5'}
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-white/70 truncate">{label}</span>
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove "${label}" from recent searches`}
          className="
            shrink-0 opacity-0 group-hover:opacity-100
            p-0.5 rounded text-white/30 hover:text-white/60 transition-all duration-100
          "
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
