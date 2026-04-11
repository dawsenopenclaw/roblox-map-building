# ForjeGames i18n Migration Guide

ForjeGames uses [`next-intl`](https://next-intl.dev) for multi-language support. This guide covers how to work with translations as a developer or translator.

## Supported Locales

Defined in `src/i18n/config.ts`:

| Code      | Language             |
| --------- | -------------------- |
| `en`      | English (default / source of truth) |
| `es`      | Español              |
| `pt-BR`   | Português (Brasil)   |
| `fr`      | Français             |
| `de`      | Deutsch              |
| `ja`      | 日本語               |
| `ko`      | 한국어               |
| `zh-CN`   | 中文 (简体)          |
| `ru`      | Русский              |
| `it`      | Italiano             |

To add a new locale, append the code to the `locales` tuple in `src/i18n/config.ts` and add corresponding entries to `localeNames` and `localeFlags`. Then create `src/i18n/messages/<code>.json`.

## File Layout

```
src/i18n/
  config.ts          # Locale list, names, flags, cookie constant
  getMessages.ts     # Server-side loader with fallback-to-English
  messages/
    en.json          # Source of truth — all keys must exist here
    es.json          # Full translation
    pt-BR.json       # Stub (falls back to en for missing keys)
    fr.json
    de.json
    ja.json
    ko.json
    zh-CN.json
    ru.json
    it.json
```

## English Is the Source of Truth

Every translatable string **must** exist in `en.json` first. `getMessages.ts` deep-merges each locale bundle on top of the English bundle, so any key missing from a locale automatically falls back to the English string. This means:

- Translators can ship partial bundles without breaking the UI.
- Developers never need to touch non-English files when adding new strings — just add to `en.json`, and translators will pick it up later.
- Empty strings (`""`) in a locale file are ignored and will fall back to English.

## Key Naming Conventions

Keys are organised by **feature area** (namespace), not by component file. This keeps strings reusable and avoids duplication.

Current namespaces:

- `nav` — top-level site navigation
- `hero` — marketing homepage hero section
- `editor` — chat/editor interface
- `modes` — AI mode chips (Build, Think, Plan, Image, …)
- `common` — generic reusable strings (Save, Cancel, Loading, …)

Rules:

1. Use `camelCase` for keys.
2. Group related strings under a nested object (max 2 levels deep): `hero.ctaPrimary`, not `heroCtaPrimary`.
3. Prefer `common.*` over duplicating generic strings in every namespace.
4. Avoid sentence-length keys. Use descriptive but short names (`subtitle`, not `theLongMarketingSubtitleShownUnderTheTitle`).
5. For pluralisation and interpolation, use ICU MessageFormat — see [next-intl docs](https://next-intl.dev/docs/usage/messages).

## Adding a New Translatable String (Developer Workflow)

1. Add the key to `src/i18n/messages/en.json` under the appropriate namespace.
2. In your component, use the `useTranslations` hook (client) or `getTranslations` (server):

   ```tsx
   'use client'
   import { useTranslations } from 'next-intl'

   export function MyButton() {
     const t = useTranslations('common')
     return <button>{t('save')}</button>
   }
   ```

3. Ship it. Non-English locales will fall back to English until a translator provides the translation.

## Adding / Updating a Translation (Translator Workflow)

1. Open `src/i18n/messages/en.json` to see the canonical key list.
2. Open the target locale file (e.g. `src/i18n/messages/de.json`).
3. Add or update keys, mirroring the structure from `en.json`. You only need to translate keys you have a confident translation for — anything omitted will automatically fall back to English.
4. Do **not** translate ICU placeholders (e.g. `{count}`, `{name}`) or the word "Forje" / "ForjeGames" (brand name).
5. Validate the file is valid JSON before committing.

### Recommended Translation Services

For initial machine translation passes:

- **[DeepL API](https://www.deepl.com/pro-api)** — best quality for European languages (es, pt-BR, fr, de, it, ru). Free tier: 500k chars/month.
- **[Google Cloud Translation v3](https://cloud.google.com/translate/docs)** — broadest language coverage, including ja, ko, zh-CN. Glossary support helps lock brand terms like "Forje".
- **[OpenAI GPT-4o / Claude](https://platform.openai.com)** — best for context-aware translations of marketing copy where tone matters more than literal accuracy.

For production-quality copy (marketing pages, legal, onboarding):

- **[Crowdin](https://crowdin.com)** or **[Lokalise](https://lokalise.com)** — localisation platforms with translator workflows, glossaries, TM, and GitHub integration.
- **Professional translators** via [Gengo](https://gengo.com), [Smartling](https://www.smartling.com), or specialised gaming localisation agencies (e.g. Keywords Studios, Altagram) — recommended for the hero section, pricing page, and any legal/billing strings.

Always have a native speaker review machine-translated marketing copy before shipping — literal translations of taglines like "Describe it. Forje it." rarely land as intended.

## Language Switcher

The `<LanguageSwitcher />` component (`src/components/LanguageSwitcher.tsx`) provides a dropdown with native language names and flag emojis. It:

- Swaps the locale segment in the current URL path.
- Persists the choice to a `forje_locale` cookie (1 year).
- Calls `router.refresh()` so server components re-render with the new locale.

Drop it into `MarketingNav.tsx` or `AppTopNav.tsx` wherever you want the switcher to appear.

## Server-Side Loading

`src/i18n/getMessages.ts` exports an async `getMessages(locale)` helper that returns a message bundle with English fallbacks already merged in. Use it in `app/[locale]/layout.tsx` with `NextIntlClientProvider`:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from '@/i18n/getMessages'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages(locale)
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

## Current Migration Status

- Infrastructure: set up.
- Translated strings: `nav`, `hero`, `modes`, `common`, `editor` (English + full Spanish; stubs for other locales).
- **Not yet migrated**: the rest of the app still hard-codes English strings. Migrate components opportunistically by replacing string literals with `t()` calls, starting with the most user-visible pages (marketing, editor shell, auth).

## Checklist When Adding a New Namespace

- [ ] Add the namespace to `en.json`.
- [ ] Document it in this file (under "Key Naming Conventions").
- [ ] Update translator handoff notes / Crowdin project if applicable.
- [ ] Do **not** add it to the other locale JSON files yet — the fallback will handle them until translations are ready.
